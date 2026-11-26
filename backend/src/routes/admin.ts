import { Router } from 'express';

import { isValidUuid, ALL_ROLES } from '../config/constants';
import { query } from '../db/pool';
import type { AuthedRequest } from '../middleware/auth';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { publicProfile, publicProperty, mapPayment, LISTING_SQL } from '../utils/mappers';
import type { ProfileRow, PropertyRow, PaymentRow } from '../utils/mappers';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// Everything here requires an admin token
router.use(authMiddleware, adminMiddleware);

// GET /admin/data — everything the admin dashboard needs in one round trip
router.get(
  '/data',
  asyncHandler(async (_req, res) => {
    const [profiles, properties, payments] = await Promise.all([
      query<ProfileRow>(
        'SELECT id, phone, email, name, role, avatar_url, free_listing_used, onboarding_completed, phone_verified, created_at FROM profiles ORDER BY created_at DESC'
      ),
      query<PropertyRow>(`${LISTING_SQL} ORDER BY p.created_at DESC`),
      query<PaymentRow>(
        `SELECT p.*, pr.title AS property_title, o.name AS user_name
         FROM payments p
         LEFT JOIN properties pr ON pr.id = p.property_id
         LEFT JOIN profiles o ON o.id = p.user_id
         ORDER BY p.created_at DESC`
      ),
    ]);
    return res.json({
      profiles: profiles.rows.map(publicProfile),
      properties: properties.rows.map(publicProperty),
      payments: payments.rows.map(mapPayment),
    });
  })
);

// POST /admin/properties/:id/status { status, note? }
router.post(
  '/properties/:id/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { status, note } = (req.body ?? {}) as { status?: string; note?: unknown };
    if (!['pending', 'approved', 'declined'].includes(status ?? '')) {
      return res.status(400).json({ error: 'Invalid listing status.' });
    }
    if (status === 'declined' && (!note || String(note).trim().length < 5)) {
      return res
        .status(400)
        .json({ error: 'A short reason is required when declining.' });
    }
    const { rowCount } = await query(
      `UPDATE properties
         SET status = $1,
             admin_note = CASE WHEN $1 = 'declined' THEN trim($2) ELSE NULL END,
             updated_at = NOW()
       WHERE id = $3`,
      [status, status === 'declined' ? String(note).trim() : null, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Property not found.' });
    return res.json({ message: `Listing marked ${status}.` });
  })
);

// POST /admin/properties/:id/featured { featured: boolean }
router.post(
  '/properties/:id/featured',
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { featured } = (req.body ?? {}) as { featured?: unknown };
    if (typeof featured !== 'boolean') {
      return res.status(400).json({ error: 'featured must be a boolean' });
    }
    const { rowCount } = await query(
      'UPDATE properties SET is_featured = $1, updated_at = NOW() WHERE id = $2',
      [featured, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Property not found.' });
    return res.json({
      message: featured ? 'Listing featured.' : 'Listing unfeatured.',
    });
  })
);

// DELETE /admin/properties/:id
router.delete(
  '/properties/:id',
  asyncHandler(async (_req, res) => {
    if (!isValidUuid(_req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { rowCount } = await query('DELETE FROM properties WHERE id = $1', [
      _req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: 'Property not found.' });
    return res.json({ ok: true });
  })
);

// PUT /admin/users/:id/role { role }
router.put(
  '/users/:id/role',
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const { role } = (req.body ?? {}) as { role?: string };
    if (!(ALL_ROLES as readonly string[]).includes(role ?? '')) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const { rowCount } = await query(
      'UPDATE profiles SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found.' });
    return res.json({ message: `Role updated to ${role}.` });
  })
);

export default router;
