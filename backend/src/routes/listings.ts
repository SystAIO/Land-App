import { Router } from 'express';

import { validateListingBody, isValidUuid } from '../config/constants';
import { query } from '../db/pool';
import type { AuthedRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { verifyToken } from '../utils/crypto';
import { publicProperty, LISTING_SQL } from '../utils/mappers';
import type { PropertyRow } from '../utils/mappers';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// GET /listings — approved only, capped
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<PropertyRow>(
      `${LISTING_SQL} WHERE p.status = 'approved' ORDER BY p.created_at DESC LIMIT 500`
    );
    return res.json(rows.map(publicProperty));
  })
);

// GET /listings/my — own listings (registered before /:id)
router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { rows } = await query<PropertyRow>(
      `${LISTING_SQL} WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    return res.json(rows.map(publicProperty));
  })
);

// GET /listings/:id — approved, or own/admin otherwise
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { rows } = await query<PropertyRow>(`${LISTING_SQL} WHERE p.id = $1`, [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Property not found.' });
    const row = rows[0];
    if (row.status === 'approved') return res.json(publicProperty(row));

    const header = req.headers?.authorization;
    const token = header && header.split(' ')[1];
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload.sub === row.owner_id || payload.role === 'admin') {
          return res.json(publicProperty(row));
        }
      } catch {
        // fall through
      }
    }
    return res.status(403).json({ error: 'This listing is awaiting approval.' });
  })
);

// POST /listings — create a draft (owner/broker only)
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!['owner', 'broker'].includes(req.user!.role)) {
      return res
        .status(403)
        .json({ error: 'Only owners and brokers can list properties.' });
    }
    const { errors, value } = validateListingBody(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: Object.values(errors)[0], errors });
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO properties (
         title, description, listing_type, property_type, price, area_value, area_unit,
         address, locality, city, state, pincode, latitude, longitude,
         boundary, nearby_landmarks, youtube_url, images, owner_id, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'draft'
       )
       RETURNING id`,
      [
        value!.title,
        value!.description,
        value!.listing_type,
        value!.property_type,
        value!.price,
        value!.area_value,
        value!.area_unit,
        value!.address,
        value!.locality,
        value!.city,
        value!.state,
        value!.pincode,
        value!.latitude,
        value!.longitude,
        JSON.stringify(value!.boundary),
        JSON.stringify(value!.nearby_landmarks),
        value!.youtube_url,
        value!.images,
        req.user!.id,
      ]
    );
    const { rows: created } = await query<PropertyRow>(
      `${LISTING_SQL} WHERE p.id = $1`,
      [rows[0].id]
    );
    return res.status(201).json(publicProperty(created[0]));
  })
);

// PUT /listings/:id — edit (owner or admin)
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { rows: existing } = await query<{ owner_id: string }>(
      'SELECT owner_id FROM properties WHERE id = $1',
      [req.params.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Property not found.' });
    if (existing[0].owner_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot edit this listing.' });
    }

    const allowed = [
      'title','description','listing_type','property_type','price','area_value','area_unit',
      'address','locality','city','state','pincode','latitude','longitude',
      'boundary','nearby_landmarks','youtube_url','images',
    ] as const;
    const updates = (req.body ?? {}) as Record<string, unknown>;
    const fields = Object.keys(updates).filter((key) =>
      (allowed as readonly string[]).includes(key)
    );
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map((field, i) => {
      if (field === 'boundary' || field === 'nearby_landmarks')
        return `${field} = $${i + 1}::jsonb`;
      return `${field} = $${i + 1}`;
    });
    const values: unknown[] = fields.map((field) => {
      if (field === 'boundary' || field === 'nearby_landmarks') {
        return JSON.stringify(Array.isArray(updates[field]) ? updates[field] : []);
      }
      return updates[field];
    });
    values.push(req.params.id);

    await query(
      `UPDATE properties SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = $${
        values.length
      }`,
      values
    );
    const { rows: updatedRows } = await query<PropertyRow>(
      `${LISTING_SQL} WHERE p.id = $1`,
      [req.params.id]
    );
    return res.json(publicProperty(updatedRows[0]));
  })
);

// DELETE /listings/:id — owner or admin
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { rows } = await query<{ owner_id: string }>(
      'SELECT owner_id FROM properties WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Property not found.' });
    if (rows[0].owner_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot delete this listing.' });
    }
    await query('DELETE FROM properties WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  })
);

// POST /listings/:id/resubmit — owner only, requires a paid listing fee
router.post(
  '/:id/resubmit',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    const { rows: propertyRows } = await query<{ owner_id: string; status: string }>(
      'SELECT owner_id, status FROM properties WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (propertyRows.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (propertyRows[0].owner_id !== req.user!.id) {
      return res
        .status(403)
        .json({ error: 'You cannot resubmit this listing.' });
    }
    const { rows: payments } = await query<{ count: string }>(
      `SELECT 1 AS count FROM payments
       WHERE property_id = $1 AND user_id = $2 AND status = 'paid'
         AND kind IN ('free_listing', 'listing_fee')
       LIMIT 1`,
      [req.params.id, req.user!.id]
    );
    if (payments.length === 0) {
      return res.status(400).json({
        error: 'A completed listing fee is required before resubmitting.',
      });
    }
    await query(
      `UPDATE properties
         SET status = 'pending', admin_note = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ message: 'Listing resubmitted for review.' });
  })
);

export default router;
