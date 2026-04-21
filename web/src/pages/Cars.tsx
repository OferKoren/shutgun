import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getMemberId, type Car, type Member } from '../lib/api';
import { CAR_COLORS, CAR_ICONS, CarIcon, DEFAULT_COLOR, DEFAULT_ICON } from '../lib/carStyles';
import ConfirmModal from '../components/ConfirmModal';
import Spinner from '../components/Spinner';

type SelfRemoveIntent =
  | { kind: 'self'; carId: string; carName: string; nextIds: string[] }
  | { kind: 'last'; carId: string; carName: string };

export default function CarsPage({ members }: { members: Member[] }) {
  const qc = useQueryClient();
  const { data: cars = [] } = useQuery({ queryKey: ['cars'], queryFn: () => api<Car[]>('/cars') });

  const [name, setName] = useState('');
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selfRemove, setSelfRemove] = useState<SelfRemoveIntent | null>(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const t = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDeleteId]);

  const create = useMutation({
    mutationFn: () =>
      api<Car>('/cars', { method: 'POST', body: JSON.stringify({ name, ownerIds, color, icon }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] });
      setName(''); setOwnerIds([]); setColor(DEFAULT_COLOR); setIcon(DEFAULT_ICON);
      setAddOpen(false);
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
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          aria-expanded={addOpen}
          className="w-full flex items-center justify-between gap-3"
        >
          <h2 className="font-display font-semibold text-xl text-primary">הוספת רכב</h2>
          <span className={`text-ink/60 transition-transform ${addOpen ? 'rotate-180' : ''}`} aria-hidden>▾</span>
        </button>
        {addOpen && (
        <div className="space-y-4 mt-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-20 h-12 rounded-xl bg-muted/40 border border-hairline flex items-center justify-center">
              <CarIcon icon={icon} color={color} className="w-16 h-10" />
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הרכב"
              className="w-full border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">צבע</div>
            <div className="flex flex-wrap gap-2">
              {CAR_COLORS.map((c) => {
                const active = c.hex === color;
                return (
                  <button key={c.key} type="button" onClick={() => setColor(c.hex)}
                    aria-label={c.label} aria-pressed={active}
                    className={`w-8 h-8 rounded-full border-2 transition ${active ? 'border-ink scale-110' : 'border-hairline'}`}
                    style={{ backgroundColor: c.hex }} />
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">סוג רכב</div>
            <div className="grid grid-cols-5 gap-2">
              {CAR_ICONS.map((i) => {
                const active = i.key === icon;
                const { Cmp } = i;
                return (
                  <button key={i.key} type="button" onClick={() => setIcon(i.key)}
                    aria-label={i.label} aria-pressed={active}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${active ? 'border-primary bg-primary/5' : 'border-hairline bg-muted/30'}`}>
                    <Cmp color={color} className="w-12 h-8" />
                    <span className="text-[11px] text-ink/70">{i.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
            className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft font-semibold disabled:opacity-50 flex items-center gap-2">
            {create.isPending && <Spinner size="sm" className="text-white" />}
            הוספה
          </button>
        </div>
        )}
      </section>

      <section className="space-y-3">
        {cars.map((car) => {
          const myId = getMemberId();
          const isOwner = !!myId && car.owners.some((o) => o.id === myId);
          return (
          <div key={car.id} className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-16 h-10 rounded-lg bg-muted/40 border border-hairline flex items-center justify-center">
                  <CarIcon icon={car.icon} color={car.color} className="w-14 h-8" />
                </div>
                <div className="font-medium truncate">{car.name}</div>
              </div>
              {isOwner && (confirmDeleteId === car.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { del.mutate(car.id); setConfirmDeleteId(null); }}
                    className="text-sm font-semibold px-3 py-1 rounded-full bg-red-600 text-white shadow-soft"
                  >למחוק?</button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-sm text-ink/60"
                  >ביטול</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(car.id)}
                  className="text-sm text-red-600 shrink-0"
                >מחיקה</button>
              ))}
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">בעלים</div>
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const checked = car.owners.some((o) => o.id === m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-1 border border-hairline px-3 py-1 rounded-full bg-muted/40">
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            const currentIds = car.owners.map((o) => o.id);
                            const next = toggle(m.id, currentIds);
                            const removingSelf = m.id === myId && checked;
                            if (removingSelf) {
                              if (car.owners.length === 1) {
                                setSelfRemove({ kind: 'last', carId: car.id, carName: car.name });
                              } else {
                                setSelfRemove({ kind: 'self', carId: car.id, carName: car.name, nextIds: next });
                              }
                              return;
                            }
                            setOwners.mutate({ carId: car.id, ownerIds: next });
                          }} />
                        <span>{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {car.owners.map((o) => (
                    <span key={o.id} className="text-sm border border-hairline px-3 py-1 rounded-full bg-muted/40">{o.name}</span>
                  ))}
                  {car.owners.length === 0 && <span className="text-sm text-ink/60">אין בעלים.</span>}
                </div>
              )}
            </div>
          </div>
          );
        })}
        {cars.length === 0 && <div className="text-ink/60">אין רכבים עדיין.</div>}
      </section>

      <ConfirmModal
        open={selfRemove?.kind === 'self'}
        icon="👋"
        title="להסיר את עצמך מהבעלים?"
        body={selfRemove?.kind === 'self' ? `לא תוכל יותר לאשר בקשות עבור "${selfRemove.carName}".` : ''}
        confirmLabel="הסרה"
        variant="danger"
        onCancel={() => setSelfRemove(null)}
        onConfirm={() => {
          if (selfRemove?.kind !== 'self') return;
          setOwners.mutate({ carId: selfRemove.carId, ownerIds: selfRemove.nextIds });
          setSelfRemove(null);
        }}
      />
      <ConfirmModal
        open={selfRemove?.kind === 'last'}
        icon="⚠️"
        title="זהו הבעלים האחרון"
        body={selfRemove?.kind === 'last' ? `הסרת עצמך תמחק את הרכב "${selfRemove.carName}" לצמיתות יחד עם כל ההזמנות שלו.` : ''}
        confirmLabel="למחוק את הרכב"
        variant="danger"
        onCancel={() => setSelfRemove(null)}
        onConfirm={() => {
          if (selfRemove?.kind !== 'last') return;
          del.mutate(selfRemove.carId);
          setSelfRemove(null);
        }}
      />
    </div>
  );
}
