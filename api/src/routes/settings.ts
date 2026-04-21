import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { readMember, requireMember } from '../middleware/member.js';
import { httpError } from '../middleware/error.js';
import { publish } from '../lib/events.js';

export const settingsRouter = Router();
settingsRouter.use(readMember);

const SPY_NAME = 'המרגל';

settingsRouter.get('/:key', async (req, res, next) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: req.params.key } });
    res.json({ key: req.params.key, value: row?.value ?? null });
  } catch (e) { next(e); }
});

settingsRouter.put('/:key', requireMember, async (req, res, next) => {
  try {
    const { value } = z.object({ value: z.string().max(500) }).parse(req.body ?? {});
    const me = await prisma.member.findUnique({ where: { id: req.memberId! } });
    if (!me || me.name !== SPY_NAME) throw httpError(403, 'Not allowed');
    const row = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value },
      create: { key: req.params.key, value },
    });
    publish({ type: 'setting.changed', key: row.key, value: row.value });
    res.json({ key: row.key, value: row.value });
  } catch (e) { next(e); }
});
