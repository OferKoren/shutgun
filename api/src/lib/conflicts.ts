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
  const victims = await prisma.booking.findMany({
    where: {
      carId,
      id: { not: keepId },
      status: 'PENDING',
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
    select: { id: true, driverId: true },
  });
  if (victims.length === 0) return { count: 0, victims: [] as typeof victims };
  const result = await prisma.booking.updateMany({
    where: { id: { in: victims.map((v) => v.id) } },
    data: {
      status: 'DECLINED',
      declineReason: 'Conflict with approved booking',
      decidedAt: new Date(),
    },
  });
  return { count: result.count, victims };
}
