import { NavLink, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, getMemberId, setMemberId, type Member } from './lib/api';
import IdentityPicker from './components/IdentityPicker';
import CalendarPage from './pages/Calendar';
import ApprovalsPage from './pages/Approvals';
import NewBookingPage from './pages/NewBooking';
import CarsPage from './pages/Cars';
import MembersPage from './pages/Members';

export default function App() {
  const [memberId, setMid] = useState<string | null>(getMemberId());

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api<Member[]>('/members'),
  });

  const me = members.find((m) => m.id === memberId);

  useEffect(() => {
    if (memberId && members.length && !me) {
      setMemberId(null);
      setMid(null);
    }
  }, [members, memberId, me]);

  if (!memberId || !me) {
    return <IdentityPicker members={members} onPicked={(id) => { setMemberId(id); setMid(id); }} />;
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary text-white shadow-soft'
        : 'text-ink/70 hover:bg-primary-50 hover:text-primary'
    }`;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-surface/80 backdrop-blur border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div dir="ltr" className="font-display font-bold text-xl ml-4 text-primary">🚗 Shutgun</div>
          <nav className="flex gap-1 flex-1 flex-wrap">
            <NavLink to="/" end className={link}>יומן</NavLink>
            <NavLink to="/approvals" className={link}>אישורים</NavLink>
            <NavLink to="/cars" className={link}>רכבים</NavLink>
            <NavLink to="/members" className={link}>משפחה</NavLink>
          </nav>
          <div className="text-sm">
            <span className="text-ink/60">מחוברים כ־</span>
            <b className="text-ink">{me.name}</b>{' '}
            <button
              onClick={() => { setMemberId(null); setMid(null); }}
              className="text-primary underline mr-1 hover:text-primary-500"
            >החלפה</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<CalendarPage meId={me.id} />} />
          <Route path="/approvals" element={<ApprovalsPage meId={me.id} members={members} />} />
          <Route path="/new-booking" element={<NewBookingPage meId={me.id} />} />
          <Route path="/cars" element={<CarsPage members={members} />} />
          <Route path="/members" element={<MembersPage />} />
        </Routes>
      </main>
    </div>
  );
}
