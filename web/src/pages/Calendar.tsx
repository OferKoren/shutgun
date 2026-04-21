import { useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, eachDayOfInterval, startOfToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { api, type Booking, type Car, type Member } from '../lib/api';
import { LoadingBlock } from '../components/Spinner';
import FlowerGate from '../components/FlowerGate';
import { SpyComposeButton } from '../components/SpyComposeModal';

type CalendarPayload = { from: string; to: string; cars: Car[]; bookings: Booking[] };

export default function CalendarPage({ meId, me }: { meId: string; me: Member }) {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [range, setRange] = useState<DateRange | undefined>({ from: today, to: today });

  const monthStr = format(month, 'yyyy-MM');
  const { data } = useQuery({
    queryKey: ['calendar', monthStr],
    queryFn: () => api<CalendarPayload>(`/calendar?month=${monthStr}`),
  });

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    if (!data) return map;
    for (const b of data.bookings) {
      const start = new Date(b.startAt);
      const end = new Date(b.endAt);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      }
    }
    return map;
  }, [data]);

  const dayStatus = (d: Date): 'mine' | 'green' | 'yellow' | 'red' | 'none' => {
    const cars = data?.cars ?? [];
    if (cars.length === 0) return 'none';
    const dayBookings = bookingsByDay.get(format(d, 'yyyy-MM-dd')) ?? [];
    if (dayBookings.some((b) => b.status === 'APPROVED' && b.driverId === meId)) return 'mine';
    if (dayBookings.length === 0) return 'green';
    const approvedCarIds = new Set(dayBookings.filter((b) => b.status === 'APPROVED').map((b) => b.carId));
    if (approvedCarIds.size >= cars.length) return 'red';
    if (dayBookings.some((b) => b.status === 'PENDING')) return 'yellow';
    return 'green';
  };

  const todayStart = startOfToday();
  const isPast = (d: Date) => d < todayStart;
  const modifiers = {
    mine: (d: Date) => !isPast(d) && dayStatus(d) === 'mine',
    green: (d: Date) => !isPast(d) && dayStatus(d) === 'green',
    yellow: (d: Date) => !isPast(d) && dayStatus(d) === 'yellow',
    red: (d: Date) => !isPast(d) && dayStatus(d) === 'red',
    past: isPast,
  };
  const modifiersClassNames = {
    mine: 'font-bold text-blue-600 after:content-[""] after:block after:w-2.5 after:h-2.5 after:bg-blue-600 after:rounded-full after:mx-auto after:mt-0.5 after:shadow-soft',
    green: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full after:mx-auto after:mt-0.5',
    yellow: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-yellow-500 after:rounded-full after:mx-auto after:mt-0.5',
    red: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full after:mx-auto after:mt-0.5',
    past: 'text-ink/30 line-through opacity-50',
  };

  const from = range?.from;
  const to = range?.to ?? range?.from;
  const fromKey = from ? format(from, 'yyyy-MM-dd') : '';
  const toKey = to ? format(to, 'yyyy-MM-dd') : '';
  const rangeBookings = useMemo(() => {
    if (!from || !to) return [];
    const seen = new Set<string>();
    const out: Booking[] = [];
    for (const d of eachDayOfInterval({ start: from, end: to })) {
      const list = bookingsByDay.get(format(d, 'yyyy-MM-dd')) ?? [];
      for (const b of list) {
        if (!seen.has(b.id)) { seen.add(b.id); out.push(b); }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, bookingsByDay]);

  const rangeLabel = from && to
    ? isSameDay(from, to)
      ? format(from, 'EEEE, d בMMMM', { locale: he })
      : `${format(from, 'd בMMMM', { locale: he })} – ${format(to, 'd בMMMM', { locale: he })}`
    : 'בחרו תאריך או טווח';

  const fromStr = from ? format(from, 'yyyy-MM-dd') : '';
  const toStr = to ? format(to, 'yyyy-MM-dd') : fromStr;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
        <DayPicker
          mode="range"
          month={month}
          onMonthChange={setMonth}
          selected={range}
          onSelect={setRange}
          disabled={{ before: todayStart }}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          showOutsideDays
          locale={he}
          dir="rtl"
        />
        <div className="flex gap-3 text-xs text-ink/70 mt-2 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-blue-600"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full" /> מאושר לך</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> פנוי</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> ממתין</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> תפוס</span>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
        <h2 className="font-display font-semibold text-lg mb-3 text-primary">
          {rangeLabel}
        </h2>
        {!data && <LoadingBlock />}
        {data && data.cars.length === 0 && (
          <div className="text-ink/60 text-sm">
            אין רכבים עדיין. <Link className="text-primary underline" to="/cars">הוסיפו ←</Link>
          </div>
        )}
        {data && from && to && (() => {
          const myOwnInRange = rangeBookings.filter(
            (b) => b.driverId === meId && (b.status === 'APPROVED' || b.status === 'PENDING'),
          );
          const blockReason = myOwnInRange.some((b) => b.status === 'APPROVED')
            ? 'יש לך כבר בקשה מאושרת בטווח'
            : myOwnInRange.length > 0
              ? 'יש לך כבר בקשה ממתינה בטווח'
              : null;
          return (
          <ul className="space-y-3">
            {blockReason && (
              <li className="text-sm bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3">
                🚫 {blockReason} — לא ניתן לשלוח בקשה נוספת
              </li>
            )}
            {data.cars.map((car) => {
              const forCar = rangeBookings.filter((b) => b.carId === car.id);
              const approved = forCar.filter((b) => b.status === 'APPROVED');
              const pending = forCar.filter((b) => b.status === 'PENDING');
              return (
                <li key={car.id} className="border border-hairline rounded-xl p-3 bg-muted/40 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{car.name}</div>
                    {car.color && <div className="text-xs text-ink/60">{car.color}</div>}

                    {approved.length === 0 && pending.length === 0 && (
                      <div className="text-sm text-green-700 mt-2">✓ פנוי בטווח</div>
                    )}

                    {approved.map((b) => (
                      <div key={b.id} className="text-sm mt-2 text-red-700">
                        🔒 {b.driver?.name ?? 'מישהו'} — {fmtBooking(b)}
                        {b.purpose ? <span className="text-ink/60"> · {b.purpose}</span> : null}
                      </div>
                    ))}

                    {pending.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-yellow-700 font-medium">
                          {pending.length} בקשות ממתינות
                        </div>
                        {pending.map((b) => (
                          <div key={b.id} className="text-xs text-ink/70 pr-3">
                            • {b.driver?.name ?? 'מישהו'} {fmtBooking(b)}
                            {b.purpose ? <span className="text-ink/60"> · {b.purpose}</span> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {blockReason ? (
                    <span
                      title={blockReason}
                      className="shrink-0 text-sm px-3 py-1 bg-ink/10 text-ink/40 rounded-full font-semibold cursor-not-allowed"
                    >
                      שאטגן
                    </span>
                  ) : (
                    <Link
                      to={`/new-booking?carId=${car.id}&date=${fromStr}&endDate=${toStr}`}
                      className="shrink-0 text-sm px-3 py-1 bg-primary text-white rounded-full font-semibold shadow-soft"
                    >
                      שאטגן
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          );
        })()}
      </div>
      <FlowerGate me={me} />
      {me.name === 'המרגל' && <SpyComposeButton />}
    </div>
  );
}

function fmtBooking(b: Booking) {
  const s = new Date(b.startAt);
  const e = new Date(b.endAt);
  if (b.allDay) {
    return isSameDay(s, e)
      ? `${format(s, 'd בMMMM', { locale: he })} · כל היום`
      : `${format(s, 'd בMMMM', { locale: he })}–${format(e, 'd בMMMM', { locale: he })}`;
  }
  return isSameDay(s, e)
    ? `${format(s, 'd בMMMM HH:mm', { locale: he })}–${format(e, 'HH:mm')}`
    : `${format(s, 'd בMMMM HH:mm', { locale: he })}–${format(e, 'd בMMMM HH:mm', { locale: he })}`;
}
