const BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getMemberId(): string | null {
  return localStorage.getItem('memberId');
}
export function setMemberId(id: string | null) {
  if (id) localStorage.setItem('memberId', id);
  else localStorage.removeItem('memberId');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  const mid = getMemberId();
  if (mid) headers['X-Member-Id'] = mid;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Member = { id: string; name: string; createdAt: string };
export type Car = {
  id: string; name: string; plate?: string | null; color?: string | null; icon?: string | null; notes?: string | null;
  owners: Member[];
};
export type BookingStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
export type Booking = {
  id: string; carId: string; driverId: string;
  startAt: string; endAt: string; allDay: boolean;
  purpose?: string | null; status: BookingStatus;
  decidedBy?: string | null; decidedAt?: string | null; declineReason?: string | null;
  createdAt: string;
  driver?: Member; car?: Car;
};
export type ApprovalRow = Booking & {
  conflicts: { id: string; driverId: string; startAt: string; endAt: string }[];
};
