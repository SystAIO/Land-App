import { Router } from 'express';

import type { AuthedRequest } from '../middleware/auth';
import { normalizePhone, isValidIndianPhone } from '../config/constants';
import { signToken } from '../utils/crypto';
import { authMiddleware } from '../middleware/auth';
import { otpLimiter } from '../middleware/rateLimit';
import { query, withTransaction } from '../db/pool';
import config from '../config';
import { publicProfile } from '../utils/mappers';
import type { ProfileRow } from '../utils/mappers';
import asyncHandler from '../utils/asyncHandler';

const SELECT_PROFILE =
  'id, phone, email, name, role, avatar_url, free_listing_used, onboarding_completed, phone_verified, created_at';

const router = Router();

// POST /auth/request-otp — send OTP via MSG91
router.post(
  '/request-otp',
  otpLimiter,
  asyncHandler(async (req, res) => {
    const local = normalizePhone(req.body?.phone);
    if (!isValidIndianPhone(local)) {
      return res
        .status(400)
        .json({ error: 'A valid 10-digit Indian mobile number is required' });
    }
    // Test mode: no SMS provider needed. The app receives a requestId and can
    // verify with the fixed TEST_OTP code. Disabled unless explicitly enabled.
    if (config.testOtpEnabled) {
      return res.json({
        message: 'OTP sent (test mode)',
        requestId: `test-${config.testOtp}`,
      });
    }
    if (!config.msg91Authkey || !config.msg91TemplateId) {
      return res.status(503).json({ error: 'SMS service is not configured.' });
    }

    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { authkey: config.msg91Authkey, 'content-type': 'application/json' },
      body: JSON.stringify({
        template_id: config.msg91TemplateId,
        mobile: `91${local}`,
        otp_expiry: '5',
        otp_length: '6',
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { type?: string; message?: string; request_id?: string }
      | null;

    if (!response.ok || !data) {
      console.error('MSG91 send failed', response.status, data);
      return res.status(502).json({ error: 'Could not send OTP. Please try again.' });
    }
    if (data.type && data.type !== 'success') {
      console.error('MSG91 rejected request', data);
      return res.status(502).json({ error: data.message || 'Could not send OTP.' });
    }
    return res.json({ message: 'OTP sent', requestId: data.request_id ?? null });
  })
);

// POST /auth/verify-otp — verify MSG91 OTP, find/create profile, issue JWT
router.post(
  '/verify-otp',
  otpLimiter,
  asyncHandler(async (req, res) => {
    const local = normalizePhone(req.body?.phone);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const requestId = String(req.body?.requestId ?? '').trim();

    if (!isValidIndianPhone(local)) {
      return res
        .status(400)
        .json({ error: 'A valid 10-digit Indian mobile number is required.' });
    }
    if (!/^\d{4,8}$/.test(otp)) {
      return res.status(400).json({ error: 'A valid OTP is required.' });
    }
    if (!requestId) {
      return res.status(400).json({ error: 'Please request an OTP first.' });
    }
    const useTestOtp = config.testOtpEnabled && otp === config.testOtp;
    if (!useTestOtp) {
      if (!config.msg91Authkey) {
        return res.status(503).json({ error: 'SMS service is not configured.' });
      }

      const verifyUrl = `https://control.msg91.com/api/v5/verify?requestId=${encodeURIComponent(
        requestId
      )}&otp=${encodeURIComponent(otp)}`;
      const response = await fetch(verifyUrl, { headers: { authkey: config.msg91Authkey } });
      const data = (await response.json().catch(() => null)) as
        | { type?: string; message?: string }
        | null;

      const ok =
        response.ok &&
        data !== null &&
        (data.type === 'success' || /verified/i.test(data.message ?? ''));

      if (!ok) {
        console.error('MSG91 verify failed', response.status, data);
        return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
      }
    }

    const profile = await withTransaction(async (client) => {
      const { rows } = await client.query<ProfileRow>(
        `SELECT ${SELECT_PROFILE} FROM profiles WHERE phone = $1 FOR UPDATE`,
        [local]
      );
      if (rows.length === 0) {
        const created = await client.query<ProfileRow>(
          `INSERT INTO profiles (phone, role, phone_verified)
           VALUES ($1, 'owner', true)
           RETURNING ${SELECT_PROFILE}`,
          [local]
        );
        return created.rows[0];
      }
      const updated = await client.query<ProfileRow>(
        `UPDATE profiles SET phone_verified = true WHERE id = $1 RETURNING ${SELECT_PROFILE}`,
        [rows[0].id]
      );
      return updated.rows[0];
    });

    const token = signToken({ sub: profile.id, role: profile.role, phone: profile.phone });
    return res.json({ token, profile: publicProfile(profile) });
  })
);

// POST /auth/admin-login — seeded admin, bcrypt check in SQL
router.post(
  '/admin-login',
  otpLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const { rows } = await query<ProfileRow>(
      `SELECT ${SELECT_PROFILE} FROM profiles
       WHERE lower(email) = $1 AND password_hash = crypt($2, password_hash)
       LIMIT 1`,
      [emailNorm, String(password)]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const profile = rows[0];
    const token = signToken({ sub: profile.id, role: 'admin', phone: profile.phone });
    return res.json({
      token,
      profile: publicProfile({ ...profile, role: 'admin' }),
    });
  })
);

// GET /profile — current user
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { rows } = await query<ProfileRow>(
      `SELECT ${SELECT_PROFILE} FROM profiles WHERE id = $1`,
      [req.user!.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
    return res.json({ profile: publicProfile(rows[0]) });
  })
);

// POST /auth/save-profile — finish onboarding (name + account type)
router.post(
  '/save-profile',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name, role } = req.body ?? {};
    if (!name || String(name).trim().length < 2 || String(name).trim().length > 100) {
      return res
        .status(400)
        .json({ error: 'Name must be between 2 and 100 characters' });
    }
    if (!['owner', 'broker', 'browse'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { rows } = await query<ProfileRow>(
      `UPDATE profiles
         SET name = $1, role = $2, onboarding_completed = true, phone_verified = true, updated_at = NOW()
       WHERE id = $3
       RETURNING ${SELECT_PROFILE}`,
      [String(name).trim(), role, req.user!.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
    const token = signToken({ sub: rows[0].id, role: rows[0].role, phone: rows[0].phone });
    return res.json({
      token,
      profile: publicProfile(rows[0]),
      message: 'Profile saved.',
    });
  })
);

// POST /auth/update-profile — patch name/role/avatar (never self-promote to admin)
router.post(
  '/update-profile',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name, role, avatar_url } = req.body ?? {};
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      if (
        typeof name !== 'string' ||
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res
          .status(400)
          .json({ error: 'Name must be between 2 and 100 characters' });
      }
      sets.push(`name = $${idx}`);
      values.push(name.trim());
      idx += 1;
    }
    if (role !== undefined) {
      if (!['owner', 'broker', 'browse'].includes(role)) {
        return res
          .status(400)
          .json({ error: 'Invalid role. Must be owner, broker or browse.' });
      }
      sets.push(`role = $${idx}`);
      values.push(role);
      idx += 1;
    }
    if (avatar_url !== undefined) {
      if (
        typeof avatar_url !== 'string' ||
        (avatar_url !== '' && !/^https:\/\//i.test(avatar_url))
      ) {
        return res.status(400).json({ error: 'avatar_url must be an https URL' });
      }
      sets.push(`avatar_url = $${idx}`);
      values.push(avatar_url);
      idx += 1;
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    sets.push('updated_at = NOW()');
    values.push(req.user!.id);
    const { rows } = await query<ProfileRow>(
      `UPDATE profiles SET ${sets.join(', ')} WHERE id = $${idx} RETURNING ${SELECT_PROFILE}`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
    const token = signToken({ sub: rows[0].id, role: rows[0].role, phone: rows[0].phone });
    return res.json({
      token,
      profile: publicProfile(rows[0]),
      message: 'Profile updated.',
    });
  })
);

// POST /auth/signout — stateless JWT; kept for API compatibility
router.post('/signout', (_req, res) => {
  res.json({ message: 'Signed out successfully' });
});

export default router;
