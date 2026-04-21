import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { readMember, requireMember } from '../middleware/member.js';
import { httpError } from '../middleware/error.js';
import { publish } from '../lib/events.js';

export const carsRouter = Router();
carsRouter.use(readMember);

async function assertOwner(carId: string, memberId: string) {
  const link = await prisma.carOwner.findUnique({
    where: { carId_memberId: { carId, memberId } },
  });
  if (!link) throw httpError(403, 'owner only');
}

const carInput = z.object({
  name: z.string().trim().min(1).max(60),
  plate: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
  icon: z.string().trim().max(30).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  ownerIds: z.array(z.string()).default([]),
});

carsRouter.get('/', async (_req, res) => {
  const cars = await prisma.car.findMany({
    include: { owners: { include: { member: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(cars.map((c) => ({
    ...c,
    owners: c.owners.map((o) => o.member),
  })));
});

carsRouter.post('/', requireMember, async (req, res, next) => {
  try {
    const body = carInput.parse(req.body);
    const ownerIds = Array.from(new Set([req.memberId!, ...body.ownerIds]));
    const car = await prisma.car.create({
      data: {
        name: body.name,
        plate: body.plate ?? null,
        color: body.color ?? null,
        icon: body.icon ?? null,
        notes: body.notes ?? null,
        owners: { create: ownerIds.map((memberId) => ({ memberId })) },
      },
      include: { owners: { include: { member: true } } },
    });
    res.status(201).json({ ...car, owners: car.owners.map((o) => o.member) });
    publish({ type: 'car.changed', carId: car.id });
  } catch (e) { next(e); }
});

carsRouter.patch('/:id', async (req, res, next) => {
  try {
    const body = carInput.partial().parse(req.body);
    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        plate: body.plate,
        color: body.color,
        icon: body.icon,
        notes: body.notes,
      },
    });
    res.json(car);
    publish({ type: 'car.changed', carId: car.id });
  } catch (e) { next(e); }
});

carsRouter.delete('/:id', requireMember, async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.memberId!);
    await prisma.car.delete({ where: { id: req.params.id } });
    res.status(204).end();
    publish({ type: 'car.changed', carId: req.params.id });
  } catch (e) { next(e); }
});

carsRouter.put('/:id/owners', requireMember, async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.memberId!);
    const { ownerIds } = z.object({ ownerIds: z.array(z.string()) }).parse(req.body);
    await prisma.$transaction([
      prisma.carOwner.deleteMany({ where: { carId: req.params.id } }),
      prisma.carOwner.createMany({
        data: ownerIds.map((memberId) => ({ carId: req.params.id, memberId })),
      }),
    ]);
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: { owners: { include: { member: true } } },
    });
    res.json(car ? { ...car, owners: car.owners.map((o) => o.member) } : null);
    publish({ type: 'car.changed', carId: req.params.id });
  } catch (e) { next(e); }
});
