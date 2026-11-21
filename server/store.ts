import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CampusUser, RoomBooking, UserRole } from '../src/types/campus.ts';

interface StoredUser extends CampusUser {
  passwordHash?: string;
}

interface StoreState {
  users: StoredUser[];
  bookmarks: Record<string, string[]>;
  rsvps: Record<string, string[]>;
  bookings: RoomBooking[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'campus_store.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const revokedTokens = new Set<string>();

export const STUDENT_AVATAR = '/src/assets/images/avatar_kaelen_voss_1795251141423.jpg';
export const VISITOR_AVATAR = '/src/assets/images/avatar_visitor_elena_1795251141371.jpg';

const INITIAL_STATE: StoreState = {
  users: [
    {
      id: 'demo-student-kaelen',
      name: 'Kaelen Voss',
      email: 'kaelen.voss@hokageschool.edu',
      department: 'Bio-Informatics IV',
      role: 'student',
      avatarUrl: STUDENT_AVATAR,
      isDemo: true,
    },
    {
      id: 'demo-visitor-elena',
      name: 'Dr. Elena Park',
      email: 'elena.park@guest.hokageschool.edu',
      department: 'Visiting Fellow · Spatial Systems',
      role: 'visitor',
      avatarUrl: VISITOR_AVATAR,
      isDemo: true,
    },
  ],
  bookmarks: {
    'demo-student-kaelen': ['quantum-biodome', 'aegis-library'],
    'demo-visitor-elena': ['central-plaza', 'quantum-biodome'],
  },
  rsvps: {
    'demo-student-kaelen': ['ev-quantum-2040'],
    'demo-visitor-elena': ['ev-campus-orientation'],
  },
  bookings: [
    {
      id: 'bk-initial-1',
      userId: 'demo-student-kaelen',
      facilityId: 'aegis-library',
      facilityName: 'Aegis Digital Library',
      roomId: 'lib-pod-412',
      roomName: 'Silent Synthesis Pod 412',
      slot: '15:00 – 16:00',
      purpose: 'Bio-Informatics Capstone Review',
      createdAt: '2026-11-21T08:15:00.000Z',
    },
  ],
};

function ensureStoreFile(): StoreState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_STATE, null, 2), 'utf8');
    return structuredClone(INITIAL_STATE);
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreState;
    if (!Array.isArray(parsed.users)) {
      throw new Error('Invalid store schema');
    }
    let migrated = false;
    for (const u of parsed.users) {
      if (u.email.endsWith('@neoseoul.edu')) {
        u.email = u.email.replace('@neoseoul.edu', '@hokageschool.edu');
        migrated = true;
      } else if (u.email.endsWith('@guest.neoseoul.edu')) {
        u.email = u.email.replace('@guest.neoseoul.edu', '@guest.hokageschool.edu');
        migrated = true;
      }
    }
    if (migrated) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_STATE, null, 2), 'utf8');
    return structuredClone(INITIAL_STATE);
  }
}

let store: StoreState = ensureStoreFile();

function persistStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

interface TokenPayload {
  sub: string;
  jti: string;
  exp: number;
}

export function issueSessionToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    jti: crypto.randomUUID(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): { userId: string; jti: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || !payload.jti || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    if (revokedTokens.has(payload.jti)) return null;
    return { userId: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}

export function revokeSessionToken(jti: string) {
  revokedTokens.add(jti);
}

export function sanitizeUser(user: StoredUser): CampusUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isDemo: user.isDemo,
  };
}

export function findUserById(userId: string): CampusUser | null {
  const user = store.users.find((u) => u.id === userId);
  return user ? sanitizeUser(user) : null;
}

export function findDemoUser(role: UserRole): CampusUser {
  const id = role === 'student' ? 'demo-student-kaelen' : 'demo-visitor-elena';
  const found = store.users.find((u) => u.id === id) ?? store.users[0];
  return sanitizeUser(found);
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
}): { user?: CampusUser; error?: string } {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { error: 'An account with this email already exists.' };
  }
  const newUser: StoredUser = {
    id: `usr-${crypto.randomUUID()}`,
    name: input.name.trim(),
    email: normalizedEmail,
    department:
      input.department.trim() ||
      (input.role === 'student' ? 'Bio-Informatics' : 'Campus Visitor Pass'),
    role: input.role,
    avatarUrl: input.role === 'student' ? STUDENT_AVATAR : VISITOR_AVATAR,
    passwordHash: hashPassword(input.password),
  };
  store.users.push(newUser);
  store.bookmarks[newUser.id] = ['quantum-biodome'];
  store.rsvps[newUser.id] = [];
  persistStore();
  return { user: sanitizeUser(newUser) };
}

export function authenticateUser(email: string, password: string): CampusUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !user.passwordHash) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return sanitizeUser(user);
}

export function updateUserRole(userId: string, role: UserRole): CampusUser | null {
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  user.role = role;
  persistStore();
  return sanitizeUser(user);
}

export function getUserBookmarks(userId: string): string[] {
  return store.bookmarks[userId] ?? [];
}

export function toggleBookmark(userId: string, facilityId: string): string[] {
  const current = new Set(store.bookmarks[userId] ?? []);
  if (current.has(facilityId)) {
    current.delete(facilityId);
  } else {
    current.add(facilityId);
  }
  const updated = Array.from(current);
  store.bookmarks[userId] = updated;
  persistStore();
  return updated;
}

export function getUserRsvps(userId: string): string[] {
  return store.rsvps[userId] ?? [];
}

export function toggleRsvp(userId: string, eventId: string): string[] {
  const current = new Set(store.rsvps[userId] ?? []);
  if (current.has(eventId)) {
    current.delete(eventId);
  } else {
    current.add(eventId);
  }
  const updated = Array.from(current);
  store.rsvps[userId] = updated;
  persistStore();
  return updated;
}

export function getUserBookings(userId: string): RoomBooking[] {
  return store.bookings.filter((b) => b.userId === userId);
}

export function createBooking(booking: Omit<RoomBooking, 'id' | 'createdAt'>): RoomBooking {
  const created: RoomBooking = {
    ...booking,
    id: `bk-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  store.bookings.unshift(created);
  persistStore();
  return created;
}

export function deleteBooking(userId: string, bookingId: string): boolean {
  const idx = store.bookings.findIndex((b) => b.id === bookingId && b.userId === userId);
  if (idx === -1) return false;
  store.bookings.splice(idx, 1);
  persistStore();
  return true;
}
