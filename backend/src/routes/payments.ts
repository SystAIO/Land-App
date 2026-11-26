import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';

import config from '../config';
import { isValidUuid } from '../config/constants';
import { query, withTransaction } from '../db/pool';
import type { AuthedRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { safeEqual } from '../utils/crypto';
import { mapPayment } from '../utils/mappers';
import type { PaymentRow } from '../utils/mappers';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

/** POST /listings/:id/submit — one-shot checkout: free listing or Razorpay order. */
router.post(
  '/listings/:id/submit',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!isValidUuid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid property id' });
    }
    if (!['owner', 'broker'].includes(req.user!.role)) {
      return res
        .status(403)
        .json({ error: 'Only owners and brokers can submit listings.' });
    }

    const txResult = await withTransaction(async (client) => {
      const { rows: profileRows } = await client.query<{ free_listing_used: boolean }>(
        'SELECT free_listing_used FROM profiles WHERE id = $1 FOR UPDATE',
        [req.user!.id]
      );
      if (profileRows.length === 0) return { status: 404 as const };

      const { rows: propertyRows } = await client.query<{
        owner_id: string;
        status: string;
      }>(
        'SELECT owner_id, status FROM properties WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );
      if (propertyRows.length === 0) return { status: 404 as const };
      const property = propertyRows[0];
      if (property.owner_id !== req.user!.id) return { status: 403 as const };
      if (property.status !== 'draft') return { status: 409 as const };

      if (profileRows[0].free_listing_used) return { status: 402 as const };

      await client.query(
        'UPDATE profiles SET free_listing_used = true, updated_at = NOW() WHERE id = $1',
        [req.user!.id]
      );
      await client.query(
        `UPDATE properties SET status = 'pending', admin_note = NULL, updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
      await client.query(
        `INSERT INTO payments (user_id, property_id, amount, currency, status, kind, paid_at)
         VALUES ($1, $2, 0, 'INR', 'paid', 'free_listing', NOW())`,
        [req.user!.id, req.params.id]
      );
      return { status: 200 as const };
    });

    if (txResult.status === 200) {
      return res.json({ mode: 'free', propertyId: req.params.id });
    }
    if (txResult.status === 404) {
      return res.status(404).json({ error: 'Property or profile not found.' });
    }
    if (txResult.status === 403) {
      return res.status(403).json({ error: 'This property does not belong to you.' });
    }
    if (txResult.status === 409) {
      return res.status(409).json({ error: 'This property has already been submitted.' });
    }

    // Requires Razorpay payment
    const keyId = config.razorpayKeyId;
    const keySecret = config.razorpayKeySecret;
    if (!keyId || !keySecret) {
      return res.status(503).json({ error: 'Payment gateway is not configured.' });
    }

    const { rows: openOrders } = await query<{ razorpay_order_id: string | null }>(
      `SELECT razorpay_order_id FROM payments
       WHERE property_id = $1 AND user_id = $2 AND status IN ('created', 'failed') AND kind = 'listing_fee'
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id, req.user!.id]
    );

    const amountPaise = 10000; // ₹100
    if (openOrders.length > 0) {
      return res.json({
        mode: 'razorpay',
        propertyId: req.params.id,
        orderId: openOrders[0].razorpay_order_id,
        keyId,
        amount: amountPaise,
        currency: 'INR',
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `systio_${Date.now()}`.slice(0, 40),
      notes: { property_id: req.params.id, user_id: req.user!.id },
    });
    await query(
      `INSERT INTO payments (user_id, property_id, razorpay_order_id, amount, currency, status, kind)
       VALUES ($1, $2, $3, $4, 'INR', 'created', 'listing_fee')`,
      [req.user!.id, req.params.id, order.id as string, amountPaise]
    );

    return res.json({
      mode: 'razorpay',
      propertyId: req.params.id,
      orderId: order.id as string,
      keyId,
      amount: amountPaise,
      currency: 'INR',
    });
  })
);

/** POST /payments/verify — verify Razorpay signature, mark paid, submit listing */
router.post(
  '/payments/verify',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { orderId, paymentId, signature, propertyId } = (req.body ?? {}) as Record<
      string,
      unknown
    >;
    if (!orderId || !paymentId || !signature || !propertyId) {
      return res.status(400).json({
        error: 'orderId, paymentId, signature and propertyId are required',
      });
    }
    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (!safeEqual(String(signature).toLowerCase(), expected)) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const txResult = await withTransaction(async (client) => {
      const { rows } = await client.query<{ property_id: string }>(
        `UPDATE payments
           SET status = 'paid', razorpay_payment_id = $1, paid_at = NOW()
         WHERE razorpay_order_id = $2 AND user_id = $3 AND status IN ('created', 'failed')
         RETURNING property_id`,
        [String(paymentId), String(orderId), req.user!.id]
      );
      if (rows.length === 0) {
        const { rows: existing } = await client.query<{ status: string }>(
          `SELECT status FROM payments WHERE razorpay_order_id = $1 AND user_id = $2`,
          [String(orderId), req.user!.id]
        );
        if (existing.length && existing[0].status === 'paid') {
          return { alreadyPaid: true as const };
        }
        return { notFound: true as const };
      }
      await client.query(
        `UPDATE properties SET status = 'pending', admin_note = NULL, updated_at = NOW()
         WHERE id = $1 AND status = 'draft'`,
        [rows[0].property_id]
      );
      return { paid: true as const };
    });

    if (txResult.notFound) {
      return res
        .status(400)
        .json({ error: 'Payment record not found for this order.' });
    }
    if (txResult.alreadyPaid) {
      return res.json({ message: 'Payment already verified.' });
    }
    return res.json({ message: 'Payment verified. Listing submitted for admin review.' });
  })
);

/** GET /payments/history — own payment history with property title */
router.get(
  '/payments/history',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { rows } = await query<PaymentRow>(
      `SELECT p.*, pr.title AS property_title
       FROM payments p
       LEFT JOIN properties pr ON pr.id = p.property_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    return res.json(rows.map(mapPayment));
  })
);

/**
 * Raw-body webhook handler (mounted with express.raw() in app.ts).
 * Verifies the Razorpay signature and reconciles payment state with the DB.
 */
export async function webhookHandler(
  req: import('express').Request,
  res: import('express').Response
): Promise<void> {
  try {
    if (!config.razorpayWebhookSecret) {
      res.status(500).json({ error: 'Webhook is not configured.' });
      return;
    }
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      res.status(401).json({ error: 'Missing signature.' });
      return;
    }

    const raw = req.body as Buffer;
    const expected = crypto
      .createHmac('sha256', config.razorpayWebhookSecret)
      .update(raw)
      .digest('hex');
    if (!safeEqual(String(signature).toLowerCase(), expected)) {
      res.status(401).json({ error: 'Invalid signature.' });
      return;
    }

    const event = JSON.parse(raw.toString('utf8')) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
    };
    const entity = event?.payload?.payment?.entity;
    const orderId = entity?.order_id;
    if (orderId) {
      if (event?.event === 'payment.failed') {
        await query(
          `UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'created'`,
          [orderId]
        );
      } else if (['payment.captured', 'order.paid'].includes(event?.event ?? '')) {
        if (entity?.status === 'captured' || event?.event === 'order.paid') {
          await query(
            `UPDATE payments
               SET status = 'paid', razorpay_payment_id = $1, paid_at = NOW()
             WHERE razorpay_order_id = $2 AND status IN ('created', 'failed')`,
            [entity?.id ?? null, orderId]
          );
          await query(
            `UPDATE properties SET status = 'pending', admin_note = NULL, updated_at = NOW()
             WHERE id = (SELECT property_id FROM payments WHERE razorpay_order_id = $1)
               AND status = 'draft'`,
            [orderId]
          );
        }
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

export default router;
