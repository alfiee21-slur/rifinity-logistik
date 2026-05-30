'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AIChat from '@/components/AIChat'
import { Menu, Truck, X } from 'lucide-react'
import { playSystemSound } from '@/lib/sounds'
import { debugLog } from '@/lib/debug'

const NO_SHELL_ROUTES = ['/login', '/access-denied']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const showShell = !NO_SHELL_ROUTES.includes(pathname)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 1. Dynamic UI Aesthetics (Glass density & Glow effects) & Page-change Sounds
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Read settings
    const savedGlass = localStorage.getItem('rifinity_settings_ui_glass_density') || 'high'
    const savedGlow = localStorage.getItem('rifinity_settings_ui_glow_effects') !== 'false' // default true

    // Apply attributes to html tag
    document.documentElement.setAttribute('data-glass-density', savedGlass)
    document.documentElement.setAttribute('data-glow-effects', savedGlow ? 'true' : 'false')

    // Play crisp click sound when switching routes
    if (showShell) {
      playSystemSound('click')
      debugLog(`Navigated to active route: ${pathname}`, { glass: savedGlass, glow: savedGlow })
    }
  }, [pathname, showShell])

  // 2. Security Auto-Lock Session Idle Monitor
  useEffect(() => {
    if (typeof window === 'undefined') return

    let idleTimeout: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout)

      const savedLock = localStorage.getItem('rifinity_settings_ui_auto_lock')
      // If disabled or not set, session stays active
      if (!savedLock || savedLock === 'Nonaktif' || savedLock === 'false' || savedLock === 'never') return

      let timeoutMs = 5 * 60 * 1000 // default 5 minutes
      if (savedLock === '15 Menit' || savedLock === '15m') timeoutMs = 15 * 60 * 1000
      if (savedLock === '30 Menit' || savedLock === '30m') timeoutMs = 30 * 60 * 1000
      if (savedLock === '1h') timeoutMs = 60 * 60 * 1000

      idleTimeout = setTimeout(async () => {
        debugLog('Auto-Lock Triggered: Session idle timeout reached.')
        // Clear authentication session on client and server
        localStorage.removeItem('rifinity_user')
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (err) {
          debugLog('Error calling logout API during auto-lock:', err)
        }
        playSystemSound('warning')
        // Lock screen
        router.push('/access-denied')
      }, timeoutMs)
    }

    // Capture activity signals to refresh the lease
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    window.addEventListener('click', resetIdleTimer)
    window.addEventListener('scroll', resetIdleTimer)

    resetIdleTimer()

    return () => {
      clearTimeout(idleTimeout)
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
      window.removeEventListener('click', resetIdleTimer)
      window.removeEventListener('scroll', resetIdleTimer)
    }
  }, [router])

  if (!showShell) {
    return <>{children}</>
  }

  return (
    <div className="layout-wrapper">
      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck className="logo-icon" size={24} />
          <span className="logo-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Rifinity <span className="text-primary">Logistik</span>
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mobile-menu-toggle"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Overlay Backdrop */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        {children}
      </main>
      <AIChat />
    </div>
  )
}
