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
    `px-3 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="font-bold text-lg mr-4">🚗 Family Shotgun</div>
          <nav className="flex gap-1 flex-1 flex-wrap">
            <NavLink to="/" end className={link}>Calendar</NavLink>
            <NavLink to="/approvals" className={link}>Approvals</NavLink>
            <NavLink to="/cars" className={link}>Cars</NavLink>
            <NavLink to="/members" className={link}>Members</NavLink>
          </nav>
          <div className="text-sm">
            <span className="text-slate-500">you are </span>
            <b>{me.name}</b>{' '}
            <button
              onClick={() => { setMemberId(null); setMid(null); }}
              className="text-blue-600 underline ml-1"
            >switch</button>
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
