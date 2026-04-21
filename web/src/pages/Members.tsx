import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setMemberId, type Member } from '../lib/api';
import Spinner from '../components/Spinner';

export default function MembersPage({ meId }: { meId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['members'], queryFn: () => api<Member[]>('/members') });

  const [name, setName] = useState('');
  const add = useMutation({
    mutationFn: () => api<Member>('/members', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setName(''); },
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) =>
      api(`/members/${v.id}`, { method: 'PATCH', body: JSON.stringify({ name: v.name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/members/${id}`, { method: 'DELETE' }),
    onSuccess: (_d, id) => {
      if (id === meId) {
        setMemberId(null);
        location.reload();
        return;
      }
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return (
    <div className="space-y-4 max-w-md">
      <section className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
        <h2 className="font-display font-semibold text-xl mb-3 text-primary">הוספת בן משפחה</h2>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם"
            className="flex-1 border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-primary" />
          <button onClick={() => add.mutate()} disabled={!name.trim() || add.isPending}
            className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft font-semibold disabled:opacity-50 flex items-center gap-2">
            {add.isPending && <Spinner size="sm" className="text-white" />}
            הוספה
          </button>
        </div>
      </section>

      <section className="bg-surface rounded-2xl p-4 shadow-soft border border-hairline">
        <h2 className="font-display font-semibold text-lg mb-3">משפחה</h2>
        <ul className="space-y-2">
          {data.map((m) => (
            <MemberRow key={m.id} member={m} isMe={m.id === meId}
              onRename={(n) => rename.mutate({ id: m.id, name: n })}
              onDelete={() => del.mutate(m.id)} />
          ))}
          {data.length === 0 && <li className="text-ink/60 text-sm">אין בני משפחה עדיין.</li>}
        </ul>
      </section>
    </div>
  );
}

function MemberRow({ member, isMe, onRename, onDelete }:
  { member: Member; isMe: boolean; onRename: (n: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(member.name);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!confirmDel) return;
    const t = setTimeout(() => setConfirmDel(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDel]);

  return (
    <li className="flex items-center gap-2">
      {editing ? (
        <>
          <input value={v} onChange={(e) => setV(e.target.value)}
            className="flex-1 border border-hairline rounded-lg px-2 py-1" />
          <button onClick={() => { onRename(v); setEditing(false); }}
            className="text-sm text-primary font-semibold">שמירה</button>
          <button onClick={() => { setV(member.name); setEditing(false); }}
            className="text-sm text-ink/60">ביטול</button>
        </>
      ) : (
        <>
          <span className="flex-1">{member.name}{isMe && <span className="text-ink/50 text-xs mr-2">(אני)</span>}</span>
          {isMe && !confirmDel && (
            <>
              <button onClick={() => setEditing(true)} className="text-sm text-primary">שינוי שם</button>
              <button onClick={() => setConfirmDel(true)} className="text-sm text-red-600">מחיקה</button>
            </>
          )}
          {isMe && confirmDel && (
            <>
              <button
                onClick={() => { onDelete(); setConfirmDel(false); }}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-red-600 text-white shadow-soft"
              >למחוק?</button>
              <button onClick={() => setConfirmDel(false)} className="text-sm text-ink/60">ביטול</button>
            </>
          )}
        </>
      )}
    </li>
  );
}
