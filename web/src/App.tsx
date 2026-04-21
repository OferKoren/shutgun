import { NavLink, Route, Routes } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, BASE, getMemberId, setMemberId, type Member } from './lib/api';
import IdentityPicker from './components/IdentityPicker';
import Onboarding from './components/Onboarding';
import CalendarPage from './pages/Calendar';
import ApprovalsPage from './pages/Approvals';
import NewBookingPage from './pages/NewBooking';
import CarsPage from './pages/Cars';
import MembersPage from './pages/Members';
import EnablePushBanner from './components/EnablePushBanner';
import NotificationsButton from './components/NotificationsButton';
import ConnectingScreen from './components/ConnectingScreen';
import { useRealtime } from './lib/realtime';

function warmup() {
  fetch(`${BASE}/health`, { cache: 'no-store', keepalive: true }).catch(() => {});
}

export default function App() {
  useRealtime();
  const qc = useQueryClient();
  const [memberId, setMid] = useState<string | null>(getMemberId());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => localStorage.getItem('shotgun:onboarding') === '1');

  const {
    data: members = [],
    isLoading: membersLoading,
    isSuccess: membersLoaded,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['members'],
    queryFn: () => api<Member[]>('/members'),
  });

  const me = members.find((m) => m.id === memberId);

  useEffect(() => {
    if (memberId && membersLoaded && members.length && !me) {
      setMemberId(null);
      setMid(null);
    }
  }, [members, memberId, me, membersLoaded]);

  useEffect(() => {
    warmup();
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      warmup();
      qc.invalidateQueries();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [qc]);

  if ((membersLoading && !members.length) || (memberId && !membersLoaded)) {
    return <ConnectingScreen error={membersError} onRetry={() => refetchMembers()} />;
  }

  if (!memberId || !me) {
    return <IdentityPicker members={members} onPicked={(id) => {
      setMemberId(id);
      setMid(id);
      if (localStorage.getItem('shotgun:onboarding') === '1') setShowOnboarding(true);
    }} />;
  }

  const topLink = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary text-white shadow-soft'
        : 'text-ink/70 hover:bg-primary-50 hover:text-primary'
    }`;

  const tabLink = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] text-xs font-semibold transition-colors ${
      isActive ? 'text-primary' : 'text-ink/60'
    }`;

  const tabs = [
    { to: '/', end: true, label: 'יומן', icon: '📅' },
    { to: '/approvals', end: false, label: 'אישורים', icon: '✅' },
    { to: '/cars', end: false, label: 'רכבים', icon: '🚗' },
    { to: '/members', end: false, label: 'משפחה', icon: '👨‍👩‍👧' },
  ];

  return (
    <div className="min-h-dvh bg-cream pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <header className="bg-surface/80 backdrop-blur border-b border-hairline sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div dir="ltr" className="font-display font-bold text-xl ml-2 text-primary">🚗 Shutgun</div>
          <nav className="hidden md:flex gap-1 flex-1 flex-wrap">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={topLink}>{t.label}</NavLink>
            ))}
          </nav>
          <div className="text-sm mr-auto md:mr-0 flex items-center gap-2">
            <NotificationsButton meId={me.id} />
            <span className="hidden sm:inline text-ink/60">מחוברים כ־</span>
            <b className="text-ink">{me.name}</b>
            <button
              onClick={() => { setMemberId(null); setMid(null); }}
              className="text-primary underline hover:text-primary-500"
            >החלפה</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 md:py-6">
        <EnablePushBanner />
        <Routes>
          <Route path="/" element={<CalendarPage meId={me.id} me={me} />} />
          <Route path="/approvals" element={<ApprovalsPage meId={me.id} members={members} />} />
          <Route path="/new-booking" element={<NewBookingPage meId={me.id} />} />
          <Route path="/cars" element={<CarsPage members={members} />} />
          <Route path="/members" element={<MembersPage meId={me.id} />} />
        </Routes>
      </main>

      {showOnboarding && (
        <Onboarding
          userName={me.name}
          onDone={() => {
            localStorage.removeItem('shotgun:onboarding');
            setShowOnboarding(false);
          }}
        />
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-hairline pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-5xl mx-auto flex">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={tabLink}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
