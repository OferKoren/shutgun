import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const calendarRouter = Router();

calendarRouter.get('/', async (req, res, next) => {
  try {
    const { month } = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
    const [y, m] = month.split('-').map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));

    const [cars, bookings] = await Promise.all([
      prisma.car.findMany({ orderBy: { name: 'asc' } }),
      prisma.booking.findMany({
        where: {
          status: { in: ['PENDING', 'APPROVED'] },
          startAt: { lt: to },
          endAt: { gt: from },
        },
        include: { driver: true },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    res.json({ from, to, cars, bookings });
  } catch (e) { next(e); }
});
