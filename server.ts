import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  CAMPUS_FACILITIES,
  CAMPUS_SKYBRIDGES,
  computeCampusRoute,
  getCampusTelemetry,
} from './server/campusData.ts';
import {
  authenticateUser,
  createBooking,
  deleteBooking,
  findDemoUser,
  findUserById,
  getUserBookings,
  getUserBookmarks,
  getUserRsvps,
  issueSessionToken,
  registerUser,
  revokeSessionToken,
  toggleBookmark,
  toggleRsvp,
  updateUserRole,
  verifySessionToken,
} from './server/store.ts';
import type { TransportMode, UserRole } from './src/types/campus.ts';

interface AuthenticatedRequest extends Request {
  authUserId?: string;
  authJti?: string;
}

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const verified = verifySessionToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const user = findUserById(verified.userId);
  if (!user) {
    res.status(401).json({ error: 'Account no longer exists.' });
    return;
  }
  req.authUserId = verified.userId;
  req.authJti = verified.jti;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'campusconnect-2036' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, department } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }
  const safeRole: UserRole = role === 'visitor' ? 'visitor' : 'student';
  const result = registerUser({
    name,
    email,
    password,
    role: safeRole,
    department: typeof department === 'string' ? department : '',
  });
  if (result.error || !result.user) {
    res.status(409).json({ error: result.error ?? 'Unable to create account.' });
    return;
  }
  const token = issueSessionToken(result.user.id);
  res.status(201).json({
    token,
    user: result.user,
    bookmarks: getUserBookmarks(result.user.id),
    rsvps: getUserRsvps(result.user.id),
    bookings: getUserBookings(result.user.id),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const user = authenticateUser(email, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  const token = issueSessionToken(user.id);
  res.json({
    token,
    user,
    bookmarks: getUserBookmarks(user.id),
    rsvps: getUserRsvps(user.id),
    bookings: getUserBookings(user.id),
  });
});

app.post('/api/auth/demo', (req, res) => {
  const role: UserRole = req.body?.role === 'visitor' ? 'visitor' : 'student';
  const user = findDemoUser(role);
  const token = issueSessionToken(user.id);
  res.json({
    token,
    user,
    bookmarks: getUserBookmarks(user.id),
    rsvps: getUserRsvps(user.id),
    bookings: getUserBookings(user.id),
  });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.authJti) {
    revokeSessionToken(req.authJti);
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = findUserById(req.authUserId!);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({
    user,
    bookmarks: getUserBookmarks(user.id),
    rsvps: getUserRsvps(user.id),
    bookings: getUserBookings(user.id),
  });
});

app.patch('/api/auth/role', requireAuth, (req: AuthenticatedRequest, res) => {
  const role: UserRole = req.body?.role === 'visitor' ? 'visitor' : 'student';
  const updated = updateUserRole(req.authUserId!, role);
  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: updated });
});

app.get('/api/facilities', (_req, res) => {
  res.json({ facilities: CAMPUS_FACILITIES, skybridges: CAMPUS_SKYBRIDGES });
});

app.get('/api/telemetry', (_req, res) => {
  res.json(getCampusTelemetry());
});

app.get('/api/live/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const pushUpdate = () => {
    res.write(`data: ${JSON.stringify(getCampusTelemetry())}\n\n`);
  };
  pushUpdate();
  const timer = setInterval(pushUpdate, 3000);
  req.on('close', () => {
    clearInterval(timer);
  });
});

app.get('/api/route', (req, res) => {
  const origin = String(req.query.origin ?? 'central-plaza');
  const destination = String(req.query.destination ?? 'quantum-biodome');
  const rawMode = String(req.query.mode ?? 'walking');
  const mode: TransportMode =
    rawMode === 'skybridge' || rawMode === 'shuttle' ? rawMode : 'walking';
  const route = computeCampusRoute(origin, destination, mode);
  if (!route) {
    res.status(404).json({ error: 'Could not compute route between selected buildings.' });
    return;
  }
  res.json({ route });
});

app.post('/api/bookmarks/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const facilityId = String(req.body?.facilityId ?? '');
  if (!CAMPUS_FACILITIES.some((f) => f.id === facilityId)) {
    res.status(400).json({ error: 'Unknown facility.' });
    return;
  }
  const bookmarks = toggleBookmark(req.authUserId!, facilityId);
  res.json({ bookmarks });
});

app.post('/api/rsvps/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const eventId = String(req.body?.eventId ?? '');
  const validEvent = CAMPUS_FACILITIES.some((f) => f.events.some((e) => e.id === eventId));
  if (!validEvent) {
    res.status(400).json({ error: 'Unknown campus event.' });
    return;
  }
  const rsvps = toggleRsvp(req.authUserId!, eventId);
  res.json({ rsvps });
});

app.get('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ bookings: getUserBookings(req.authUserId!) });
});

app.post('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = findUserById(req.authUserId!);
  if (!user) {
    res.status(401).json({ error: 'User not found.' });
    return;
  }
  const facilityId = String(req.body?.facilityId ?? '');
  const roomId = String(req.body?.roomId ?? '');
  const slot = String(req.body?.slot ?? 'Next 60 min').trim().slice(0, 60);
  const purpose = String(req.body?.purpose ?? 'Study & Research').trim().slice(0, 100);

  const facility = CAMPUS_FACILITIES.find((f) => f.id === facilityId);
  const room = facility?.rooms.find((r) => r.id === roomId);
  if (!facility || !room) {
    res.status(404).json({ error: 'Selected room could not be found.' });
    return;
  }
  if (!room.available) {
    res.status(409).json({ error: 'That room is currently occupied.' });
    return;
  }
  if (room.studentOnly && user.role === 'visitor') {
    res.status(403).json({
      error: 'Student credentials are required to reserve laboratory or research rooms.',
    });
    return;
  }

  const booking = createBooking({
    userId: user.id,
    facilityId: facility.id,
    facilityName: facility.name,
    roomId: room.id,
    roomName: room.name,
    slot: slot || 'Next 60 min',
    purpose: purpose || 'Campus Study Session',
  });
  res.status(201).json({ booking, bookings: getUserBookings(user.id) });
});

app.delete('/api/bookings/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const removed = deleteBooking(req.authUserId!, String(req.params.id));
  if (!removed) {
    res.status(404).json({ error: 'Reservation not found.' });
    return;
  }
  res.json({ bookings: getUserBookings(req.authUserId!) });
});

app.post('/api/ai/ask', requireAuth, async (req: AuthenticatedRequest, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const selectedFacilityId =
    typeof req.body?.selectedFacilityId === 'string' ? req.body.selectedFacilityId : 'quantum-biodome';
  if (!question) {
    res.status(400).json({ error: 'Please enter a question for Campus AI.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini API key is not configured in server secrets (Settings > Secrets).',
    });
    return;
  }

  const user = findUserById(req.authUserId!);
  const telemetry = getCampusTelemetry();
  const contextSummary = CAMPUS_FACILITIES.map((f) => ({
    id: f.id,
    name: f.name,
    sector: f.sector,
    quad: f.quad,
    status: f.status,
    hours: f.hours,
    occupancyPercent: f.occupancyPercent,
    airQualityPercent: f.airQualityPercent,
    visitorAccess: f.visitorAccess,
    walkMinutesFromPlaza: f.walkMinutesFromPlaza,
    availableRooms: f.rooms.filter((r) => r.available).map((r) => ({
      name: r.name,
      capacity: r.capacity,
      studentOnly: r.studentOnly,
      equipment: r.equipment,
    })),
    events: f.events,
  }));

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `User (${user?.name ?? 'Member'}, mode: ${user?.role ?? 'student'}, currently inspecting: ${selectedFacilityId}) asks: "${question}"\n\nCampus Telemetry: ${JSON.stringify(telemetry)}\nCampus Facilities Data: ${JSON.stringify(contextSummary)}`,
      config: {
        systemInstruction:
          'You are Campus AI, the Hokage School wayfinding and operations assistant. Answer concisely in 2-4 crisp sentences grounded strictly in the provided Campus Facilities Data and Telemetry. Mention exact building names, skybridges, shuttle loops, room names, occupancy numbers, or walking times when relevant. Also return an array of matching facility IDs so the user can jump straight to them on the map.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Helpful, concise response grounded in campus data.',
            },
            recommendedFacilityIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Relevant facility IDs from the provided dataset (max 3).',
            },
          },
          required: ['answer', 'recommendedFacilityIds'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      answer?: string;
      recommendedFacilityIds?: string[];
    };
    const validIds = (parsed.recommendedFacilityIds ?? []).filter((id) =>
      CAMPUS_FACILITIES.some((f) => f.id === id)
    );
    res.json({
      answer: parsed.answer || 'I could not synthesize an answer from the campus directory.',
      recommendedFacilityIds: validIds.slice(0, 3),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach Campus AI.';
    res.status(502).json({ error: `Campus AI error: ${message}` });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusConnect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
