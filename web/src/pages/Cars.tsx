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
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-xl mb-3">Add a car</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Car name"
            className="w-full border rounded px-3 py-2" />
          <div>
            <div className="text-sm font-medium mb-1">Owners (can approve bookings)</div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-1 border px-2 py-1 rounded">
                  <input type="checkbox" checked={ownerIds.includes(m.id)}
                    onChange={() => setOwnerIds(toggle(m.id, ownerIds))} />
                  <span>{m.name}</span>
                </label>
              ))}
              {members.length === 0 && <span className="text-sm text-slate-500">Add members first.</span>}
            </div>
          </div>
          <button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Add car</button>
        </div>
      </section>

      <section className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{car.name}</div>
                {car.color && <div className="text-xs text-slate-500">{car.color}</div>}
              </div>
              <button onClick={() => del.mutate(car.id)} className="text-sm text-red-600">Delete</button>
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Owners</div>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const checked = car.owners.some((o) => o.id === m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-1 border px-2 py-1 rounded">
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
        {cars.length === 0 && <div className="text-slate-500">No cars yet.</div>}
      </section>
    </div>
  );
}
