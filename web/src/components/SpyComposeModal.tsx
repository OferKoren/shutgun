import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SpyMessage } from '../lib/api';
import Spinner from './Spinner';

export function SpyComposeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="spy"
        title="שליחה סודית"
        className="fixed bottom-36 md:bottom-20 left-4 z-50 w-11 h-11 rounded-full bg-ink text-white shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform"
      >
        🕵️
      </button>
      {open && <SpyComposeModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SpyComposeModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('');
  const qc = useQueryClient();

  const send = useMutation({
    mutationFn: (body: string) =>
      api<SpyMessage>('/spy/messages', {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spy-messages'] });
      onClose();
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    const body = value.trim();
    if (!body || send.isPending) return;
    send.mutate(body);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-surface rounded-2xl shadow-soft border border-hairline w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-1">
          <div className="text-4xl">🕵️</div>
          <h3 className="font-display font-semibold text-lg text-ink">הודעה סודית מהמרגל</h3>
          <p className="text-sm text-ink/60">יישלח לכל בני המשפחה</p>
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
          }}
          placeholder="מה יש לך לספר?"
          maxLength={500}
          rows={4}
          className="w-full border border-hairline rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
        />
        {send.isError && (
          <div className="text-sm text-red-600">שגיאה בשליחה</div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-hairline rounded-full text-sm hover:bg-muted"
          >
            ביטול
          </button>
          <button
            onClick={submit}
            disabled={!value.trim() || send.isPending}
            className="px-4 py-1.5 rounded-full text-sm font-semibold shadow-soft bg-primary text-white hover:bg-primary-500 disabled:opacity-50 flex items-center gap-2"
          >
            {send.isPending && <Spinner size="sm" className="text-white" />}
            שליחה
          </button>
        </div>
      </div>
    </div>
  );
}
