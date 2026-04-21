import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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

  if (isLoading) return <div>Loading…</div>;
  if (data.length === 0) return <div className="text-slate-500">Nothing waiting on you. 🎉</div>;

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? 'someone';

  const byCar = data.reduce<Record<string, ApprovalRow[]>>((acc, row) => {
    (acc[row.carId] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-xl">Needs your approval</h2>
      {Object.entries(byCar).map(([carId, rows]) => (
        <section key={carId} className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium mb-3">{rows[0].car?.name ?? 'Car'}</h3>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="border rounded-lg p-3">
                <div className="flex justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium">
                      {r.driver?.name ?? name(r.driverId)} ·{' '}
                      <span className="text-slate-600">
                        {r.allDay
                          ? `${format(new Date(r.startAt), 'MMM d')} (all day)`
                          : `${format(new Date(r.startAt), 'MMM d HH:mm')}–${format(new Date(r.endAt), 'HH:mm')}`}
                      </span>
                    </div>
                    {r.purpose && <div className="text-sm text-slate-500">{r.purpose}</div>}
                    <div className="text-xs text-slate-400">
                      requested {format(new Date(r.createdAt), 'MMM d HH:mm')}
                    </div>
                    {r.conflicts.length > 0 && (
                      <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                        ⚠ conflicts with {r.conflicts.length} other request{r.conflicts.length > 1 ? 's' : ''}:
                        <ul className="mt-1 ml-3 list-disc">
                          {r.conflicts.map((c) => (
                            <li key={c.id}>
                              {name(c.driverId)}{' '}
                              {format(new Date(c.startAt), 'HH:mm')}–{format(new Date(c.endAt), 'HH:mm')}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-1 text-slate-500">Approving this will auto-decline the others.</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    <button onClick={() => approve.mutate(r.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                    <button onClick={() => decline.mutate(r.id)}
                      className="px-3 py-1 border rounded text-sm">Decline</button>
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
