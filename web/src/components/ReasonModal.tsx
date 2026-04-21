import { useEffect, useState } from 'react';

type Tone = 'danger' | 'primary';

export type ReasonModalProps = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
};

export default function ReasonModal({
  open,
  title,
  description,
  placeholder = 'סיבה (אפשר לדלג)',
  confirmLabel,
  cancelLabel = 'ביטול',
  tone = 'danger',
  onConfirm,
  onCancel,
}: ReasonModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-primary text-white hover:bg-primary-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        dir="rtl"
        className="bg-surface rounded-2xl shadow-soft border border-hairline w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
          {description && <p className="text-sm text-ink/60 mt-1">{description}</p>}
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={200}
          rows={3}
          className="w-full border border-hairline rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border border-hairline rounded-full text-sm hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(value.trim() || undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-soft ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
