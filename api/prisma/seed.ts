import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.carOwner.deleteMany();
  await prisma.car.deleteMany();
  await prisma.member.deleteMany();

  const names = ['אבא', 'אמא', 'דני', 'נועה', 'תומר'];
  const members = await Promise.all(names.map((name) => prisma.member.create({ data: { name } })));
  const [abba, ima, dani, noa, tomer] = members;

  const family = await prisma.car.create({
    data: {
      name: 'מאזדה 3',
      color: '#C2410C',
      icon: 'sedan',
      owners: { create: [{ memberId: abba.id }, { memberId: ima.id }] },
    },
  });

  const minivan = await prisma.car.create({
    data: {
      name: 'קיה ספורטאז',
      color: '#059669',
      icon: 'suv',
      owners: { create: [{ memberId: abba.id }, { memberId: ima.id }] },
    },
  });

  const today = new Date();
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const bookings = [
    { carId: family.id, driverId: ima.id, startAt: at(0, 8), endAt: at(0, 10), purpose: 'הסעת ילדים', status: 'APPROVED' as const, allDay: false },
    { carId: family.id, driverId: dani.id, startAt: at(1, 17), endAt: at(1, 21), purpose: 'חוג כדורסל', status: 'PENDING' as const, allDay: false },
    { carId: minivan.id, driverId: noa.id, startAt: at(2, 9), endAt: at(2, 13), purpose: 'קניות', status: 'APPROVED' as const, allDay: false },
    { carId: minivan.id, driverId: tomer.id, startAt: at(3, 0), endAt: at(4, 0), purpose: 'טיול צפון', status: 'PENDING' as const, allDay: true },
    { carId: family.id, driverId: noa.id, startAt: at(3, 18), endAt: at(3, 22), purpose: 'ערב חברים', status: 'PENDING' as const, allDay: false },
    { carId: family.id, driverId: tomer.id, startAt: at(3, 19), endAt: at(3, 23), purpose: 'סרט', status: 'PENDING' as const, allDay: false },
    { carId: minivan.id, driverId: abba.id, startAt: at(5, 7), endAt: at(5, 19), purpose: 'עבודה', status: 'APPROVED' as const, allDay: false },
    { carId: family.id, driverId: ima.id, startAt: at(7, 0), endAt: at(8, 0), purpose: 'סופ״ש אילת', status: 'APPROVED' as const, allDay: true },
    { carId: minivan.id, driverId: dani.id, startAt: at(10, 15), endAt: at(10, 18), purpose: 'רופא', status: 'PENDING' as const, allDay: false },
    { carId: family.id, driverId: abba.id, startAt: at(-2, 8), endAt: at(-2, 17), purpose: 'פגישה', status: 'APPROVED' as const, allDay: false },
  ];

  for (const b of bookings) {
    await prisma.booking.create({
      data: {
        ...b,
        decidedBy: b.status === 'APPROVED' ? abba.id : null,
        decidedAt: b.status === 'APPROVED' ? new Date() : null,
      },
    });
  }

  console.log(`Seeded ${members.length} members, 2 cars, ${bookings.length} bookings.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
