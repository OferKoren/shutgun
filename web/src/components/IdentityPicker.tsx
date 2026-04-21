import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type Member } from '../lib/api';
import Spinner from './Spinner';

export default function IdentityPicker({
  members,
  onPicked,
}: {
  members: Member[];
  onPicked: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [spyMember, setSpyMember] = useState<Member | null>(null);
  const [spyPassword, setSpyPassword] = useState('');
  const [spyError, setSpyError] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const handlePick = (m: Member) => {
    if (m.name === 'המרגל') {
      setSpyMember(m);
      setSpyPassword('');
      setSpyError(false);
      return;
    }
    onPicked(m.id);
  };

  const submitSpy = () => {
    if (spyPassword === '12345678' && spyMember) {
      onPicked(spyMember.id);
      setSpyMember(null);
    } else {
      setSpyError(true);
    }
  };

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
                  onClick={() => handlePick(m)}
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
              className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {add.isPending && <Spinner size="sm" className="text-white" />}
              הצטרפות
            </button>
          </div>
        </div>
      </div>

      {spyMember && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setSpyMember(null)}
        >
          <div
            className="bg-surface rounded-3xl shadow-soft p-6 max-w-sm w-full space-y-4 border border-hairline"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <div className="text-4xl">🕵️</div>
              <h2 className="text-xl font-display font-bold text-primary">זיהוי סודי</h2>
              <p className="text-ink/60 text-sm">המרגל צריך סיסמה</p>
            </div>
            <input
              type="password"
              autoFocus
              value={spyPassword}
              onChange={(e) => {
                setSpyPassword(e.target.value);
                setSpyError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitSpy()}
              placeholder="סיסמה"
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${
                spyError ? 'border-red-500' : 'border-hairline focus:border-primary'
              }`}
            />
            {spyError && <div className="text-sm text-red-600 text-center">סיסמה שגויה</div>}
            <div className="flex gap-2">
              <button
                onClick={() => setSpyMember(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-hairline"
              >
                ביטול
              </button>
              <button
                onClick={submitSpy}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl shadow-soft font-semibold"
              >
                כניסה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
