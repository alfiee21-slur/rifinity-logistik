import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  hashPassword, verifyPassword, createSessionToken, 
  SessionUser, COOKIE_NAME, COOKIE_MAX_AGE 
} from '@/lib/auth';

// Demo accounts for first-time setup
const DEMO_USERS = [
  { username: 'manager', password: 'password123', name: 'Ahmad Wijaya', role: 'MANAGER' },
  { username: 'admin', password: 'password123', name: 'Sari Dewi', role: 'ADMIN' },
  { username: 'operator', password: 'password123', name: 'Budi Santoso', role: 'OPERATOR' },
  { username: 'finance', password: 'password123', name: 'Rina Kusuma', role: 'FINANCE' },
];

async function ensureDemoUsers() {
  const count = await prisma.user.count();
  if (count === 0) {
    await prisma.user.createMany({
      data: DEMO_USERS.map(u => ({
        username: u.username,
        password: hashPassword(u.password),
        name: u.name,
        role: u.role,
      })),
    });
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    // Ensure demo users exist
    await ensureDemoUsers();

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as SessionUser['role'],
    };

    // Write audit log on successful login
    await prisma.auditLog.create({
      data: {
        username: user.username,
        name: user.name,
        role: user.role,
        action: 'AUTH_LOGIN',
        details: 'Berhasil masuk ke dalam sistem WMS dari perangkat client.'
      }
    });

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({ 
      ok: true,
      user: sessionUser 
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
