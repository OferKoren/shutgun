import { EventEmitter } from 'node:events';

export type RealtimeEvent =
  | { type: 'booking.created'; bookingId: string; carId: string }
  | { type: 'booking.approved'; bookingId: string; carId: string }
  | { type: 'booking.declined'; bookingId: string; carId: string }
  | { type: 'booking.cancelled'; bookingId: string; carId: string }
  | { type: 'car.changed'; carId?: string }
  | { type: 'spy.message'; messageId: string; senderId: string }
  | { type: 'setting.changed'; key: string; value: string };

const bus = new EventEmitter();
bus.setMaxListeners(0);

const CHANNEL = 'realtime';

export function publish(event: RealtimeEvent) {
  bus.emit(CHANNEL, event);
}

export function subscribe(handler: (event: RealtimeEvent) => void): () => void {
  bus.on(CHANNEL, handler);
  return () => bus.off(CHANNEL, handler);
}
