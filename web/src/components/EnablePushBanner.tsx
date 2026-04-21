import { useEffect, useState } from 'react';
import {
  getExistingSubscription,
  isIOS,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push';

export default function EnablePushBanner() {
  const [supported] = useState(() => isPushSupported());
  const [standalone] = useState(() => isStandalone());
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pushBannerDismissed') === '1');

  useEffect(() => {
    if (!supported) { setSubscribed(false); return; }
    getExistingSubscription().then((s) => setSubscribed(!!s)).catch(() => setSubscribed(false));
  }, [supported]);

  if (subscribed === null) return null;
  if (subscribed) return null;
  if (dismissed) return null;
  if (!supported) return null;

  const iosNeedsInstall = isIOS() && !standalone;

  const handleEnable = async () => {
    setBusy(true); setErr(null);
    try {
      await subscribeToPush();
      setSubscribed(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem('pushBannerDismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 p-4 bg-primary-50 border border-primary/20 rounded-2xl text-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔔</span>
        <div className="flex-1">
          <div className="font-semibold mb-1">רוצים לקבל התראות?</div>
          {iosNeedsInstall ? (
            <p className="text-ink/70 leading-relaxed">
              באייפון: הקישו על כפתור השיתוף <b>⬆︎</b> בסאפארי → <b>הוספה למסך הבית</b>,
              פתחו את האפליקציה ממסך הבית ואז חזרו לכאן להפעיל התראות.
            </p>
          ) : (
            <p className="text-ink/70">תקבלו התראה כשמישהו מבקש רכב שלכם או כשהבקשה שלכם תאושר/תידחה.</p>
          )}
          {err && <p className="text-red-700 mt-2">{err}</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={dismiss} className="px-3 py-1.5 text-ink/60 hover:text-ink text-sm">לא עכשיו</button>
        {!iosNeedsInstall && (
          <button
            onClick={handleEnable}
            disabled={busy}
            className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'מפעיל…' : 'הפעל התראות'}
          </button>
        )}
      </div>
    </div>
  );
}

export function PushToggleButton() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) { setSubscribed(false); return; }
    getExistingSubscription().then((s) => setSubscribed(!!s)).catch(() => setSubscribed(false));
  }, []);

  if (!isPushSupported() || subscribed === null) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (subscribed) { await unsubscribeFromPush(); setSubscribed(false); }
      else { await subscribeToPush(); setSubscribed(true); }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="text-sm text-primary underline disabled:opacity-50"
    >
      {subscribed ? 'בטל התראות' : 'הפעל התראות'}
    </button>
  );
}
