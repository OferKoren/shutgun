import { useEffect } from 'react';

type Variant = 'primary' | 'danger';

export default function ConfirmModal({
  open,
  icon = '⚠️',
  title,
  body,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  variant = 'primary',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  icon?: string;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-primary text-white hover:bg-primary-500';

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface rounded-3xl shadow-soft max-w-sm w-full border border-hairline overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-6 text-center space-y-3">
          <div className="text-5xl">{icon}</div>
          <h2 className="text-xl font-display font-bold text-primary">{title}</h2>
          <p className="text-ink/70 leading-relaxed whitespace-pre-line">{body}</p>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-hairline font-semibold text-ink/70"
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold shadow-soft ${confirmClasses}`}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
