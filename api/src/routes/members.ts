import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { httpError } from '../middleware/error.js';
import { requireMember } from '../middleware/member.js';

export const membersRouter = Router();

membersRouter.get('/', async (_req, res) => {
  const members = await prisma.member.findMany({ orderBy: { name: 'asc' } });
  res.json(members);
});

membersRouter.post('/', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().trim().min(1).max(60) }).parse(req.body);
    const member = await prisma.member.create({ data: { name } });
    res.status(201).json(member);
  } catch (e) { next(e); }
});

membersRouter.patch('/:id', requireMember, async (req, res, next) => {
  try {
    if (req.memberId !== req.params.id) throw httpError(403, 'Can only edit your own profile');
    const { name } = z.object({ name: z.string().trim().min(1).max(60) }).parse(req.body);
    const member = await prisma.member.update({ where: { id: req.params.id }, data: { name } });
    res.json(member);
  } catch (e) { next(e); }
});

membersRouter.delete('/:id', requireMember, async (req, res, next) => {
  try {
    if (req.memberId !== req.params.id) throw httpError(403, 'Can only delete your own profile');
    const count = await prisma.booking.count({ where: { driverId: req.params.id } });
    if (count > 0) throw httpError(409, 'Member has bookings; cannot delete');
    await prisma.carOwner.deleteMany({ where: { memberId: req.params.id } });
    await prisma.member.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});
