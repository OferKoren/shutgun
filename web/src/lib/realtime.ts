import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BASE } from './api';

type RealtimeEvent =
  | { type: 'booking.created'; bookingId: string; carId: string }
  | { type: 'booking.approved'; bookingId: string; carId: string }
  | { type: 'booking.declined'; bookingId: string; carId: string }
  | { type: 'booking.cancelled'; bookingId: string; carId: string }
  | { type: 'car.changed'; carId?: string }
  | { type: 'spy.message'; messageId: string; senderId: string }
  | { type: 'setting.changed'; key: string; value: string };

export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const es = new EventSource(`${BASE}/events`);

    es.onmessage = (e) => {
      let event: RealtimeEvent;
      try { event = JSON.parse(e.data); }
      catch { return; }

      if (event.type.startsWith('booking.')) {
        qc.invalidateQueries({ queryKey: ['calendar'] });
        qc.invalidateQueries({ queryKey: ['pending-approvals'] });
        qc.invalidateQueries({ queryKey: ['bookings'] });
        qc.invalidateQueries({ queryKey: ['my-updates'] });
        qc.invalidateQueries({ queryKey: ['my-owner-approved'] });
        qc.invalidateQueries({ queryKey: ['my-approved-rides'] });
      } else if (event.type === 'car.changed') {
        qc.invalidateQueries({ queryKey: ['cars'] });
      } else if (event.type === 'spy.message') {
        qc.invalidateQueries({ queryKey: ['spy-messages'] });
      } else if (event.type === 'setting.changed') {
        qc.invalidateQueries({ queryKey: ['setting', event.key] });
      }
    };

    return () => es.close();
  }, [qc]);
}
