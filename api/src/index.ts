import express from 'express';
import cors from 'cors';
import { membersRouter } from './routes/members.js';
import { carsRouter } from './routes/cars.js';
import { bookingsRouter } from './routes/bookings.js';
import { calendarRouter } from './routes/calendar.js';
import { pushRouter } from './routes/push.js';
import { errorHandler } from './middleware/error.js';

const app = express();

const allowedHosts = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((v) => {
    try { return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).host; }
    catch { return v; }
  });

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedHosts.length === 0) return cb(null, true);
    try {
      const host = new URL(origin).host;
      return cb(null, allowedHosts.includes(host));
    } catch {
      return cb(null, false);
    }
  },
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/members', membersRouter);
app.use('/cars', carsRouter);
app.use('/bookings', bookingsRouter);
app.use('/calendar', calendarRouter);
app.use('/push', pushRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`api on :${port}`));
