import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { readMember, requireMember } from '../middleware/member.js';
import { httpError } from '../middleware/error.js';
import { publish } from '../lib/events.js';

export const spyRouter = Router();
spyRouter.use(readMember);

const SPY_NAME = 'המרגל';

spyRouter.get('/messages', requireMember, async (req, res, next) => {
  try {
    const q = z.object({ since: z.string().datetime().optional() }).parse(req.query);
    const defaultSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since = q.since ? new Date(q.since) : defaultSince;

    const rows = await prisma.spyMessage.findMany({
      where: { createdAt: { gt: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { sender: true },
    });

    res.json(rows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (e) { next(e); }
});

spyRouter.post('/messages', requireMember, async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.memberId! } });
    if (!member) return next(httpError(401, 'member not found'));
    if (member.name !== SPY_NAME) return next(httpError(403, 'spy only'));

    const { body } = z.object({
      body: z.string().trim().min(1).max(500),
    }).parse(req.body);

    const msg = await prisma.spyMessage.create({
      data: { senderId: member.id, body },
    });

    publish({ type: 'spy.message', messageId: msg.id, senderId: member.id });

    res.json({
      id: msg.id,
      senderId: msg.senderId,
      senderName: member.name,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (e) { next(e); }
});
