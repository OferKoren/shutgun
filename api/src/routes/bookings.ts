import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { readMember, requireMember } from '../middleware/member.js';
import { httpError } from '../middleware/error.js';
import { autoDeclineConflictingPending, findOverlapping } from '../lib/conflicts.js';
import { sendPushToMember, sendPushToMembers } from '../lib/push.js';

export const bookingsRouter = Router();
bookingsRouter.use(readMember);

function fmtRange(startAt: Date, endAt: Date): string {
  const f = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  return `${f.format(startAt)} – ${f.format(endAt)}`;
}

const createInput = z.object({
  carId: z.string(),
  driverId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  allDay: z.boolean().default(false),
  purpose: z.string().trim().max(200).optional().nullable(),
});

bookingsRouter.get('/', async (req, res, next) => {
  try {
    const q = z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      carId: z.string().optional(),
      status: z.enum(['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED']).optional(),
    }).parse(req.query);

    const bookings = await prisma.booking.findMany({
      where: {
        carId: q.carId,
        status: q.status,
        startAt: q.to ? { lt: new Date(q.to) } : undefined,
        endAt: q.from ? { gt: new Date(q.from) } : undefined,
      },
      include: { driver: true, car: true },
      orderBy: { startAt: 'asc' },
    });
    res.json(bookings);
  } catch (e) { next(e); }
});

bookingsRouter.get('/pending-approvals', requireMember, async (req, res, next) => {
  try {
    const ownedCars = await prisma.carOwner.findMany({
      where: { memberId: req.memberId! },
      select: { carId: true },
    });
    const carIds = ownedCars.map((c) => c.carId);
    const bookings = await prisma.booking.findMany({
      where: { status: 'PENDING', carId: { in: carIds } },
      include: { driver: true, car: true },
      orderBy: [{ carId: 'asc' }, { startAt: 'asc' }],
    });

    const withConflicts = await Promise.all(
      bookings.map(async (b) => {
        const conflicts = await findOverlapping(b.carId, b.startAt, b.endAt, b.id);
        const pendingConflicts = conflicts.filter((c) => c.status === 'PENDING');
        return { ...b, conflicts: pendingConflicts.map((c) => ({
          id: c.id, driverId: c.driverId, startAt: c.startAt, endAt: c.endAt,
        })) };
      }),
    );
    res.json(withConflicts);
  } catch (e) { next(e); }
});

bookingsRouter.post('/', async (req, res, next) => {
  try {
    const body = createInput.parse(req.body);
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (endAt <= startAt) throw httpError(400, 'endAt must be after startAt');

    const isOwner = await prisma.carOwner.findUnique({
      where: { carId_memberId: { carId: body.carId, memberId: body.driverId } },
    });
    const autoApprove = Boolean(isOwner);

    if (autoApprove) {
      const overlappingApproved = await prisma.booking.findFirst({
        where: {
          carId: body.carId,
          status: 'APPROVED',
          AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        },
      });
      if (overlappingApproved) throw httpError(409, 'Car already booked for that time');
    }

    const booking = await prisma.booking.create({
      data: {
        carId: body.carId,
        driverId: body.driverId,
        startAt,
        endAt,
        allDay: body.allDay,
        purpose: body.purpose ?? null,
        status: autoApprove ? 'APPROVED' : 'PENDING',
        decidedBy: autoApprove ? body.driverId : null,
        decidedAt: autoApprove ? new Date() : null,
      },
      include: { driver: true, car: true },
    });

    if (autoApprove) {
      const declined = await autoDeclineConflictingPending(body.carId, startAt, endAt, booking.id);
      if (declined.victims.length) {
        await sendPushToMembers(
          declined.victims.map((v) => v.driverId),
          {
            title: 'בקשתך נדחתה אוטומטית',
            body: `${booking.car.name} נתפס ע״י בקשה אחרת`,
            url: '/',
            tag: 'auto-declined',
          },
        );
      }
    } else {
      const owners = await prisma.carOwner.findMany({
        where: { carId: body.carId },
        select: { memberId: true },
      });
      const ownerIds = owners.map((o) => o.memberId).filter((id) => id !== body.driverId);
      await sendPushToMembers(ownerIds, {
        title: 'בקשת רכב חדשה',
        body: `${booking.driver.name} ביקש ${booking.car.name} · ${fmtRange(startAt, endAt)}`,
        url: '/approvals',
        tag: `pending-${booking.id}`,
      });
    }

    res.status(201).json(booking);
  } catch (e) { next(e); }
});

bookingsRouter.post('/:id/approve', requireMember, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw httpError(404, 'Booking not found');
    if (booking.status !== 'PENDING') throw httpError(409, 'Booking is not pending');

    const isOwner = await prisma.carOwner.findUnique({
      where: { carId_memberId: { carId: booking.carId, memberId: req.memberId! } },
    });
    if (!isOwner) throw httpError(403, 'Only car owner can approve');

    const overlappingApproved = await prisma.booking.findFirst({
      where: {
        carId: booking.carId,
        id: { not: booking.id },
        status: 'APPROVED',
        AND: [{ startAt: { lt: booking.endAt } }, { endAt: { gt: booking.startAt } }],
      },
    });
    if (overlappingApproved) throw httpError(409, 'Conflicts with already-approved booking');

    const approved = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'APPROVED', decidedBy: req.memberId!, decidedAt: new Date() },
      include: { driver: true, car: true },
    });
    const declined = await autoDeclineConflictingPending(booking.carId, booking.startAt, booking.endAt, booking.id);

    await sendPushToMember(approved.driverId, {
      title: 'הבקשה אושרה ✅',
      body: `${approved.car.name} · ${fmtRange(approved.startAt, approved.endAt)}`,
      url: '/',
      tag: `approved-${approved.id}`,
    });
    if (declined.victims.length) {
      await sendPushToMembers(
        declined.victims.filter((v) => v.driverId !== approved.driverId).map((v) => v.driverId),
        {
          title: 'בקשתך נדחתה אוטומטית',
          body: `${approved.car.name} אושר לבקשה אחרת`,
          url: '/',
          tag: 'auto-declined',
        },
      );
    }
    res.json(approved);
  } catch (e) { next(e); }
});

bookingsRouter.post('/:id/decline', requireMember, async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().trim().max(200).optional() }).parse(req.body ?? {});
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw httpError(404, 'Booking not found');
    if (booking.status !== 'PENDING') throw httpError(409, 'Booking is not pending');

    const isOwner = await prisma.carOwner.findUnique({
      where: { carId_memberId: { carId: booking.carId, memberId: req.memberId! } },
    });
    if (!isOwner) throw httpError(403, 'Only car owner can decline');

    const declined = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'DECLINED', decidedBy: req.memberId!, decidedAt: new Date(), declineReason: reason ?? null },
      include: { car: true },
    });
    await sendPushToMember(declined.driverId, {
      title: 'הבקשה נדחתה',
      body: `${declined.car.name}${reason ? ` · ${reason}` : ''}`,
      url: '/',
      tag: `declined-${declined.id}`,
    });
    res.json(declined);
  } catch (e) { next(e); }
});

bookingsRouter.post('/:id/cancel', requireMember, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw httpError(404, 'Booking not found');
    if (booking.driverId !== req.memberId) throw httpError(403, 'Only driver can cancel');
    if (booking.status === 'CANCELLED') return res.json(booking);
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (e) { next(e); }
});
