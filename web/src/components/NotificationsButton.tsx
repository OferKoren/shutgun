import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { api, type Booking, type SpyMessage } from '../lib/api';

const LAST_SEEN_KEY = 'shotgun:lastSeenNotifAt';
const CLEARED_KEY = 'shotgun:notifClearedAt';

type Kind = 'approved' | 'revoked' | 'declined' | 'cancelled' | 'spy';

function classify(b: Booking): Kind {
  if (b.status === 'APPROVED') return 'approved';
  if (b.status === 'CANCELLED') return 'cancelled';
  const r = (b.declineReason ?? '').toLowerCase();
  if (r.startsWith('revoked')) return 'revoked';
  return 'declined';
}

function prettyReason(b: Booking): string | null {
  const r = b.declineReason;
  if (!r) return null;
  if (r === 'Revoked by owner') return null;
  if (r.startsWith('Revoked by owner: ')) return r.slice('Revoked by owner: '.length);
  if (r === 'Conflict with approved booking') return 'נדחתה אוטומטית — חפיפה עם אישור קיים';
  if (r === 'Overridden by owner decision') return 'הוחלפה ע״י בקשה אחרת שאושרה';
  return r;
}

const META: Record<Kind, { icon: string; label: string; color: string }> = {
  approved: { icon: '✅', label: 'אושר', color: 'text-green-700' },
  declined: { icon: '❌', label: 'נדחה', color: 'text-red-700' },
  revoked: { icon: '🚫', label: 'האישור בוטל', color: 'text-red-700' },
  cancelled: { icon: '🗑', label: 'בוטל', color: 'text-ink/60' },
  spy: { icon: '🕵️', label: 'הודעה מהמרגל', color: 'text-ink' },
};

function fmtRange(b: Booking) {
  const s = new Date(b.startAt);
  const e = new Date(b.endAt);
  if (b.allDay) return `${format(s, 'd בMMMM', { locale: he })} · כל היום`;
  return `${format(s, 'd בMMMM HH:mm', { locale: he })}–${format(e, 'HH:mm')}`;
}

type Item =
  | { kind: 'booking'; at: string; booking: Booking }
  | { kind: 'spy'; at: string; msg: SpyMessage };

export default function NotificationsButton({ meId }: { meId: string }) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem(LAST_SEEN_KEY) ?? '');
  const [clearedAt, setClearedAt] = useState<string>(() => localStorage.getItem(CLEARED_KEY) ?? '');
  const popRef = useRef<HTMLDivElement>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-updates', meId],
    queryFn: () => api<Booking[]>('/bookings/my-updates'),
    refetchOnWindowFocus: true,
  });

  const { data: spyMessages = [] } = useQuery({
    queryKey: ['spy-messages'],
    queryFn: () => api<SpyMessage[]>('/spy/messages'),
    refetchOnWindowFocus: true,
  });

  const items: Item[] = [
    ...bookings
      .filter((b) => b.decidedAt)
      .map((b): Item => ({ kind: 'booking', at: b.decidedAt!, booking: b })),
    ...spyMessages.map((m): Item => ({ kind: 'spy', at: m.createdAt, msg: m })),
  ]
    .filter((it) => it.at > clearedAt)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const unread = items.filter((it) => it.at > lastSeen).length;

  const clearAll = () => {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_KEY, now);
    localStorage.setItem(LAST_SEEN_KEY, now);
    setClearedAt(now);
    setLastSeen(now);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SEEN_KEY, now);
      setLastSeen(now);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={popRef}>
      <button
        onClick={toggle}
        className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-lg"
        aria-label="התראות"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-auto bg-surface border border-hairline rounded-2xl shadow-soft z-30">
          <div className="px-4 py-2 border-b border-hairline font-medium text-sm flex items-center justify-between">
            <span>התראות</span>
            {items.length > 0 && (
              <button onClick={clearAll} className="text-xs text-primary hover:underline">
                נקה הכל
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="p-4 text-sm text-ink/60">אין עדיין עדכונים</div>
          ) : (
            <ul>
              {items.map((it) => {
                if (it.kind === 'booking') {
                  const b = it.booking;
                  const m = META[classify(b)];
                  const when = new Date(it.at);
                  return (
                    <li key={`b-${b.id}`} className="px-4 py-2 border-b border-hairline last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none pt-0.5">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${m.color}`}>
                            {m.label} · {b.car?.name ?? 'רכב'}
                          </div>
                          <div className="text-xs text-ink/70">{fmtRange(b)}</div>
                          {prettyReason(b) && (
                            <div className="text-xs text-ink/70 mt-0.5 italic">
                              סיבה: {prettyReason(b)}
                            </div>
                          )}
                          <div className="text-[10px] text-ink/40 mt-0.5">
                            {format(when, 'd בMMMM HH:mm', { locale: he })}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }
                const m = META.spy;
                const msg = it.msg;
                const when = new Date(it.at);
                return (
                  <li key={`s-${msg.id}`} className="px-4 py-2 border-b border-hairline last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none pt-0.5">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${m.color}`}>
                          {m.label}
                        </div>
                        <div className="text-sm text-ink/80 whitespace-pre-wrap break-words">
                          {msg.body}
                        </div>
                        <div className="text-[10px] text-ink/40 mt-0.5">
                          {format(when, 'd בMMMM HH:mm', { locale: he })}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
