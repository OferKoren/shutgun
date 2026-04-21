import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Car, type Member } from '../lib/api';

export default function CarsPage({ members }: { members: Member[] }) {
  const qc = useQueryClient();
  const { data: cars = [] } = useQuery({ queryKey: ['cars'], queryFn: () => api<Car[]>('/cars') });

  const [name, setName] = useState('');
  const [ownerIds, setOwnerIds] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: () => api<Car>('/cars', { method: 'POST', body: JSON.stringify({ name, ownerIds }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] });
      setName(''); setOwnerIds([]);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/cars/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });
  const setOwners = useMutation({
    mutationFn: (v: { carId: string; ownerIds: string[] }) =>
      api(`/cars/${v.carId}/owners`, { method: 'PUT', body: JSON.stringify({ ownerIds: v.ownerIds }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
  });

  const toggle = (id: string, list: string[]) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
        <h2 className="font-display font-semibold text-xl mb-3 text-primary">הוספת רכב</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הרכב"
            className="w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" />
          <div>
            <div className="text-sm font-medium mb-1">בעלים (מאשרי בקשות)</div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-1 border border-hairline px-3 py-1 rounded-full bg-muted/40">
                  <input type="checkbox" checked={ownerIds.includes(m.id)}
                    onChange={() => setOwnerIds(toggle(m.id, ownerIds))} />
                  <span>{m.name}</span>
                </label>
              ))}
              {members.length === 0 && <span className="text-sm text-ink/60">הוסיפו בני משפחה קודם.</span>}
            </div>
          </div>
          <button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}
            className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft font-semibold disabled:opacity-50">הוספה</button>
        </div>
      </section>

      <section className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{car.name}</div>
                {car.color && <div className="text-xs text-ink/60">{car.color}</div>}
              </div>
              <button onClick={() => del.mutate(car.id)} className="text-sm text-red-600">מחיקה</button>
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">בעלים</div>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const checked = car.owners.some((o) => o.id === m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-1 border border-hairline px-3 py-1 rounded-full bg-muted/40">
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          const next = toggle(m.id, car.owners.map((o) => o.id));
                          setOwners.mutate({ carId: car.id, ownerIds: next });
                        }} />
                      <span>{m.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {cars.length === 0 && <div className="text-ink/60">אין רכבים עדיין.</div>}
      </section>
    </div>
  );
}
