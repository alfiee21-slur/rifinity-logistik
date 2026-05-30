import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get or create UserSettings
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: { userId: user.id }
      });
    }

    // 2. Get or create SystemSettings
    let systemSettings = await prisma.systemSettings.findUnique({
      where: { id: 'global' }
    });

    if (!systemSettings) {
      systemSettings = await prisma.systemSettings.create({
        data: { id: 'global' }
      });
    }

    return NextResponse.json({
      success: true,
      userSettings,
      systemSettings
    });
  } catch (error: any) {
    console.error('Error fetching settings from database:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userSettings: uSettingsData, systemSettings: sysSettingsData } = body;

    // 1. Update UserSettings
    let updatedUserSettings = null;
    if (uSettingsData) {
      // Exclude relational/auto-gen fields
      const { id, userId, updatedAt, ...cleanUSettings } = uSettingsData;
      
      updatedUserSettings = await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: cleanUSettings,
        create: {
          userId: user.id,
          ...cleanUSettings
        }
      });

      // Tulis Audit Log
      await createAuditLog('USER_PROFILE_UPDATE', 'Memperbarui preferensi profil pengguna (Bahasa, Tema, Tanda Tangan, atau Foto Profil).');
    }

    // 2. Update SystemSettings (Branding & WMS global thresholds) - MANAGER only!
    let updatedSystemSettings = null;
    if (sysSettingsData) {
      if (user.role !== 'MANAGER') {
        console.warn(`User ${user.username} (role: ${user.role}) attempted to update system settings without MANAGER authorization.`);
        // For security, silently skip updating the global system settings but return status success (userSettings is still saved)
      } else {
        const { id, updatedAt, ...cleanSysSettings } = sysSettingsData;
        
        updatedSystemSettings = await prisma.systemSettings.upsert({
          where: { id: 'global' },
          update: cleanSysSettings,
          create: {
            id: 'global',
            ...cleanSysSettings
          }
        });

        // Tulis Audit Log
        await createAuditLog('SYSTEM_BRAND_UPDATE', 'Memperbarui konfigurasi identitas brand kop surat perusahaan atau nilai threshold WMS Global.');
      }
    }

    return NextResponse.json({
      success: true,
      userSettings: updatedUserSettings,
      systemSettings: updatedSystemSettings
    });
  } catch (error: any) {
    console.error('Error saving settings to database:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
