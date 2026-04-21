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
    if (!carId) return setError('Pick a car');

    const startAt = allDay
      ? new Date(`${date}T00:00:00`).toISOString()
      : new Date(`${date}T${startTime}`).toISOString();
    const endAt = allDay
      ? new Date(`${endDate}T23:59:59`).toISOString()
      : new Date(`${endDate}T${endTime}`).toISOString();

    submit.mutate({ carId, driverId: meId, startAt, endAt, allDay, purpose: purpose || null });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-lg space-y-4">
      <h2 className="font-semibold text-xl">Request a car</h2>

      <label className="block">
        <span className="text-sm font-medium">Car</span>
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        >
          <option value="">— pick —</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <span className="text-sm">All day</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Start date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">End date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" required />
        </label>
        {!allDay && (
          <>
            <label className="block">
              <span className="text-sm font-medium">Start time</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">End time</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2" required />
            </label>
          </>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Purpose (optional)</span>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
          placeholder="School run, grocery, date night…"
          className="mt-1 w-full border rounded px-3 py-2" />
      </label>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={submit.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          Submit request
        </button>
        <button type="button" onClick={() => nav(-1)} className="px-4 py-2 border rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}
