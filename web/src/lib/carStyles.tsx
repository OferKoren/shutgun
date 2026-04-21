import type { SVGProps } from 'react';

export type CarColor = { key: string; hex: string; label: string };

export const CAR_COLORS: CarColor[] = [
  { key: 'red', hex: '#ef4444', label: 'אדום' },
  { key: 'orange', hex: '#f97316', label: 'כתום' },
  { key: 'amber', hex: '#f59e0b', label: 'צהוב' },
  { key: 'green', hex: '#22c55e', label: 'ירוק' },
  { key: 'teal', hex: '#14b8a6', label: 'טורקיז' },
  { key: 'blue', hex: '#3b82f6', label: 'כחול' },
  { key: 'indigo', hex: '#6366f1', label: 'סגול־כחול' },
  { key: 'purple', hex: '#a855f7', label: 'סגול' },
  { key: 'pink', hex: '#ec4899', label: 'ורוד' },
  { key: 'slate', hex: '#475569', label: 'אפור' },
];

export const DEFAULT_COLOR = CAR_COLORS[5].hex;
export const DEFAULT_ICON = 'sedan';

type IconProps = SVGProps<SVGSVGElement> & { color?: string };

const baseProps = (color: string) => ({
  viewBox: '0 0 64 40',
  fill: color,
  stroke: '#1e293b',
  strokeWidth: 1.8,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const Wheels = ({ cx1 = 16, cx2 = 48, cy = 32, r = 5 }) => (
  <>
    <circle cx={cx1} cy={cy} r={r + 1.5} fill="#1e293b" stroke="none" />
    <circle cx={cx2} cy={cy} r={r + 1.5} fill="#1e293b" stroke="none" />
    <circle cx={cx1} cy={cy} r={r - 1.5} fill="#e2e8f0" stroke="none" />
    <circle cx={cx2} cy={cy} r={r - 1.5} fill="#e2e8f0" stroke="none" />
  </>
);

const Sport = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L10 22 Q20 14 32 14 L44 14 Q54 14 60 22 L60 30 Z" />
    <path d="M18 22 L26 17 L40 17 L46 22 Z" fill="#cbd5e1" stroke="#1e293b" />
    <Wheels r={5} />
  </svg>
);

const Family = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M6 30 L6 18 Q6 10 14 10 L50 10 Q58 10 58 18 L58 30 Z" />
    <rect x="12" y="14" width="16" height="10" fill="#cbd5e1" stroke="#1e293b" rx="1" />
    <rect x="32" y="14" width="18" height="10" fill="#cbd5e1" stroke="#1e293b" rx="1" />
    <Wheels r={5} />
  </svg>
);

const Sedan = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L4 24 L14 20 Q22 14 32 14 L42 14 Q52 14 58 22 L60 24 L60 30 Z" />
    <path d="M18 20 L26 16 L40 16 L48 20 Z" fill="#cbd5e1" stroke="#1e293b" />
    <Wheels r={5} />
  </svg>
);

const Suv = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L4 20 Q4 10 14 10 L50 10 Q60 10 60 20 L60 30 Z" />
    <rect x="12" y="14" width="18" height="10" fill="#cbd5e1" stroke="#1e293b" rx="1" />
    <rect x="34" y="14" width="18" height="10" fill="#cbd5e1" stroke="#1e293b" rx="1" />
    <Wheels r={6} />
  </svg>
);

const Hatchback = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M6 30 L6 22 Q10 12 22 12 L44 12 Q52 12 56 22 L56 30 Z" />
    <path d="M14 22 L22 16 L44 16 L50 22 Z" fill="#cbd5e1" stroke="#1e293b" />
    <Wheels cx1={18} cx2={46} r={5} />
  </svg>
);

const Pickup = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L4 22 L28 22 L28 14 Q28 12 30 12 L42 12 Q44 12 44 14 L44 22 L60 22 L60 30 Z" />
    <rect x="30" y="14" width="12" height="8" fill="#cbd5e1" stroke="#1e293b" />
    <Wheels cx1={14} cx2={50} r={5} />
  </svg>
);

const Convertible = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L4 24 Q8 20 16 20 L48 20 Q56 20 60 24 L60 30 Z" />
    <path d="M18 20 Q22 14 32 14 Q42 14 46 20" fill="none" stroke="#1e293b" />
    <Wheels r={5} />
  </svg>
);

const Jeep = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <rect x="6" y="10" width="52" height="20" rx="2" />
    <rect x="12" y="14" width="16" height="10" fill="#cbd5e1" stroke="#1e293b" />
    <rect x="32" y="14" width="16" height="10" fill="#cbd5e1" stroke="#1e293b" />
    <circle cx="54" cy="14" r="3" fill="#1e293b" stroke="none" />
    <Wheels r={6} />
  </svg>
);

const Electric = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 L4 22 Q8 14 18 14 L46 14 Q56 14 60 22 L60 30 Z" />
    <path d="M16 22 L24 17 L42 17 L48 22 Z" fill="#cbd5e1" stroke="#1e293b" />
    <path d="M34 4 L28 16 L33 16 L30 26 L38 14 L33 14 Z" fill="#fde047" stroke="#1e293b" strokeWidth={1.2} />
    <Wheels r={5} />
  </svg>
);

const Classic = ({ color = DEFAULT_COLOR, ...p }: IconProps) => (
  <svg {...baseProps(color)} {...p}>
    <path d="M4 30 Q4 24 10 24 L12 24 Q14 14 24 14 L42 14 Q50 14 52 24 L56 24 Q60 24 60 30 Z" />
    <path d="M18 24 L22 17 L40 17 L44 24 Z" fill="#cbd5e1" stroke="#1e293b" />
    <Wheels cx1={16} cx2={48} r={5} />
  </svg>
);

export const CAR_ICONS: { key: string; label: string; Cmp: (p: IconProps) => JSX.Element }[] = [
  { key: 'sport', label: 'ספורט', Cmp: Sport },
  { key: 'family', label: 'משפחתי', Cmp: Family },
  { key: 'sedan', label: 'סדאן', Cmp: Sedan },
  { key: 'suv', label: 'ג׳יפון', Cmp: Suv },
  { key: 'hatchback', label: 'האצ׳בק', Cmp: Hatchback },
  { key: 'pickup', label: 'טנדר', Cmp: Pickup },
  { key: 'convertible', label: 'קבריולט', Cmp: Convertible },
  { key: 'jeep', label: 'שטח', Cmp: Jeep },
  { key: 'electric', label: 'חשמלי', Cmp: Electric },
  { key: 'classic', label: 'קלאסי', Cmp: Classic },
];

export function CarIcon({
  icon,
  color,
  className,
}: { icon?: string | null; color?: string | null; className?: string }) {
  const entry = CAR_ICONS.find((i) => i.key === icon) ?? CAR_ICONS.find((i) => i.key === DEFAULT_ICON)!;
  const { Cmp } = entry;
  return <Cmp color={color ?? DEFAULT_COLOR} className={className} />;
}
