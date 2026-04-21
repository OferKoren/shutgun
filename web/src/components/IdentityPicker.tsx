import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Member } from '../lib/api';

export default function IdentityPicker({
  members,
  onPicked,
}: {
  members: Member[];
  onPicked: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: (n: string) => api<Member>('/members', { method: 'POST', body: JSON.stringify({ name: n }) }),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      onPicked(m.id);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Who are you?</h1>
          <p className="text-slate-500 text-sm">Pick your name to use the app. No password — family trust.</p>
        </div>

        {members.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Existing family members</div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPicked(m.id)}
                  className="px-3 py-2 rounded border hover:bg-blue-50"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">New here?</div>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              disabled={!name.trim() || add.isPending}
              onClick={() => add.mutate(name.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Add me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
