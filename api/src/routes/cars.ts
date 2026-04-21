import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const carsRouter = Router();

const carInput = z.object({
  name: z.string().trim().min(1).max(60),
  plate: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
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

carsRouter.post('/', async (req, res, next) => {
  try {
    const body = carInput.parse(req.body);
    const car = await prisma.car.create({
      data: {
        name: body.name,
        plate: body.plate ?? null,
        color: body.color ?? null,
        notes: body.notes ?? null,
        owners: { create: body.ownerIds.map((memberId) => ({ memberId })) },
      },
      include: { owners: { include: { member: true } } },
    });
    res.status(201).json({ ...car, owners: car.owners.map((o) => o.member) });
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
        notes: body.notes,
      },
    });
    res.json(car);
  } catch (e) { next(e); }
});

carsRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.car.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

carsRouter.put('/:id/owners', async (req, res, next) => {
  try {
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
  } catch (e) { next(e); }
});
