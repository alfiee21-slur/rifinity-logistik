'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Cpu,
  Sparkles,
  Boxes,
  Save,
  Check,
  HelpCircle,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Zap,
  Building2,
  Bell,
  Settings,
  Lock
} from 'lucide-react'
import { useAuth } from '@/components/AuthGuard'
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/auth'
import { useLanguage } from '@/components/LanguageProvider'
import { playSystemSound } from '@/lib/sounds'
import { debugLog } from '@/lib/debug'

export default function SettingsPage() {
  const { user } = useAuth()
  const { language, setLanguage: setGlobalLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'ui' | 'wms' | 'branding' | 'alerts'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const requestActionConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Signature state
  const [signature, setSignature] = useState<string | null>(null)
  const [sigScale, setSigScale] = useState<number>(100)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile picture state
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const profilePicInputRef = useRef<HTMLInputElement>(null)

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Hanya diperbolehkan format gambar!')
      return
    }

    requestActionConfirm(
      'Ubah Foto Profil',
      'Apakah Anda yakin ingin mengubah foto profil Anda dengan foto baru yang dipilih?',
      () => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          if (base64) {
            setProfilePic(base64)
          }
        }
        reader.readAsDataURL(file)
      }
    )
  }

  const handleRemoveProfilePic = () => {
    requestActionConfirm(
      'Hapus Foto Profil',
      'Apakah Anda yakin ingin menghapus foto profil Anda? Tampilan akan dikembalikan menggunakan inisial nama Anda.',
      () => {
        setProfilePic(null)
        if (profilePicInputRef.current) profilePicInputRef.current.value = ''
      }
    )
  }

  const [loadingDbSettings, setLoadingDbSettings] = useState(true)

  useEffect(() => {
    if (!user) return;
    
    setLoadingDbSettings(true)
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const uSettings = data.userSettings;
          const sysSettings = data.systemSettings;

          if (uSettings) {
            setSignature(uSettings.signature || null);
            setSigScale(uSettings.sigScale || 100);
            setProfilePic(uSettings.profilePic || null);
            setGlobalLanguage(uSettings.language as any || 'id');
            setTheme(uSettings.theme as any || 'dark');
            setGlassDensity(uSettings.glassDensity as any || 'high');
            setGlowEffects(uSettings.glowEffects !== false);
            setSidebarHoverBounce(uSettings.sidebarHoverBounce !== false);
            setAutoLockSession(uSettings.autoLockSession || 'never');
            setSystemSounds(uSettings.systemSounds !== false);
            setDebugMode(uSettings.debugMode === true);

            setAiStrictPrefix(uSettings.aiStrictPrefix !== false);
            setAiCreativity(uSettings.aiCreativity ?? 0.2);
            setAiCustomContext(uSettings.aiCustomContext || '');
            setAiModel(uSettings.aiModel || 'gemini-2.5-flash');
            setAiAutosave(uSettings.aiAutosave !== false);
            setAiOptMode(uSettings.aiOptMode || 'balanced');
            setAiComplianceCheck(uSettings.aiComplianceCheck !== false);
            setAiDocLanguage(uSettings.aiDocLanguage || 'dynamic');

            setNotifWhatsapp(uSettings.notifWhatsapp !== false);
            setNotifWhatsappPhone(uSettings.notifWhatsappPhone || '6281234567890');
            setNotifAutoEmail(uSettings.notifAutoEmail !== false);
            setNotifAutoEmailAddress(uSettings.notifAutoEmailAddress || '');
            setNotifTelegram(uSettings.notifTelegram === true);
            setTelegramBotToken(uSettings.telegramBotToken || '');
            setTelegramChatId(uSettings.telegramChatId || '');
          }

          if (sysSettings) {
            setCompanyName(sysSettings.companyName || 'PT. RIFINITY LOGISTIK GLOBAL');
            setCompanyTagline(sysSettings.companyTagline || 'Smart Warehousing & Integrated Supply Chain Solutions');
            setCompanyAddress(sysSettings.companyAddress || 'Jl. Raya Logistik No. 18, Jakarta Timur, Indonesia');
            setCompanyPhone(sysSettings.companyPhone || '(021) 1234 5678');
            setCompanyEmail(sysSettings.companyEmail || 'info@rifinitylogistics.com');
            setCompanyWeb(sysSettings.companyWeb || 'www.rifinitylogistics.com');
            setCompanyLogo(sysSettings.companyLogo || null);

            setCriticalThreshold(sysSettings.criticalThreshold ?? 5);
            setPredictiveThreshold(sysSettings.predictiveThreshold ?? 20);
            setDefaultCourier(sysSettings.defaultCourier || 'PT Rifinity Express');
          }
        }
      })
      .catch(err => {
        console.error('Failed to load settings from database:', err);
      })
      .finally(() => {
        setLoadingDbSettings(false)
      })
  }, [user, setGlobalLanguage])

  const handleScaleChange = (val: number) => {
    setSigScale(val)
    if (user) {
      localStorage.setItem(`rifinity_signature_scale_${user.username}`, val.toString())
    }
  }

  const handleLanguageChange = (lang: 'id' | 'en') => {
    setGlobalLanguage(lang)
  }

  const handleThemeChange = (t: 'dark' | 'light') => {
    setTheme(t)
    localStorage.setItem('rifinity_theme', t)
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'image/png') {
      alert('Hanya diperbolehkan format PNG dengan latar belakang transparan (no background)!')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64 && user) {
        localStorage.setItem(`rifinity_signature_${user.username}`, base64)
        setSignature(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveSignature = () => {
    if (user) {
      localStorage.removeItem(`rifinity_signature_${user.username}`)
      setSignature(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Company Branding state
  const [companyName, setCompanyName] = useState('PT. RIFINITY LOGISTIK GLOBAL')
  const [companyTagline, setCompanyTagline] = useState('Smart Warehousing & Integrated Supply Chain Solutions')
  const [companyAddress, setCompanyAddress] = useState('Jl. Raya Logistik No. 18, Jakarta Timur, Indonesia')
  const [companyPhone, setCompanyPhone] = useState('(021) 1234 5678')
  const [companyEmail, setCompanyEmail] = useState('info@rifinitylogistics.com')
  const [companyWeb, setCompanyWeb] = useState('www.rifinitylogistics.com')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const companyLogoInputRef = useRef<HTMLInputElement>(null)

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Hanya diperbolehkan format gambar!')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        setCompanyLogo(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCompanyLogo = () => {
    setCompanyLogo(null)
    if (companyLogoInputRef.current) companyLogoInputRef.current.value = ''
  }

  // AI settings state
  const [aiStrictPrefix, setAiStrictPrefix] = useState(true)
  const [aiCreativity, setAiCreativity] = useState(0.2)
  const [aiCustomContext, setAiCustomContext] = useState(
    'Fokus penuh pada pekerjaan logistik (surat jalan, purchase order, commercial invoice, impor ekspor, inventory control). Tolong abaikan topik di luar logistik.'
  )
  const [aiModel, setAiModel] = useState('gemini-2.5-flash')
  const [aiAutosave, setAiAutosave] = useState(true)
  const [aiOptMode, setAiOptMode] = useState<'balanced' | 'cost' | 'speed'>('balanced')
  const [aiComplianceCheck, setAiComplianceCheck] = useState(true)
  const [aiDocLanguage, setAiDocLanguage] = useState<'dynamic' | 'id' | 'en'>('dynamic')

  // UI settings state
  const [glassDensity, setGlassDensity] = useState<'medium' | 'high'>('high')
  const [glowEffects, setGlowEffects] = useState(true)
  const [sidebarHoverBounce, setSidebarHoverBounce] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [autoLockSession, setAutoLockSession] = useState<'never' | '15m' | '30m' | '1h'>('never')
  const [systemSounds, setSystemSounds] = useState(true)
  const [debugMode, setDebugMode] = useState(false)

  // WMS thresholds state
  const [criticalThreshold, setCriticalThreshold] = useState(5)
  const [predictiveThreshold, setPredictiveThreshold] = useState(20)
  const [defaultCourier, setDefaultCourier] = useState('PT Rifinity Express')

  // Integrations & Alerts state
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)
  const [notifWhatsappPhone, setNotifWhatsappPhone] = useState('6281234567890')
  const [notifAutoEmail, setNotifAutoEmail] = useState(true)
  const [notifAutoEmailAddress, setNotifAutoEmailAddress] = useState('supplier@rifinitylogistik.co.id')

  // Telegram Integration States
  const [notifTelegram, setNotifTelegram] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')

  // Simulated Alert testing states
  const [simulatedNotif, setSimulatedNotif] = useState(false)
  const [simulatedNotifText, setSimulatedNotifText] = useState('')
  const [simulatedNotifType, setSimulatedNotifType] = useState<'whatsapp' | 'email' | 'telegram'>('telegram')
  const [testingTelegram, setTestingTelegram] = useState(false)

  const handleTestTelegramAlert = async () => {
    if (!telegramBotToken || !telegramChatId) {
      alert('Token Bot & Chat ID wajib diisi terlebih dahulu untuk uji coba!')
      return
    }

    setTestingTelegram(true)
    playSystemSound('success')

    try {
      const response = await fetch('/api/alerts/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: telegramBotToken,
          chatId: telegramChatId,
          message: `🔔 <b>[Rifinity WMS Test Alert]</b>\n\nSelamat! Bot Telegram Anda berhasil dikonfigurasi dengan sistem WMS <b>PT. RIFINITY LOGISTIK</b>.\n\nPeringatan stok otomatis siap dikirimkan ke chat ID ini secara instan dan 100% gratis.`
        })
      })

      const resJson = await response.json()

      if (resJson.success) {
        setSimulatedNotifType('telegram')
        setSimulatedNotifText('✅ Alert dikirim! Periksa aplikasi Telegram Anda.')
        setSimulatedNotif(true)
        setTimeout(() => setSimulatedNotif(false), 5000)
      } else {
        alert(`Gagal mengirim Telegram Alert: ${resJson.error || 'Terjadi kesalahan'}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Terjadi error saat mencoba mengirim alert: ${err.message}`)
    } finally {
      setTestingTelegram(false)
    }
  }

  const roleColor = user ? ROLE_COLORS[user.role] : '#6366f1'
  const roleLabel = user ? ROLE_LABELS[user.role] : 'Warehouse Operator'

  const handleSave = () => {
    requestActionConfirm(
      'Konfirmasi Simpan Pengaturan',
      'Apakah Anda yakin ingin menyimpan seluruh perubahan konfigurasi sistem WMS Rifinity Logistik?',
      () => executeSave()
    )
  }

  const executeSave = async () => {
    setSaving(true)

    if (typeof window !== 'undefined') {
      // Persist UI preferences
      localStorage.setItem('rifinity_settings_ui_glass_density', glassDensity)
      localStorage.setItem('rifinity_settings_ui_glow_effects', glowEffects ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_ui_sidebar_hover_bounce', sidebarHoverBounce ? 'true' : 'false')
      localStorage.setItem('rifinity_language', language)
      localStorage.setItem('rifinity_theme', theme)
      localStorage.setItem('rifinity_settings_ui_auto_lock', autoLockSession)
      localStorage.setItem('rifinity_settings_ui_system_sounds', systemSounds ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_ui_debug_mode', debugMode ? 'true' : 'false')

      // Persist AI logistics configuration
      localStorage.setItem('rifinity_settings_ai_strict', aiStrictPrefix ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_ai_creativity', aiCreativity.toString())
      localStorage.setItem('rifinity_settings_ai_custom_context', aiCustomContext)
      localStorage.setItem('rifinity_settings_ai_model', aiModel)
      localStorage.setItem('rifinity_settings_ai_autosave', aiAutosave ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_ai_opt_mode', aiOptMode)
      localStorage.setItem('rifinity_settings_ai_compliance', aiComplianceCheck ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_ai_doc_lang', aiDocLanguage)

      // Persist WMS Threshold configurations
      localStorage.setItem('rifinity_settings_wms_critical_threshold', criticalThreshold.toString())
      localStorage.setItem('rifinity_settings_wms_predictive_threshold', predictiveThreshold.toString())
      localStorage.setItem('rifinity_settings_wms_default_courier', defaultCourier)

      if (profilePic) {
        localStorage.setItem(`rifinity_profile_pic_${user?.username}`, profilePic)
      } else {
        localStorage.removeItem(`rifinity_profile_pic_${user?.username}`)
      }

      // Persist Company Branding
      localStorage.setItem('rifinity_settings_company_name', companyName)
      localStorage.setItem('rifinity_settings_company_tagline', companyTagline)
      localStorage.setItem('rifinity_settings_company_address', companyAddress)
      localStorage.setItem('rifinity_settings_company_phone', companyPhone)
      localStorage.setItem('rifinity_settings_company_email', companyEmail)
      localStorage.setItem('rifinity_settings_company_web', companyWeb)
      if (companyLogo) localStorage.setItem('rifinity_settings_company_logo', companyLogo)
      else localStorage.removeItem('rifinity_settings_company_logo')

      // Persist Integrations & Alerts
      localStorage.setItem('rifinity_settings_notif_whatsapp', notifWhatsapp ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_notif_whatsapp_phone', notifWhatsappPhone)
      localStorage.setItem('rifinity_settings_notif_auto_email', notifAutoEmail ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_notif_auto_email_address', notifAutoEmailAddress)

      localStorage.setItem('rifinity_settings_notif_telegram', notifTelegram ? 'true' : 'false')
      localStorage.setItem('rifinity_settings_telegram_bot_token', telegramBotToken)
      localStorage.setItem('rifinity_settings_telegram_chat_id', telegramChatId)

      // Live apply light/dark theme classes globally
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode')
      } else {
        document.documentElement.classList.remove('light-mode')
      }
    }

    try {
      const payload = {
        userSettings: {
          theme,
          language,
          glassDensity,
          glowEffects,
          sidebarHoverBounce,
          autoLockSession,
          systemSounds,
          debugMode,
          signature,
          sigScale,
          profilePic,
          aiModel,
          aiAutosave,
          aiStrictPrefix,
          aiComplianceCheck,
          aiOptMode,
          aiDocLanguage,
          aiCreativity,
          aiCustomContext,
          notifWhatsapp,
          notifWhatsappPhone,
          notifAutoEmail,
          notifAutoEmailAddress,
          notifTelegram,
          telegramBotToken,
          telegramChatId
        },
        systemSettings: user?.role === 'MANAGER' ? {
          companyName,
          companyTagline,
          companyAddress,
          companyPhone,
          companyEmail,
          companyWeb,
          companyLogo,
          criticalThreshold,
          predictiveThreshold,
          defaultCourier
        } : undefined
      };

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      console.error('Failed to sync settings with DB:', err);
    }

    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      
      // Synthesize crispy WMS success chime & trigger debugger console log
      playSystemSound('success')
      debugLog('WMS System Preferences successfully persisted to SQLite database and localStorage.')

      setTimeout(() => setSaved(false), 3000)
    }, 800)
  }

  const tabs = [
    { id: 'profile', label: 'Profil Anda', icon: User },
    { id: 'ai', label: 'AI Logistik', icon: Cpu },
    { id: 'ui', label: 'Sistem', icon: Settings },
    { id: 'wms', label: 'Threshold WMS', icon: Boxes },
    { id: 'branding', label: 'Kop Surat & Brand', icon: Building2 },
    { id: 'alerts', label: 'Integrasi & Alert', icon: Bell },
  ] as const
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">{t('system_settings_title', 'System Settings')}</h1>
          <p className="page-subtitle">{t('system_settings_desc', 'Configure user profile, AI logistics engine, and application settings.')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: saved ? '#10b981' : 'var(--primary)',
            borderColor: saved ? '#10b981' : 'var(--primary)',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          {saving ? (
            <>{language === 'id' ? 'Menyimpan...' : 'Saving...'}</>
          ) : saved ? (
            <>
              <Check size={18} />
              {t('saved_successfully', 'Saved Successfully!')}
            </>
          ) : (
            <>
              <Save size={18} />
              {t('save_configuration', 'Save Configuration')}
            </>
          )}
        </button>
      </header>

      {/* Settings Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>

        {/* Navigation Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const TabIcon = tab.icon
            const translatedLabel = tab.id === 'profile' ? t('profil_anda', tab.label) :
                                   tab.id === 'ai' ? t('ai_logistik', tab.label) :
                                   tab.id === 'ui' ? t('sistem', tab.label) :
                                   tab.id === 'wms' ? t('threshold_wms', tab.label) :
                                   tab.id === 'branding' ? t('kop_surat_brand', tab.label) :
                                   t('integrasi_alert', tab.label)
            const isRestricted = (tab.id === 'wms' || tab.id === 'branding') && user?.role !== 'MANAGER'
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                  width: '100%'
                }}
              >
                <div style={{
                  padding: 8,
                  borderRadius: 10,
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#818cf8' : 'inherit',
                  transition: 'all 0.2s ease'
                }}>
                  <TabIcon size={18} />
                </div>
                <span style={{ flexGrow: 1 }}>{translatedLabel}</span>
                {isRestricted && (
                  <Lock size={12} style={{ color: '#f59e0b', opacity: 0.8, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Setting Panel Content (Glassmorphism card) */}
        <div className="card glass" style={{ padding: '2rem', minHeight: 450, display: 'flex', flexDirection: 'column', justifyContent: loadingDbSettings ? 'center' : 'flex-start', alignItems: loadingDbSettings ? 'center' : 'stretch' }}>
          {loadingDbSettings ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100%', minHeight: 350 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.05)',
                borderTopColor: '#818cf8',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500 }}>Memuat konfigurasi dari database...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              {/* Tab 1: User Profile Settings */}
              {activeTab === 'profile' && user && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={22} style={{ color: '#6366f1' }} />
                    User Profile Settings
                  </h3>

                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <div 
                      onClick={() => profilePicInputRef.current?.click()}
                      style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: profilePic 
                          ? `url(${profilePic}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${roleColor}80, ${roleColor}30)`,
                        border: `2px solid ${roleColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 700, color: 'white',
                        boxShadow: `0 8px 24px ${roleColor}33`,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="avatar-upload-group"
                    >
                      {!profilePic && user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      
                      {/* Hover Overlay */}
                      <div 
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.2s ease',
                        }} 
                        className="avatar-hover-overlay"
                      >
                        <Sparkles size={18} style={{ color: 'white' }} />
                      </div>
                      
                      <style>{`
                        .avatar-upload-group:hover .avatar-hover-overlay {
                          opacity: 1 !important;
                        }
                      `}</style>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: '0 0 6px 0' }}>{user.name}</h4>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          background: `${roleColor}22`, border: `1px solid ${roleColor}40`,
                          borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: roleColor
                        }}>
                          {roleLabel}
                        </span>

                        {/* Hidden Upload input */}
                        <input
                          type="file"
                          ref={profilePicInputRef}
                          onChange={handleProfilePicUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />

                        <button
                          onClick={() => profilePicInputRef.current?.click()}
                          style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '4px 10px',
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                          }}
                        >
                          Ubah Foto
                        </button>

                        {profilePic && (
                          <button
                            onClick={handleRemoveProfilePic}
                            style={{
                              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444', borderRadius: '8px', padding: '4px 10px',
                              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            Hapus Foto
                          </button>
                        )}
                        
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>· Active session</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Username</label>
                      <input
                        type="text"
                        value={user.username}
                        readOnly
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.6)', cursor: 'not-allowed', fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Role Authority</label>
                      <input
                        type="text"
                        value={user.role}
                        readOnly
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.6)', cursor: 'not-allowed', fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Signature Upload Area */}
                  <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>
                      Tanda Tangan Digital (Format PNG Transparan)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1.5rem', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                          Upload file tanda tangan Anda dalam format **PNG transparan (tanpa background)**.
                          Tanda tangan ini akan dimasukkan secara otomatis ke dalam dokumen resmi (seperti Purchase Order, Surat Restock, dll.) yang Anda cetak atau unduh sebagai PDF atas nama Anda.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-primary"
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Pilih File PNG
                          </button>
                          {signature && (
                            <button
                              type="button"
                              onClick={handleRemoveSignature}
                              style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
                                cursor: 'pointer'
                              }}
                            >
                              Hapus Tanda Tangan
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png"
                          onChange={handleSignatureUpload}
                          style={{ display: 'none' }}
                        />

                        {/* Signature scaling slider */}
                        {signature && (
                          <div style={{ marginTop: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Ukuran / Skala Tanda Tangan</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>{sigScale}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="180"
                              step="5"
                              value={sigScale}
                              onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                              style={{
                                width: '100%',
                                accentColor: '#818cf8',
                                height: 4,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.1)',
                                cursor: 'pointer'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Signature Preview Frame with checkered background for transparency */}
                      <div style={{
                        height: 140,
                        borderRadius: 12,
                        border: '1px dashed rgba(255,255,255,0.15)',
                        backgroundColor: signature ? '#ffffff' : 'rgba(255,255,255,0.01)',
                        backgroundImage: signature ? 'none' : 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0)',
                        backgroundSize: '12px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: signature ? 'inset 0 2px 8px rgba(0,0,0,0.1)' : 'none'
                      }}>
                        {signature ? (
                          <img
                            src={signature}
                            alt="Preview Tanda Tangan"
                            style={{
                              maxHeight: '120px',
                              maxWidth: '180px',
                              objectFit: 'contain',
                              transform: `scale(${sigScale / 100})`,
                              transformOrigin: 'center',
                              transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Belum ada Tanda Tangan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 12,
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: '#818cf8',
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                  }}>
                    <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Security Info:</strong> Akun Anda terhubung dengan autentikasi berbasis enkripsi PBKDF2 tingkat tinggi. Sesi aktif dilindungi dengan JWT bertanda tangan cryptografis yang kedaluwarsa dalam 7 hari.
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Logistics Settings */}
              {activeTab === 'ai' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={22} style={{ color: '#818cf8' }} />
                    AI Logistics Engine
                  </h3>

                  {/* Section 1: Model & Autosave */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Model Otak Kecerdasan AI</label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Cepat & Akurat - Rekomendasi)</option>
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (Kapasitas Harian Terbatas)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Analisis Kompleks & Logika Tinggi)</option>
                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite (Super Cepat & Latensi Sub-Detik)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Auto-Save Drafts to Cloud</h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Simpan draf secara otomatis ke cloud server.</p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={aiAutosave}
                          onChange={(e) => setAiAutosave(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: aiAutosave ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                          borderRadius: 34, transition: 'all 0.3s',
                          boxShadow: aiAutosave ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: 16, width: 16, left: aiAutosave ? 24 : 4, bottom: 4,
                            backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Section 2: Zero-Conversational & Compliance Toggles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Clean Document Preamble</h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hapus kalimat basa-basi di draf awal.</p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={aiStrictPrefix}
                          onChange={(e) => setAiStrictPrefix(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: aiStrictPrefix ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                          borderRadius: 34, transition: 'all 0.3s',
                          boxShadow: aiStrictPrefix ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: 16, width: 16, left: aiStrictPrefix ? 24 : 4, bottom: 4,
                            backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                          }} />
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Global Regulatory Check</h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Verifikasi otomatis kepatuhan ekspor/impor.</p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={aiComplianceCheck}
                          onChange={(e) => setAiComplianceCheck(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: aiComplianceCheck ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                          borderRadius: 34, transition: 'all 0.3s',
                          boxShadow: aiComplianceCheck ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: 16, width: 16, left: aiComplianceCheck ? 24 : 4, bottom: 4,
                            backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Section 3: Optimization Mode & Document Language */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Mode Strategi Optimasi Logistik</label>
                      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['balanced', 'cost', 'speed'] as const).map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setAiOptMode(mode)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: aiOptMode === mode ? 'rgba(59,130,246,0.2)' : 'transparent',
                              color: aiOptMode === mode ? 'white' : 'rgba(255,255,255,0.4)',
                              border: aiOptMode === mode ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            {mode === 'balanced' ? 'Balanced' : mode === 'cost' ? 'Cost-Opt' : 'Speed-Opt'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Format Bahasa Dokumen AI</label>
                      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['dynamic', 'id', 'en'] as const).map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setAiDocLanguage(lang)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: aiDocLanguage === lang ? 'rgba(99,102,241,0.2)' : 'transparent',
                              color: aiDocLanguage === lang ? 'white' : 'rgba(255,255,255,0.4)',
                              border: aiDocLanguage === lang ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            {lang === 'dynamic' ? 'Dynamic' : lang === 'id' ? 'ID' : 'EN'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Creativity Slider */}
                  <div style={{ padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Kreativitas AI (Temperature)</h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nilai rendah memprioritaskan akurasi analitis; nilai tinggi memberikan variasi ekspresi.</p>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>{aiCreativity.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Analitis (0.0)</span>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        value={aiCreativity}
                        onChange={(e) => setAiCreativity(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: '#3b82f6', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Kreatif (1.0)</span>
                    </div>
                  </div>

                  {/* Section 5: System instruction override prompt */}
                  <div style={{ padding: '1.5rem 0' }}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Sistem Prompt & Guardrails AI</label>
                    <textarea
                      value={aiCustomContext}
                      onChange={(e) => setAiCustomContext(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5,
                        resize: 'vertical', fontFamily: 'Inter, sans-serif'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: System Settings */}
              {activeTab === 'ui' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={22} style={{ color: '#94a3b8' }} />
                    Pengaturan Sistem
                  </h3>

                  {/* Section 1: Localization & Themes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Pilihan Bahasa (Language)</h4>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem 0' }}>Pilih bahasa pengantar antarmuka sistem.</p>
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['id', 'en'] as const).map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleLanguageChange(lang)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: language === lang ? 'rgba(99,102,241,0.2)' : 'transparent',
                              color: language === lang ? 'white' : 'rgba(255,255,255,0.4)',
                              border: language === lang ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Tema Tampilan (Theme)</h4>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem 0' }}>Pilih tema visual antarmuka sistem.</p>
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['dark', 'light'] as const).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleThemeChange(t)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: theme === t ? 'rgba(99,102,241,0.2)' : 'transparent',
                              color: theme === t ? 'white' : 'rgba(255,255,255,0.4)',
                              border: theme === t ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              textAlign: 'center',
                              textTransform: 'capitalize'
                            }}
                          >
                            {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: UI Aesthetics & Glassmorphism */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Kepadatan Efek Kaca (Glass Density)</h4>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem 0' }}>Atur ketebalan background kaca buram.</p>
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {(['medium', 'high'] as const).map(density => (
                          <button
                            key={density}
                            type="button"
                            onClick={() => setGlassDensity(density)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: glassDensity === density ? 'rgba(59,130,246,0.2)' : 'transparent',
                              color: glassDensity === density ? 'white' : 'rgba(255,255,255,0.4)',
                              border: glassDensity === density ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                              transition: 'all 0.2s ease',
                              textAlign: 'center',
                              textTransform: 'capitalize'
                            }}
                          >
                            {density} Density
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Sidebar Bounce Animation</h4>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Gunakan efek memantul mikro pada menu navigasi.</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={sidebarHoverBounce}
                            onChange={(e) => setSidebarHoverBounce(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: sidebarHoverBounce ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            borderRadius: 34, transition: 'all 0.3s',
                            boxShadow: sidebarHoverBounce ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                          }}>
                            <span style={{
                              position: 'absolute', content: '""', height: 16, width: 16, left: sidebarHoverBounce ? 24 : 4, bottom: 4,
                              backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                            }} />
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Glow Neon Effects</h4>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Aktifkan pijaran neon futuristik di sekeliling kartu aktif.</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={glowEffects}
                            onChange={(e) => setGlowEffects(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: glowEffects ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            borderRadius: 34, transition: 'all 0.3s',
                            boxShadow: glowEffects ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                          }}>
                            <span style={{
                              position: 'absolute', content: '""', height: 16, width: 16, left: glowEffects ? 24 : 4, bottom: 4,
                              backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                            }} />
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Session & System Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Kunci Sesi Otomatis (Auto-Lock Session)</label>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem 0' }}>Kunci atau log-out sesi secara otomatis saat tidak aktif.</p>
                      <select
                        value={autoLockSession}
                        onChange={(e) => setAutoLockSession(e.target.value as any)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      >
                        <option value="never">Nonaktif (Sesi Selalu Aktif)</option>
                        <option value="15m">15 Menit Tidak Aktif</option>
                        <option value="30m">30 Menit Tidak Aktif</option>
                        <option value="1h">1 Jam Tidak Aktif</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Efek Suara Sistem (System Sounds)</h4>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Bunyikan audio sukses/peringatan mikro saat transaksi logistik.</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={systemSounds}
                            onChange={(e) => setSystemSounds(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: systemSounds ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            borderRadius: 34, transition: 'all 0.3s',
                            boxShadow: systemSounds ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                          }}>
                            <span style={{
                              position: 'absolute', content: '""', height: 16, width: 16, left: systemSounds ? 24 : 4, bottom: 4,
                              backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                            }} />
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Mode Debug & Log Sistem</h4>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Tampilkan log konsol detail untuk diagnostik WMS.</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={debugMode}
                            onChange={(e) => setDebugMode(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: debugMode ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                            borderRadius: 34, transition: 'all 0.3s',
                            boxShadow: debugMode ? '0 0 8px rgba(59,130,246,0.5)' : 'none'
                          }}>
                            <span style={{
                              position: 'absolute', content: '""', height: 16, width: 16, left: debugMode ? 24 : 4, bottom: 4,
                              backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                            }} />
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: WMS Thresholds Settings */}
              {activeTab === 'wms' && (
                <div style={{ position: 'relative', minHeight: '320px' }}>
                  {user?.role !== 'MANAGER' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      zIndex: 10, backgroundColor: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(6px)',
                      borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', padding: '2rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '1rem' }}>
                        <Lock size={26} style={{ color: '#f59e0b' }} />
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Akses Terbatas: Ambang Batas WMS</h4>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '400px', lineHeight: '1.5', margin: 0 }}>
                        Ambang batas stok kritis dan konfigurasi logistik hanya dapat diubah oleh **Warehouse Manager** untuk menjaga stabilitas operasional.
                      </p>
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Boxes size={22} style={{ color: '#fbbf24' }} />
                    Ambang Batas & Logistik WMS
                  </h3>

                  {/* Thresholds Input Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
                        Critical Stock Limit (Unit)
                      </label>
                      <input
                        type="number"
                        value={criticalThreshold}
                        onChange={(e) => setCriticalThreshold(parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.9rem'
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                        Stok di bawah batas ini akan diberi label merah &quot;Needs Restock&quot;.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                        <Flame size={14} style={{ color: '#ef4444' }} />
                        Predictive Restock Alert Limit
                      </label>
                      <input
                        type="number"
                        value={predictiveThreshold}
                        onChange={(e) => setPredictiveThreshold(parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.9rem'
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                        Stok di bawah batas ini akan masuk ke antrean restock cepat di Dashboard.
                      </span>
                    </div>
                  </div>

                  {/* Courier selection */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                      <Zap size={14} style={{ color: '#3b82f6' }} />
                      Default Logistics Shipping Partner
                    </label>
                    <select
                      value={defaultCourier}
                      onChange={(e) => setDefaultCourier(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(20,25,45,0.85)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.9rem', cursor: 'pointer', outline: 'none'
                      }}
                    >
                      <option value="PT Rifinity Express">PT Rifinity Express (Internal Fleet)</option>
                      <option value="PT Pos Indonesia">PT Pos Indonesia (Official Partner)</option>
                      <option value="JNE Express">JNE Express</option>
                      <option value="J&T Express">J&T Express</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 5: Corporate Branding / Kop Surat */}
              {activeTab === 'branding' && (
                <div style={{ position: 'relative', minHeight: '380px' }}>
                  {user?.role !== 'MANAGER' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      zIndex: 10, backgroundColor: 'rgba(10, 15, 30, 0.6)', backdropFilter: 'blur(6px)',
                      borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', padding: '2rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '1rem' }}>
                        <Lock size={26} style={{ color: '#f59e0b' }} />
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Akses Terbatas: Kop Surat & Brand</h4>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '400px', lineHeight: '1.5', margin: 0 }}>
                        Hanya pengguna dengan wewenang **Warehouse Manager** yang diizinkan untuk melihat detail lengkap dan mengubah kop surat, logo, atau identitas branding perusahaan.
                      </p>
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={22} style={{ color: '#818cf8' }} />
                    Kop Surat & Branding Perusahaan
                  </h3>

                  {/* Logo Upload */}
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 16,
                      background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {companyLogo ? (
                        <img src={companyLogo} alt="Corporate Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building2 size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '0 0 6px 0' }}>Logo Kop Surat Perusahaan</h4>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px 0' }}>Disarankan menggunakan format PNG transparan dengan resolusi landscape.</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => companyLogoInputRef.current?.click()}
                          style={{
                            padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none',
                            borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Upload Logo
                        </button>
                        <input
                          type="file"
                          ref={companyLogoInputRef}
                          onChange={handleCompanyLogoUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        {companyLogo && (
                          <button
                            onClick={handleRemoveCompanyLogo}
                            style={{
                              padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, fontSize: '0.75rem',
                              fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Details Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Nama Resmi Perusahaan</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Tagline Perusahaan</label>
                      <input
                        type="text"
                        value={companyTagline}
                        onChange={(e) => setCompanyTagline(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Alamat Kantor Pusat</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>No. Telepon Resmi</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Email Korporat</label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>Website Resmi</label>
                      <input
                        type="text"
                        value={companyWeb}
                        onChange={(e) => setCompanyWeb(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Integrasi & Alert (Telegram Bot WMS) */}
              {activeTab === 'alerts' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={22} style={{ color: '#0088cc' }} />
                    Integrasi & Sistem Peringatan Otomatis (WMS Alert)
                  </h3>

                  {/* Info alert box */}
                  <div style={{
                    background: 'rgba(0, 136, 204, 0.05)',
                    border: '1px solid rgba(0, 136, 204, 0.2)',
                    borderRadius: 14,
                    padding: '1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0088cc', margin: 0 }}>💡 Telegram Bot Alert (100% GRATIS)</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
                      Sistem ini memungkinkan WMS mengirimkan pesan notifikasi otomatis saat stok barang di bawah limit aman ke HP manajer secara instan tanpa biaya.
                    </p>
                    <ol style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', paddingLeft: '1.25rem', margin: '6px 0 0 0', lineHeight: 1.6 }}>
                      <li>Buka Telegram, cari bot <b>@BotFather</b> lalu buat bot baru dengan perintah <code>/newbot</code>.</li>
                      <li>Salin <b>HTTP API Bot Token</b> yang diberikan oleh @BotFather dan tempel di form di bawah ini.</li>
                      <li>Cari bot <b>@userinfobot</b> atau <b>@GetIdsBot</b> di Telegram dan kirim pesan apa saja untuk mendapatkan <b>Chat ID</b> Anda (biasanya berupa deretan angka panjang).</li>
                      <li>Masukkan Chat ID tersebut di bawah, simpan konfigurasi, lalu klik tombol Uji Coba Alert.</li>
                    </ol>
                  </div>

                  {/* Telegram Toggle & Inputs */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: '0 0 2px 0' }}>Aktifkan Notifikasi Telegram Otomatis</h4>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Kirimkan alert langsung saat barang menyentuh limit stok kritis.</p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={notifTelegram}
                          onChange={(e) => setNotifTelegram(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: notifTelegram ? '#0088cc' : 'rgba(255,255,255,0.1)',
                          borderRadius: 34, transition: 'all 0.3s',
                          boxShadow: notifTelegram ? '0 0 8px rgba(0,136,204,0.5)' : 'none'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: 16, width: 16, left: notifTelegram ? 24 : 4, bottom: 4,
                            backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s'
                          }} />
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>HTTP API Bot Token Telegram</label>
                        <input
                          type="text"
                          value={telegramBotToken}
                          onChange={(e) => setTelegramBotToken(e.target.value)}
                          placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRs..."
                          style={{
                            width: '100%', padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white', fontSize: '0.85rem', outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Telegram Chat ID / Group ID</label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="Contoh: 987654321 atau -100123456789"
                          style={{
                            width: '100%', padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white', fontSize: '0.85rem', outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Test Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleTestTelegramAlert}
                        disabled={testingTelegram}
                        className="btn-primary"
                        style={{
                          background: '#0088cc',
                          borderColor: '#0088cc',
                          padding: '10px 20px',
                          borderRadius: 10,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Bell size={16} />
                        {testingTelegram ? 'Mengirim Uji Coba...' : 'Kirim Uji Coba Telegram Alert'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* iOS styled Simulated Notification Toast */}
      <AnimatePresence>
        {simulatedNotif && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100000,
              width: '380px', padding: '1.25rem', borderRadius: '16px',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              border: simulatedNotifType === 'whatsapp' ? '1.5px solid #25D366' : simulatedNotifType === 'telegram' ? '1.5px solid #0088cc' : '1.5px solid #FF9900',
              boxShadow: simulatedNotifType === 'whatsapp' 
                ? `0 12px 40px rgba(37, 211, 102, ${theme === 'light' ? '0.15' : '0.3'}), inset 0 1px 1px ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)'}`
                : simulatedNotifType === 'telegram'
                ? `0 12px 40px rgba(0, 136, 204, ${theme === 'light' ? '0.15' : '0.3'}), inset 0 1px 1px ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)'}`
                : `0 12px 40px rgba(255, 153, 0, ${theme === 'light' ? '0.15' : '0.3'}), inset 0 1px 1px ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)'}`,
              color: theme === 'light' ? '#0f172a' : 'white', fontFamily: 'sans-serif'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', borderBottom: theme === 'light' ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              {simulatedNotifType === 'whatsapp' ? (
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#25D366' }}>📲 WhatsApp Alert System</span>
              ) : simulatedNotifType === 'telegram' ? (
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0088cc' }}>📲 Telegram Bot System</span>
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF9900' }}>📧 Supplier Email System</span>
              )}
              <span style={{ fontSize: '0.7rem', color: theme === 'light' ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>Sekarang • SIMULASI</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.45', margin: 0, color: theme === 'light' ? '#1e293b' : 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
              {simulatedNotifText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Save Settings Confirmation Popup */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="confirm-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 8, 22, 0.75)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '1.5rem'
          }}>
            <motion.div
              className="confirm-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <Settings size={24} style={{ color: '#818cf8' }} />
                </div>
                <h3>{confirmConfig.title}</h3>
                <p>{confirmConfig.message}</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmConfig.onConfirm}
                  style={{
                    flex: 1.5, padding: '0.75rem', borderRadius: '8px', border: 'none',
                    background: 'var(--primary)', color: '#0b1329', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem'
                  }}
                >
                  Ya, Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
