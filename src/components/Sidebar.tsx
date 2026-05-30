'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  PackagePlus, 
  PackageCheck, 
  Boxes, 
  HelpCircle,
  Truck,
  History,
  CircleDollarSign,
  LogOut,
  ChevronRight,
  Settings,
  X,
  Info,
  Activity,
  BookUser
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthGuard'
import { UserRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { useLanguage } from '@/components/LanguageProvider'
import Logo from './Logo'

const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['MANAGER','ADMIN','OPERATOR','FINANCE'] },
  { icon: PackagePlus, label: 'Smart Inbound', href: '/inbound', roles: ['MANAGER','ADMIN','OPERATOR'] },
  { icon: History, label: 'Laporan Inbound', href: '/inbound-history', roles: ['MANAGER','ADMIN','FINANCE'] },
  { icon: PackageCheck, label: 'Smart Outbound', href: '/packaging', roles: ['MANAGER','ADMIN','OPERATOR'] },
  { icon: History, label: 'Laporan Outbound', href: '/outbound-history', roles: ['MANAGER','ADMIN','FINANCE'] },
  { icon: Boxes, label: 'Inventory', href: '/inventory', roles: ['MANAGER','ADMIN','OPERATOR'] },
  { icon: BookUser, label: 'Buku Alamat', href: '/contacts', roles: ['MANAGER','ADMIN','OPERATOR','FINANCE'] },
  { icon: Activity, label: 'Log Aktivitas', href: '/audit-logs', roles: ['MANAGER'] },
  { icon: HelpCircle, label: 'Docs Helper', href: '/docs', roles: ['MANAGER','ADMIN','FINANCE'] },
  { icon: CircleDollarSign, label: 'Laporan Keuangan', href: '/reports', roles: ['MANAGER','FINANCE'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['MANAGER','ADMIN','OPERATOR','FINANCE'] },
]

function getRoleInitial(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [bounceEnabled, setBounceEnabled] = React.useState(true)
  const [profilePic, setProfilePic] = React.useState<string | null>(null)

  const [confirmConfig, setConfirmConfig] = React.useState<{
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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBounce = localStorage.getItem('rifinity_settings_ui_sidebar_hover_bounce')
      setBounceEnabled(savedBounce !== 'false') // default to true
    }
  }, [])

  React.useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const pic = localStorage.getItem(`rifinity_profile_pic_${user.username}`)
      setProfilePic(pic)
    }
  }, [user])

  const role = (user?.role as UserRole) || 'OPERATOR'
  const menuItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(role))
  const roleColor = ROLE_COLORS[role]
  const roleLabel = ROLE_LABELS[role]

  const handleLogout = () => {
    requestActionConfirm(
      'Konfirmasi Log Out',
      'Apakah Anda yakin ingin keluar dari sesi WMS Rifinity Logistik Anda?',
      async () => {
        setLoggingOut(true)
        await logout()
      }
    )
  }

  return (
    <div className={`sidebar glass ${isOpen ? 'is-mobile-open' : ''}`}>
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1.25rem 1.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo size="sm" layout="horizontal" showText={true} />
        </Link>
        <button 
          className="mobile-close-sidebar" 
          onClick={onClose} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'rgba(255,255,255,0.6)', 
            cursor: 'pointer', 
            padding: '4px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="nav-item-link"
              onClick={() => onClose?.()}
            >
              <motion.div 
                className={`nav-item ${isActive ? 'active' : ''}`}
                whileHover={bounceEnabled ? { x: 10, scale: 1.02, y: -1 } : { x: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={bounceEnabled ? { type: 'spring', stiffness: 350, damping: 12 } : { duration: 0.15 }}
              >
                <item.icon className="nav-icon" size={20} />
                <span className="nav-label">
                  {item.href === '/' ? t('dashboard', item.label) :
                   item.href === '/inbound' ? t('smart_inbound', item.label) :
                   item.href === '/inbound-history' ? t('laporan_inbound', item.label) :
                   item.href === '/packaging' ? t('smart_outbound', item.label) :
                   item.href === '/outbound-history' ? t('laporan_outbound', item.label) :
                   item.href === '/inventory' ? t('inventory', item.label) :
                   item.href === '/audit-logs' ? t('log_aktivitas', item.label) :
                   item.href === '/docs' ? t('docs_helper', item.label) :
                   item.href === '/reports' ? t('laporan_keuangan', item.label) :
                   item.href === '/settings' ? t('settings', item.label) : item.label}
                </span>
                {isActive && (
                  <motion.div 
                    className="active-indicator" 
                    layoutId="active-indicator"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Panel */}
      <div className="sidebar-footer">
        {user && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '14px',
            marginBottom: 12,
          }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: profilePic 
                  ? `url(${profilePic}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${roleColor}80, ${roleColor}40)`,
                border: `1.5px solid ${roleColor}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: roleColor,
              }}>
                {!profilePic && getRoleInitial(user.name)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2,
                  background: `${roleColor}18`, border: `1px solid ${roleColor}30`,
                  borderRadius: 100, padding: '1px 8px',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: roleColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: roleColor }}>{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <motion.button
              onClick={handleLogout}
              disabled={loggingOut}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: '#f87171', fontSize: 12, fontWeight: 500,
                transition: 'all 0.2s ease',
                opacity: loggingOut ? 0.6 : 1,
              }}
            >
              <LogOut size={14} />
              {loggingOut ? t('keluar_loading', 'Keluar...') : t('keluar_sistem', 'Keluar dari Sistem')}
            </motion.button>
          </div>
        )}
      </div>

      {/* Premium Log Out Confirmation Popup */}
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
              style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <Info size={24} style={{ color: '#ef4444' }} />
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
                    background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem'
                  }}
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
