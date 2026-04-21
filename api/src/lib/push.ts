import webpush from 'web-push';
import { prisma } from '../db.js';

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

let configured = false;
if (PUBLIC && PRIVATE) {
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  configured = true;
} else {
  console.warn('[push] VAPID keys missing — push disabled');
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

export async function sendPushToMember(memberId: string, payload: PushPayload) {
  if (!configured) return;
  const subs = await prisma.pushSubscription.findMany({ where: { memberId } });
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (err: any) {
      const code = err?.statusCode;
      if (code === 404 || code === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      } else {
        console.error('[push] send failed', code, err?.body);
      }
    }
  }));
}

export async function sendPushToMembers(memberIds: string[], payload: PushPayload) {
  await Promise.all(memberIds.map((id) => sendPushToMember(id, payload)));
}
