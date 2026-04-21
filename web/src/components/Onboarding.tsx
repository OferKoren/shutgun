import { useState } from 'react';

type Step = { icon: string; title: string; body: string };

const STEPS: Step[] = [
  {
    icon: '👋',
    title: 'ברוכים הבאים ל־Shutgun',
    body: 'האפליקציה המשפחתית לתיאום נסיעות ברכבים. בלי סיסמאות — רק אמון משפחתי.',
  },
  {
    icon: '🚗',
    title: 'רכבים ובעלים',
    body: 'בטאב "רכבים" מוסיפים את הרכבים של המשפחה ומגדירים מי בעלים של כל רכב. הבעלים הם אלה שמאשרים הזמנות.',
  },
  {
    icon: '📅',
    title: 'יומן משותף',
    body: 'הטאב "יומן" מציג את כל ההזמנות של המשפחה לפי חודש. אפשר ללחוץ על יום כדי לראות את הפירוט ולהוסיף הזמנה חדשה.',
  },
  {
    icon: '➕',
    title: 'הזמנת רכב',
    body: 'בוחרים רכב, תאריך ושעות, ומסבירים לאן נוסעים. אם אתם בעלי הרכב — ההזמנה מאושרת אוטומטית. אחרת היא ממתינה לאישור.',
  },
  {
    icon: '✅',
    title: 'אישורים',
    body: 'בטאב "אישורים" בעלי הרכב רואים בקשות ממתינות ומאשרים/דוחים. כשמאשרים — בקשות אחרות שחופפות באותו זמן נדחות אוטומטית.',
  },
  {
    icon: '🎉',
    title: 'זהו, יוצאים לדרך',
    body: 'אפשר להחליף משתמש בכל רגע דרך הכפתור "החלפה" בראש העמוד. נסיעה טובה!',
  },
];

export default function Onboarding({ onDone, userName }: { onDone: () => void; userName: string }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl shadow-soft max-w-md w-full border border-hairline overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="text-xs text-ink/60">{i + 1} / {STEPS.length}</div>
          <button
            onClick={onDone}
            className="text-sm text-ink/60 hover:text-ink underline"
          >דילוג</button>
        </div>

        <div className="px-6 py-6 text-center space-y-3">
          <div className="text-5xl">{step.icon}</div>
          <h2 className="text-2xl font-display font-bold text-primary">{step.title}</h2>
          <p className="text-ink/70 leading-relaxed">{step.body}</p>
          {i === 0 && (
            <p className="text-sm text-ink/60">שמחים לראותכם, <b className="text-ink">{userName}</b>.</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? 'w-6 bg-primary' : 'w-1.5 bg-hairline'
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            className="px-4 py-2 rounded-xl border border-hairline font-semibold text-ink/70 disabled:opacity-40"
          >חזרה</button>
          <button
            onClick={() => (isLast ? onDone() : setI((v) => v + 1))}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-soft hover:bg-primary-500"
          >{isLast ? 'יאללה, מתחילים' : 'הבא'}</button>
        </div>
      </div>
    </div>
  );
}
