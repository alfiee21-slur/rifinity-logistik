import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

/**
 * Reusable utility to automatically log staff activities in WMS.
 * It extracts the authenticated user session from Next.js cookies automatically.
 */
export async function createAuditLog(action: string, details: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      console.warn('createAuditLog: No session token found in cookies');
      return;
    }
    
    const user = verifySessionToken(token);
    if (!user) {
      console.warn('createAuditLog: Invalid session token');
      return;
    }

    await prisma.auditLog.create({
      data: {
        username: user.username,
        name: user.name,
        role: user.role,
        action,
        details
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
