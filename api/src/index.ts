import express from 'express';
import cors from 'cors';
import { membersRouter } from './routes/members.js';
import { carsRouter } from './routes/cars.js';
import { bookingsRouter } from './routes/bookings.js';
import { calendarRouter } from './routes/calendar.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/members', membersRouter);
app.use('/cars', carsRouter);
app.use('/bookings', bookingsRouter);
app.use('/calendar', calendarRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`api on :${port}`));
