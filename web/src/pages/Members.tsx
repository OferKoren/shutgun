import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Member } from '../lib/api';

export default function MembersPage() {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  return (
    <div className="space-y-4 max-w-md">
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-xl mb-3">Add a member</h2>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className="flex-1 border rounded px-3 py-2" />
          <button onClick={() => add.mutate()} disabled={!name.trim() || add.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Add</button>
        </div>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Family</h2>
        <ul className="space-y-2">
          {data.map((m) => (
            <MemberRow key={m.id} member={m}
              onRename={(n) => rename.mutate({ id: m.id, name: n })}
              onDelete={() => del.mutate(m.id)} />
          ))}
          {data.length === 0 && <li className="text-slate-500 text-sm">No members yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function MemberRow({ member, onRename, onDelete }:
  { member: Member; onRename: (n: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(member.name);
  return (
    <li className="flex items-center gap-2">
      {editing ? (
        <>
          <input value={v} onChange={(e) => setV(e.target.value)}
            className="flex-1 border rounded px-2 py-1" />
          <button onClick={() => { onRename(v); setEditing(false); }}
            className="text-sm text-blue-600">Save</button>
          <button onClick={() => { setV(member.name); setEditing(false); }}
            className="text-sm text-slate-500">Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1">{member.name}</span>
          <button onClick={() => setEditing(true)} className="text-sm text-blue-600">Rename</button>
          <button onClick={onDelete} className="text-sm text-red-600">Delete</button>
        </>
      )}
    </li>
  );
}
