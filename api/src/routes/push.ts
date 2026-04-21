import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { readMember, requireMember } from '../middleware/member.js';

export const pushRouter = Router();
pushRouter.use(readMember);

pushRouter.get('/vapid-public', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

const subInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  userAgent: z.string().optional(),
});

pushRouter.post('/subscribe', requireMember, async (req, res, next) => {
  try {
    const body = subInput.parse(req.body);
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        memberId: req.memberId!,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent ?? null,
      },
      update: {
        memberId: req.memberId!,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent ?? null,
      },
    });
    res.status(201).json({ id: sub.id });
  } catch (e) { next(e); }
});

pushRouter.post('/unsubscribe', requireMember, async (req, res, next) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, memberId: req.memberId! },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

pushRouter.get('/status', requireMember, async (req, res, next) => {
  try {
    const count = await prisma.pushSubscription.count({ where: { memberId: req.memberId! } });
    res.json({ subscribed: count > 0, count });
  } catch (e) { next(e); }
});
