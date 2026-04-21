import { useEffect, useState } from 'react';
import Spinner from './Spinner';

export default function ConnectingScreen({
  error,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const slow = elapsed >= 3;
  const verySlow = elapsed >= 15;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-cream text-ink/70 px-6 text-center">
      <Spinner size="lg" className="text-primary" />
      <div className="font-display font-semibold text-lg text-primary">
        {slow ? 'מעיר את השרת…' : 'מתחבר לשרת…'}
      </div>
      {slow && (
        <div className="text-sm text-ink/60 max-w-xs leading-relaxed">
          השרת נרדם כשאין שימוש. ההתעוררות לוקחת עד דקה בפעם הראשונה.
        </div>
      )}
      {verySlow && (
        <div className="text-xs text-ink/50">
          עדיין עובדים על זה… ({elapsed} שניות)
        </div>
      )}
      {error && onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-soft"
        >
          נסו שוב
        </button>
      )}
    </div>
  );
}
