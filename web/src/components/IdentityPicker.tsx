import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const add = useMutation({
    mutationFn: (n: string) => api<Member>('/members', { method: 'POST', body: JSON.stringify({ name: n }) }),
    onSuccess: (m) => {
      qc.setQueryData<Member[]>(['members'], (old) => [...(old ?? []), m]);
      qc.invalidateQueries({ queryKey: ['members'] });
      localStorage.setItem('shotgun:onboarding', '1');
      onPicked(m.id);
      navigate('/');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-surface rounded-3xl shadow-soft p-8 max-w-md w-full space-y-6 border border-hairline">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">מי אתם?</h1>
          <p className="text-ink/60 text-sm">בחרו את שמכם כדי להשתמש באפליקציה. בלי סיסמאות — אמון משפחתי.</p>
        </div>

        {members.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-ink/80">בני משפחה קיימים</div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPicked(m.id)}
                  className="px-3 py-2 rounded-full border border-hairline hover:bg-primary-50 hover:border-primary-50 transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-ink/80">חדשים כאן?</div>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="השם שלכם"
              className="flex-1 px-3 py-2 border border-hairline rounded-xl focus:outline-none focus:border-primary"
            />
            <button
              disabled={!name.trim() || add.isPending}
              onClick={() => add.mutate(name.trim())}
              className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft disabled:opacity-50 font-semibold"
            >
              הצטרפות
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
