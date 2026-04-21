import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { httpError } from '../middleware/error.js';

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

membersRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().trim().min(1).max(60) }).parse(req.body);
    const member = await prisma.member.update({ where: { id: req.params.id }, data: { name } });
    res.json(member);
  } catch (e) { next(e); }
});

membersRouter.delete('/:id', async (req, res, next) => {
  try {
    const count = await prisma.booking.count({ where: { driverId: req.params.id } });
    if (count > 0) throw httpError(409, 'Member has bookings; cannot delete');
    await prisma.carOwner.deleteMany({ where: { memberId: req.params.id } });
    await prisma.member.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});
