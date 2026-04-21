type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export default function Spinner({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <svg
      className={`${sizes[size]} animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="טוען"
    >
      <defs>
        <linearGradient id="spinner-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="url(#spinner-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="42 100"
      />
    </svg>
  );
}

export function LoadingBlock({ label = 'טוען…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-ink/60">
      <Spinner size="md" className="text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
