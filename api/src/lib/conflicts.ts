import { prisma } from '../db.js';

export async function findOverlapping(carId: string, startAt: Date, endAt: Date, excludeId?: string) {
  return prisma.booking.findMany({
    where: {
      carId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ['PENDING', 'APPROVED'] },
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
    orderBy: { startAt: 'asc' },
  });
}

export async function autoDeclineConflictingPending(
  carId: string,
  startAt: Date,
  endAt: Date,
  keepId: string,
) {
  return prisma.booking.updateMany({
    where: {
      carId,
      id: { not: keepId },
      status: 'PENDING',
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
    data: {
      status: 'DECLINED',
      declineReason: 'Conflict with approved booking',
      decidedAt: new Date(),
    },
  });
}
