import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { api, type ApprovalRow, type Member } from '../lib/api';

export default function ApprovalsPage({ meId: _meId, members }: { meId: string; members: Member[] }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => api<ApprovalRow[]>('/bookings/pending-approvals'),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}/decline`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-approvals'] }),
  });

  if (isLoading) return <div>טוען…</div>;
  if (data.length === 0) return <div className="text-ink/60">אין בקשות ממתינות לאישור 🎉</div>;

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? 'מישהו';

  const byCar = data.reduce<Record<string, ApprovalRow[]>>((acc, row) => {
    (acc[row.carId] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-xl text-primary">ממתין לאישור שלך</h2>
      {Object.entries(byCar).map(([carId, rows]) => (
        <section key={carId} className="bg-surface rounded-2xl shadow-soft p-4 border border-hairline">
          <h3 className="font-display font-medium mb-3">{rows[0].car?.name ?? 'רכב'}</h3>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="border border-hairline rounded-xl p-3 bg-muted/40">
                <div className="flex justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium">
                      {r.driver?.name ?? name(r.driverId)} ·{' '}
                      <span className="text-ink/70">
                        {r.allDay
                          ? `${format(new Date(r.startAt), 'd בMMMM', { locale: he })} (כל היום)`
                          : `${format(new Date(r.startAt), 'd בMMMM HH:mm', { locale: he })}–${format(new Date(r.endAt), 'HH:mm')}`}
                      </span>
                    </div>
                    {r.purpose && <div className="text-sm text-ink/60">{r.purpose}</div>}
                    <div className="text-xs text-ink/50">
                      נשלחה {format(new Date(r.createdAt), 'd בMMMM HH:mm', { locale: he })}
                    </div>
                    {r.conflicts.length > 0 && (
                      <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        ⚠ מתנגשת עם {r.conflicts.length} בקשות נוספות:
                        <ul className="mt-1 mr-3 list-disc">
                          {r.conflicts.map((c) => (
                            <li key={c.id}>
                              {name(c.driverId)}{' '}
                              {format(new Date(c.startAt), 'HH:mm')}–{format(new Date(c.endAt), 'HH:mm')}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-1 text-ink/60">אישור הבקשה ידחה אוטומטית את האחרות.</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    <button onClick={() => approve.mutate(r.id)}
                      className="px-4 py-1.5 bg-accent text-white rounded-full text-sm font-semibold shadow-soft">אישור</button>
                    <button onClick={() => decline.mutate(r.id)}
                      className="px-4 py-1.5 border border-hairline rounded-full text-sm hover:bg-muted">דחייה</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
