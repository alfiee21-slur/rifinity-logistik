'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { canAccessRoute, SessionUser, UserRole } from '@/lib/auth'

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, logout: async () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_ROUTES = ['/login', '/access-denied'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user || null)
        setLoading(false)
        if (data.user) {
          syncSettingsToLocalStorage(data.user.username);
        }
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [pathname])

  useEffect(() => {
    if (loading) return

    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!user && !isPublic) {
      router.push('/login')
      return
    }

    if (user && pathname === '/login') {
      router.push('/')
      return
    }

    if (user && !isPublic) {
      const allowed = canAccessRoute(user.role as UserRole, pathname)
      if (!allowed) {
        router.push('/access-denied')
      }
    }
  }, [user, loading, pathname, router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  // Show nothing while resolving auth on protected routes
  if (loading && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div 
        suppressHydrationWarning={true}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0f1a, #0d1425)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div suppressHydrationWarning={true} style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#475569', fontSize: 14 }}>Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

async function syncSettingsToLocalStorage(username: string) {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    if (data.success) {
      const uSettings = data.userSettings;
      const sysSettings = data.systemSettings;

      if (uSettings) {
        localStorage.setItem('rifinity_theme', uSettings.theme);
        localStorage.setItem('rifinity_language', uSettings.language);
        localStorage.setItem('rifinity_settings_ui_glass_density', uSettings.glassDensity);
        localStorage.setItem('rifinity_settings_ui_glow_effects', uSettings.glowEffects ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ui_sidebar_hover_bounce', uSettings.sidebarHoverBounce ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ui_auto_lock', uSettings.autoLockSession);
        localStorage.setItem('rifinity_settings_ui_system_sounds', uSettings.systemSounds ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ui_debug_mode', uSettings.debugMode ? 'true' : 'false');
        
        if (uSettings.signature) {
          localStorage.setItem(`rifinity_signature_${username}`, uSettings.signature);
        } else {
          localStorage.removeItem(`rifinity_signature_${username}`);
        }
        localStorage.setItem(`rifinity_signature_scale_${username}`, uSettings.sigScale.toString());

        if (uSettings.profilePic) {
          localStorage.setItem(`rifinity_profile_pic_${username}`, uSettings.profilePic);
        } else {
          localStorage.removeItem(`rifinity_profile_pic_${username}`);
        }

        // Alerts configurations
        localStorage.setItem('rifinity_settings_notif_whatsapp', uSettings.notifWhatsapp ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_notif_whatsapp_phone', uSettings.notifWhatsappPhone);
        localStorage.setItem('rifinity_settings_notif_auto_email', uSettings.notifAutoEmail ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_notif_auto_email_address', uSettings.notifAutoEmailAddress);
        localStorage.setItem('rifinity_settings_notif_telegram', uSettings.notifTelegram ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_telegram_bot_token', uSettings.telegramBotToken);
        localStorage.setItem('rifinity_settings_telegram_chat_id', uSettings.telegramChatId);
        
        // AI Logistics preferences
        localStorage.setItem('rifinity_settings_ai_model', uSettings.aiModel);
        localStorage.setItem('rifinity_settings_ai_autosave', uSettings.aiAutosave ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ai_strict', uSettings.aiStrictPrefix ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ai_compliance', uSettings.aiComplianceCheck ? 'true' : 'false');
        localStorage.setItem('rifinity_settings_ai_opt_mode', uSettings.aiOptMode);
        localStorage.setItem('rifinity_settings_ai_doc_lang', uSettings.aiDocLanguage);
        localStorage.setItem('rifinity_settings_ai_creativity', uSettings.aiCreativity.toString());
        localStorage.setItem('rifinity_settings_ai_custom_context', uSettings.aiCustomContext);
      }

      if (sysSettings) {
        // Company Branding
        localStorage.setItem('rifinity_settings_company_name', sysSettings.companyName);
        localStorage.setItem('rifinity_settings_company_tagline', sysSettings.companyTagline);
        localStorage.setItem('rifinity_settings_company_address', sysSettings.companyAddress);
        localStorage.setItem('rifinity_settings_company_phone', sysSettings.companyPhone);
        localStorage.setItem('rifinity_settings_company_email', sysSettings.companyEmail);
        localStorage.setItem('rifinity_settings_company_web', sysSettings.companyWeb);
        if (sysSettings.companyLogo) {
          localStorage.setItem('rifinity_settings_company_logo', sysSettings.companyLogo);
        } else {
          localStorage.removeItem('rifinity_settings_company_logo');
        }

        // WMS Global Thresholds
        localStorage.setItem('rifinity_settings_wms_critical_threshold', sysSettings.criticalThreshold.toString());
        localStorage.setItem('rifinity_settings_wms_predictive_threshold', sysSettings.predictiveThreshold.toString());
        localStorage.setItem('rifinity_settings_wms_default_courier', sysSettings.defaultCourier);
      }

      // Live apply light/dark theme classes globally
      const activeTheme = uSettings?.theme || 'dark';
      if (activeTheme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    }
  } catch (err) {
    console.error('Failed to sync settings from DB to LocalStorage:', err);
  }
}
