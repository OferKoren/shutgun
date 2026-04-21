import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Booking, type Car } from '../lib/api';

export default function NewBookingPage({ meId }: { meId: string }) {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: cars = [] } = useQuery({ queryKey: ['cars'], queryFn: () => api<Car[]>('/cars') });

  const initialDate = params.get('date') ?? new Date().toISOString().slice(0, 10);
  const [carId, setCarId] = useState(params.get('carId') ?? '');
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: (body: unknown) => api<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      nav('/');
    },
    onError: (e: Error) => setError(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!carId) return setError('בחרו רכב');

    const startAt = allDay
      ? new Date(`${date}T00:00:00`).toISOString()
      : new Date(`${date}T${startTime}`).toISOString();
    const endAt = allDay
      ? new Date(`${endDate}T23:59:59`).toISOString()
      : new Date(`${endDate}T${endTime}`).toISOString();

    submit.mutate({ carId, driverId: meId, startAt, endAt, allDay, purpose: purpose || null });
  };

  return (
    <form onSubmit={onSubmit} className="bg-surface rounded-2xl p-6 shadow-soft border border-hairline max-w-lg space-y-4">
      <h2 className="font-display font-semibold text-xl text-primary">בקשת רכב</h2>

      <label className="block">
        <span className="text-sm font-medium">רכב</span>
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          required
        >
          <option value="">— בחרו —</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <span className="text-sm">כל היום</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">תאריך התחלה</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">תאריך סיום</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" required />
        </label>
        {!allDay && (
          <>
            <label className="block">
              <span className="text-sm font-medium">שעת התחלה</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">שעת סיום</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" required />
            </label>
          </>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">סיבה (לא חובה)</span>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
          placeholder="הסעות, קניות, ערב זוגי…"
          className="mt-1 w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" />
      </label>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={submit.isPending}
          className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft font-semibold disabled:opacity-50">
          שליחת בקשה
        </button>
        <button type="button" onClick={() => nav(-1)} className="px-4 py-2 border border-hairline rounded-xl hover:bg-muted">
          ביטול
        </button>
      </div>
    </form>
  );
}
