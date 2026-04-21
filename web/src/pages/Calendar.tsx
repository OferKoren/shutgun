import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { api, type Booking, type Car } from '../lib/api';

type CalendarPayload = { from: string; to: string; cars: Car[]; bookings: Booking[] };

export default function CalendarPage({ meId: _meId }: { meId: string }) {
  const [month, setMonth] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date | undefined>(new Date());

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

  const dayStatus = (d: Date): 'green' | 'yellow' | 'red' | 'none' => {
    const cars = data?.cars ?? [];
    if (cars.length === 0) return 'none';
    const dayBookings = bookingsByDay.get(format(d, 'yyyy-MM-dd')) ?? [];
    if (dayBookings.length === 0) return 'green';
    const approvedCarIds = new Set(dayBookings.filter((b) => b.status === 'APPROVED').map((b) => b.carId));
    if (approvedCarIds.size >= cars.length) return 'red';
    if (dayBookings.some((b) => b.status === 'PENDING')) return 'yellow';
    return 'green';
  };

  const modifiers = {
    green: (d: Date) => dayStatus(d) === 'green',
    yellow: (d: Date) => dayStatus(d) === 'yellow',
    red: (d: Date) => dayStatus(d) === 'red',
  };
  const modifiersClassNames = {
    green: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full after:mx-auto after:mt-0.5',
    yellow: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-yellow-500 after:rounded-full after:mx-auto after:mt-0.5',
    red: 'after:content-[""] after:block after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full after:mx-auto after:mt-0.5',
  };

  const selectedKey = selected ? format(selected, 'yyyy-MM-dd') : null;
  const dayBookings = selectedKey ? bookingsByDay.get(selectedKey) ?? [] : [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={setSelected}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          showOutsideDays
        />
        <div className="flex gap-3 text-xs text-slate-600 mt-2 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> all free</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> pending</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> all booked</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">
          {selected ? format(selected, 'EEEE, MMM d') : 'Pick a day'}
        </h2>
        {!data && <div>Loading…</div>}
        {data && data.cars.length === 0 && (
          <div className="text-slate-500 text-sm">
            No cars yet. <Link className="text-blue-600 underline" to="/cars">Add one →</Link>
          </div>
        )}
        {data && selected && (
          <ul className="space-y-3">
            {data.cars.map((car) => {
              const forCar = dayBookings.filter((b) => b.carId === car.id);
              const approved = forCar.filter((b) => b.status === 'APPROVED');
              const pending = forCar.filter((b) => b.status === 'PENDING');
              return (
                <li key={car.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium">{car.name}</div>
                      {car.color && <div className="text-xs text-slate-500">{car.color}</div>}
                    </div>
                    <Link
                      to={`/new-booking?carId=${car.id}&date=${format(selected, 'yyyy-MM-dd')}`}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Request
                    </Link>
                  </div>

                  {approved.length === 0 && pending.length === 0 && (
                    <div className="text-sm text-green-700 mt-2">✓ Available all day</div>
                  )}

                  {approved.map((b) => (
                    <div key={b.id} className="text-sm mt-2 text-red-700">
                      🔒 {b.driver?.name ?? 'someone'} — {fmtRange(b, selected)}
                      {b.purpose ? <span className="text-slate-500"> · {b.purpose}</span> : null}
                    </div>
                  ))}

                  {pending.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-yellow-700 font-medium">
                        {pending.length} pending request{pending.length > 1 ? 's' : ''}
                      </div>
                      {pending.map((b) => (
                        <div key={b.id} className="text-xs text-slate-600 pl-3">
                          • {b.driver?.name ?? 'someone'} {fmtRange(b, selected)}
                          {b.purpose ? <span className="text-slate-500"> · {b.purpose}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function fmtRange(b: Booking, day: Date) {
  if (b.allDay) return 'all day';
  const s = new Date(b.startAt);
  const e = new Date(b.endAt);
  const sSame = isSameDay(s, day);
  const eSame = isSameDay(e, day);
  const sStr = sSame ? format(s, 'HH:mm') : format(s, 'MMM d HH:mm');
  const eStr = eSame ? format(e, 'HH:mm') : format(e, 'MMM d HH:mm');
  return `${sStr}–${eStr}`;
}
