import { Router } from 'express';

import { isValidUuid } from '../config/constants';
import { query } from '../db/pool';
import type { AuthedRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

// GET /favorites — own favorite property ids
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { rows } = await query<{ property_id: string }>(
      'SELECT property_id FROM favorites WHERE user_id = $1',
      [req.user!.id]
    );
    return res.json(rows.map((row) => String(row.property_id)));
  })
);

// PUT /favorites/:propertyId — add favorite
router.put(
  '/:propertyId',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.propertyId)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    await query(
      `INSERT INTO favorites (user_id, property_id)
       SELECT $1, id FROM properties WHERE id = $2
       ON CONFLICT DO NOTHING`,
      [req.user!.id, req.params.propertyId]
    );
    return res.json({ ok: true });
  })
);

// DELETE /favorites/:propertyId — remove favorite
router.delete(
  '/:propertyId',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.propertyId)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    await query('DELETE FROM favorites WHERE user_id = $1 AND property_id = $2', [
      req.user!.id,
      req.params.propertyId,
    ]);
    return res.json({ ok: true });
  })
);

export default router;
