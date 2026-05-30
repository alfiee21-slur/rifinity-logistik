import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'rifinity-logistik-super-secret-key-2024';
const COOKIE_NAME = 'rifinity_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type UserRole = 'MANAGER' | 'ADMIN' | 'OPERATOR' | 'FINANCE';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

// Password hashing using built-in Node.js crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const inputHash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
}

// Simple signed token: base64(payload).HMAC_SHA256(base64(payload) + secret)
export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser;
  } catch {
    return null;
  }
}

export function getCookieSettings(maxAge = COOKIE_MAX_AGE): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };

// Role-based access configuration
export const ROLE_LABELS: Record<UserRole, string> = {
  MANAGER: 'Warehouse Manager',
  ADMIN: 'Warehouse Admin',
  OPERATOR: 'Warehouse Operator',
  FINANCE: 'Finance Officer',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  MANAGER: '#f59e0b',  // amber
  ADMIN: '#6366f1',    // indigo
  OPERATOR: '#10b981', // emerald
  FINANCE: '#ec4899',  // pink
};

// Which routes each role CAN access (undefined means ALL routes allowed)
export const ROLE_ALLOWED_ROUTES: Record<UserRole, string[] | undefined> = {
  MANAGER: undefined, // full access
  ADMIN: ['/', '/inbound', '/inbound-history', '/packaging', '/outbound-history', '/inventory', '/docs', '/settings'],
  OPERATOR: ['/', '/inbound', '/packaging', '/inventory', '/settings'],
  FINANCE: ['/', '/inbound-history', '/outbound-history', '/docs', '/reports', '/settings'],
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_ROUTES[role];
  if (!allowed) return true; // MANAGER: full access
  return allowed.some(r => pathname === r || pathname.startsWith(r + '/'));
}
