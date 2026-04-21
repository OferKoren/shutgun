import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { api, type ApprovalRow, type Booking, type Car, type Member } from '../lib/api';
import { LoadingBlock } from '../components/Spinner';
import ReasonModal from '../components/ReasonModal';

type Tab = 'owner' | 'driver';
type Sort = 'time' | 'car';

function fmtWhen(b: Pick<Booking, 'startAt' | 'endAt' | 'allDay'>) {
  return b.allDay
    ? `${format(new Date(b.startAt), 'd בMMMM', { locale: he })} (כל היום)`
    : `${format(new Date(b.startAt), 'd בMMMM HH:mm', { locale: he })}–${format(new Date(b.endAt), 'HH:mm')}`;
}

export default function ApprovalsPage({ meId, members }: { meId: string; members: Member[] }) {
  const { data: cars = [] } = useQuery({ queryKey: ['cars'], queryFn: () => api<Car[]>('/cars') });
  const isOwner = cars.some((c) => c.owners?.some((o) => o.id === meId));
  const [tab, setTab] = useState<Tab>(isOwner ? 'owner' : 'driver');
  const effectiveTab = isOwner ? tab : 'driver';

  return (
    <div className="space-y-5">
      {isOwner && (
        <div className="flex gap-2">
          <TabButton active={effectiveTab === 'owner'} onClick={() => setTab('owner')}>האישורים שלי</TabButton>
          <TabButton active={effectiveTab === 'driver'} onClick={() => setTab('driver')}>הנסיעות שלי</TabButton>
        </div>
      )}
      {effectiveTab === 'owner' ? <OwnerTab meId={meId} members={members} /> : <DriverTab meId={meId} members={members} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-soft ${
        active ? 'bg-primary text-white' : 'bg-surface border border-hairline text-ink/70 hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function OwnerTab({ meId, members }: { meId: string; members: Member[] }) {
  const qc = useQueryClient();
  const [sort, setSort] = useState<Sort>('time');
  const [modal, setModal] = useState<
    | { kind: 'decline'; id: string; driverName: string }
    | { kind: 'revoke'; id: string; driverName: string }
    | null
  >(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => api<ApprovalRow[]>('/bookings/pending-approvals'),
  });
  const { data: myApproved = [] } = useQuery({
    queryKey: ['my-owner-approved', meId],
    queryFn: () =>
      api<Booking[]>(`/bookings?status=APPROVED&decidedBy=${encodeURIComponent(meId)}`),
  });

  const approve = useMutation({
    mutationFn: ({ id, override }: { id: string; override?: boolean }) =>
      api(`/bookings/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(override ? { override: true } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['my-approved-rides'] });
      qc.invalidateQueries({ queryKey: ['my-owner-approved'] });
    },
  });
  const decline = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api(`/bookings/${id}/decline`, {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-approvals'] }),
  });
  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api(`/bookings/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-owner-approved'] });
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['my-approved-rides'] });
      qc.invalidateQueries({ queryKey: ['my-updates'] });
    },
  });

  if (isLoading) return <LoadingBlock />;

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? 'מישהו';
  const approvedByMe = [...myApproved].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const ApprovedAccordion = approvedByMe.length > 0 ? (
    <details className="bg-surface rounded-2xl shadow-soft border border-hairline">
      <summary className="cursor-pointer select-none px-4 py-3 font-medium text-ink/80 flex justify-between items-center">
        <span>אישורים שנתת ({approvedByMe.length})</span>
        <span className="text-xs text-ink/50">לפי סדר כרונולוגי</span>
      </summary>
      <ul className="px-4 pb-3 space-y-2">
        {approvedByMe.map((b) => (
          <li key={b.id} className="text-sm border-t border-hairline pt-2 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted border border-hairline">
                  {b.car?.name ?? 'רכב'}
                </span>
                <span className="font-medium">{b.driver?.name ?? name(b.driverId)}</span>
                <span className="text-ink/70">{fmtWhen(b)}</span>
              </div>
              <button
                onClick={() => setModal({ kind: 'revoke', id: b.id, driverName: b.driver?.name ?? name(b.driverId) })}
                className="text-xs px-3 py-1 border border-red-200 text-red-700 rounded-full hover:bg-red-50"
              >
                בטל אישור
              </button>
            </div>
            {b.purpose && <div className="text-xs text-ink/60 mt-0.5">{b.purpose}</div>}
          </li>
        ))}
      </ul>
    </details>
  ) : null;

  const Modals = (
    <>
      <ReasonModal
        open={modal?.kind === 'decline'}
        title="דחיית בקשה"
        description={modal?.kind === 'decline' ? `לדחות את בקשת ${modal.driverName}?` : undefined}
        placeholder="סיבה לדחייה (אפשר לדלג)"
        confirmLabel="דחייה"
        tone="danger"
        onCancel={() => setModal(null)}
        onConfirm={(reason) => {
          if (modal?.kind !== 'decline') return;
          decline.mutate({ id: modal.id, reason });
          setModal(null);
        }}
      />
      <ReasonModal
        open={modal?.kind === 'revoke'}
        title="ביטול אישור"
        description={modal?.kind === 'revoke' ? `לבטל את האישור שניתן ל${modal.driverName}?` : undefined}
        placeholder="סיבה לביטול (אפשר לדלג)"
        confirmLabel="בטל אישור"
        tone="danger"
        onCancel={() => setModal(null)}
        onConfirm={(reason) => {
          if (modal?.kind !== 'revoke') return;
          revoke.mutate({ id: modal.id, reason });
          setModal(null);
        }}
      />
    </>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-ink/60">אין בקשות ממתינות לאישור 🎉</div>
        {ApprovedAccordion}
        {Modals}
      </div>
    );
  }

  const renderCard = (r: ApprovalRow) => (
    <div key={r.id} className="bg-surface rounded-2xl shadow-soft p-4 border border-hairline">
      <div className="flex justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted border border-hairline">
              {r.car?.name ?? 'רכב'}
            </span>
            <span className="font-medium">{r.driver?.name ?? name(r.driverId)}</span>
          </div>
          <div className="text-ink/70">{fmtWhen(r)}</div>
          {r.purpose && <div className="text-sm text-ink/60 mt-0.5">{r.purpose}</div>}
          <div className="text-xs text-ink/50 mt-0.5">
            נשלחה {format(new Date(r.createdAt), 'd בMMMM HH:mm', { locale: he })}
          </div>
          {r.approvedConflicts.length > 0 && (
            <div className="mt-2 text-xs bg-red-50 border border-red-200 rounded-lg p-2 text-red-900">
              🚗 הרכב כבר מושאל בזמן הזה:
              <ul className="mt-1 mr-3 list-disc">
                {r.approvedConflicts.map((c) => (
                  <li key={c.id}>
                    {name(c.driverId)}{' '}
                    {format(new Date(c.startAt), 'HH:mm')}–{format(new Date(c.endAt), 'HH:mm')}
                  </li>
                ))}
              </ul>
              <div className="mt-1">אישור הבקשה יבטל את ההשאלה הקיימת.</div>
            </div>
          )}
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
          <button
            onClick={() => {
              if (r.approvedConflicts.length > 0) {
                const names = r.approvedConflicts.map((c) => name(c.driverId)).join(', ');
                const ok = window.confirm(
                  `הרכב כבר מושאל ל${names} בזמן הזה. לאשר את הבקשה ולבטל את ההשאלה הקיימת?`,
                );
                if (!ok) return;
                approve.mutate({ id: r.id, override: true });
              } else {
                approve.mutate({ id: r.id });
              }
            }}
            className="px-4 py-1.5 bg-accent text-white rounded-full text-sm font-semibold shadow-soft"
          >
            אישור
          </button>
          <button
            onClick={() => setModal({ kind: 'decline', id: r.id, driverName: r.driver?.name ?? name(r.driverId) })}
            className="px-4 py-1.5 border border-hairline rounded-full text-sm hover:bg-muted"
          >
            דחייה
          </button>
        </div>
      </div>
    </div>
  );

  const byTime = [...data].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const byCar = data.reduce<Record<string, ApprovalRow[]>>((acc, row) => {
    (acc[row.carId] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex gap-1 text-sm">
        <SortButton active={sort === 'time'} onClick={() => setSort('time')}>לפי זמן</SortButton>
        <SortButton active={sort === 'car'} onClick={() => setSort('car')}>לפי רכב</SortButton>
      </div>
      {sort === 'time' ? (
        <div className="space-y-3">{byTime.map(renderCard)}</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byCar).map(([carId, rows]) => (
            <section key={carId} className="space-y-2">
              <h3 className="font-display font-medium">{rows[0].car?.name ?? 'רכב'}</h3>
              <div className="space-y-3">{rows.map(renderCard)}</div>
            </section>
          ))}
        </div>
      )}
      {ApprovedAccordion}
      {Modals}
    </div>
  );
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border ${
        active ? 'bg-primary/10 border-primary/30 text-primary' : 'border-hairline text-ink/60 hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function DriverTab({ meId, members }: { meId: string; members: Member[] }) {
  const [nowIso] = useState(() => new Date().toISOString());
  const approvedQ = useQuery({
    queryKey: ['my-approved-rides', meId, nowIso],
    queryFn: () =>
      api<Booking[]>(
        `/bookings?driverId=${encodeURIComponent(meId)}&status=APPROVED&from=${encodeURIComponent(nowIso)}`,
      ),
  });
  const pendingQ = useQuery({
    queryKey: ['my-pending-rides', meId, nowIso],
    queryFn: () =>
      api<Booking[]>(
        `/bookings?driverId=${encodeURIComponent(meId)}&status=PENDING&from=${encodeURIComponent(nowIso)}`,
      ),
  });

  if (approvedQ.isLoading || pendingQ.isLoading) return <LoadingBlock />;

  const rows = [...(approvedQ.data ?? []), ...(pendingQ.data ?? [])].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  if (rows.length === 0) return <div className="text-ink/60">אין נסיעות קרובות</div>;

  const name = (id?: string | null) => (id ? members.find((m) => m.id === id)?.name ?? null : null);

  const tag = (s: Booking['status']) =>
    s === 'APPROVED'
      ? { label: 'מאושר', cls: 'bg-accent/10 text-accent border-accent/20' }
      : { label: 'ממתין לאישור', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' };

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const t = tag(r.status);
        return (
          <div key={r.id} className="bg-surface rounded-2xl shadow-soft p-4 border border-hairline">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${t.cls}`}>
                {t.label}
              </span>
              <span className="font-medium">{r.car?.name ?? 'רכב'}</span>
            </div>
            <div className="text-ink/70">{fmtWhen(r)}</div>
            {r.purpose && <div className="text-sm text-ink/60 mt-0.5">{r.purpose}</div>}
            {r.status === 'APPROVED' && name(r.decidedBy) && (
              <div className="text-xs text-ink/50 mt-0.5">אישר: {name(r.decidedBy)}</div>
            )}
            {r.status === 'PENDING' && (
              <div className="text-xs text-ink/50 mt-0.5">
                נשלחה {format(new Date(r.createdAt), 'd בMMMM HH:mm', { locale: he })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
