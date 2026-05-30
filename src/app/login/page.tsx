'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Eye, EyeOff, Loader2, ShieldCheck, Sun, Moon, CheckCircle, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'

const DEMO_ACCOUNTS = [
  { role: 'MANAGER', label: 'Warehouse Manager', username: 'manager', color: '#f59e0b', desc: 'Akses penuh ke semua fitur' },
  { role: 'ADMIN', label: 'Warehouse Admin', username: 'admin', color: '#6366f1', desc: 'Operasional gudang & dokumen' },
  { role: 'OPERATOR', label: 'Warehouse Operator', username: 'operator', color: '#10b981', desc: 'Input barang & stok fisik' },
  { role: 'FINANCE', label: 'Finance Officer', username: 'finance', color: '#ec4899', desc: 'Keuangan & laporan faktur' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [successPopup, setSuccessPopup] = useState(false)
  const [errorPopup, setErrorPopup] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('rifinity_theme') || 'dark'
      setTheme(savedTheme as 'dark' | 'light')
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode')
      } else {
        document.documentElement.classList.remove('light-mode')
      }
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('rifinity_theme', newTheme)
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorPopup('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login gagal.')
        setErrorPopup(data.error || 'Login gagal.')
        setTimeout(() => setErrorPopup(''), 4000)
      } else {
        setSuccessPopup(true)
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1800)
      }
    } catch {
      setError('Tidak dapat terhubung ke server.')
      setErrorPopup('Tidak dapat terhubung ke server.')
      setTimeout(() => setErrorPopup(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username)
    setPassword('password123')
    setError('')
  }

  return (
    <div className="login-page-wrapper">
      {/* Floating Theme Toggle */}
      <button 
        type="button" 
        onClick={toggleTheme} 
        className="theme-toggle-btn"
        title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Animated background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', animation: 'pulse 10s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', top: '55%', left: '55%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)', animation: 'pulse 12s ease-in-out infinite 4s' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        
        .login-page-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.12) 0%, transparent 50%), linear-gradient(135deg, #0a0f1a 0%, #0d1425 50%, #0a0f1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
          transition: background 0.3s ease;
        }

        .login-container {
          display: flex;
          gap: 32px;
          align-items: stretch;
          max-width: 920px;
          width: 100%;
          z-index: 1;
        }

        .branding-panel {
          flex: 1;
          background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.08) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 280px;
          transition: all 0.3s ease;
        }

        .form-panel {
          flex: 1;
          background: rgba(15,20,40,0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          animation-delay: 0.1s;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .login-card { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .demo-chip:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(99,102,241,0.4) !important; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .form-input:focus { border-color: rgba(99,102,241,0.7) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }

        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        /* Floating Theme Switcher */
        .theme-toggle-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          color: #f1f5f9;
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .mobile-logo-header {
          display: none;
        }

        /* Responsive Layout styles */
        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
            gap: 20px;
            max-width: 450px;
          }
          .branding-panel {
            display: none !important;
          }
          .form-panel {
            padding: 36px 24px;
          }
          .mobile-logo-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 24px;
          }
          .demo-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Light Mode CSS Overrides */
        .light-mode .login-page-wrapper {
          background: radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%) !important;
        }

        .light-mode .theme-toggle-btn {
          background: rgba(15, 23, 42, 0.05);
          border-color: rgba(15, 23, 42, 0.08);
          color: #0f172a;
        }
        .light-mode .theme-toggle-btn:hover {
          background: rgba(15, 23, 42, 0.08);
        }

        .light-mode .branding-panel {
          background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(16,185,129,0.04) 100%) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
        }

        .light-mode .form-panel {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.06) !important;
        }

        .light-mode .brand-title {
          color: #0f172a !important;
        }

        .light-mode .brand-desc,
        .light-mode .feature-pill-text {
          color: #475569 !important;
        }

        .light-mode .system-protected-box {
          background: rgba(15, 23, 42, 0.03) !important;
          border-color: rgba(15, 23, 42, 0.06) !important;
        }

        .light-mode .system-protected-desc {
          color: #64748b !important;
        }

        .light-mode .login-title {
          color: #0f172a !important;
        }

        .light-mode .login-subtitle,
        .light-mode .demo-heading {
          color: #64748b !important;
        }

        .light-mode .login-label {
          color: #475569 !important;
        }

        .light-mode .demo-chip {
          border-color: rgba(15, 23, 42, 0.08) !important;
        }
        .light-mode .demo-chip:hover {
          background: rgba(15, 23, 42, 0.02) !important;
        }

        .light-mode .demo-chip-desc {
          color: #64748b !important;
        }

        .light-mode .demo-password-note {
          color: #64748b !important;
        }
        .light-mode .demo-password-note strong {
          color: #475569 !important;
        }
      `}</style>

      <div className="login-container">
        
        {/* Left — Branding Panel */}
        <div className="login-card branding-panel">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
              <Logo size="md" layout="horizontal" showText={true} />
            </div>

            <h1 className="brand-tagline" style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 16, transition: 'color 0.3s ease' }}>
              Smart Warehouse<br />
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Management</span>
            </h1>
            <p className="brand-desc" style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 36, transition: 'color 0.3s ease' }}>
              Platform WMS bertenaga AI untuk manajemen gudang, logistik ekspor-impor, dan pelaporan keuangan terpadu.
            </p>

            {/* Feature pills */}
            {['🤖 AI Logistik Terintegrasi', '📦 Smart Inbound & Outbound', '📊 Laporan Keuangan Real-Time', '📄 Docs Helper Ekspor/Impor'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #10b981)', flexShrink: 0 }} />
                <span className="feature-pill-text" style={{ color: '#94a3b8', fontSize: 13, transition: 'color 0.3s ease' }}>{f}</span>
              </div>
            ))}
          </div>

          <div className="system-protected-box" style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={14} color="#10b981" />
              <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Sistem Terproteksi</span>
            </div>
            <p className="system-protected-desc" style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, margin: 0, transition: 'color 0.3s ease' }}>
              Akses halaman dikontrol berdasarkan peran pengguna. Data sensitif keuangan hanya dapat diakses oleh level Manager & Finance.
            </p>
          </div>
        </div>

        {/* Right — Login Form Panel */}
        <div className="login-card form-panel">
          {/* Mobile Logo Header */}
          <div className="mobile-logo-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Logo size="sm" layout="horizontal" showText={true} />
          </div>

          <h2 className="login-title" style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 6, transition: 'color 0.3s ease' }}>Selamat Datang</h2>
          <p className="login-subtitle" style={{ color: '#64748b', fontSize: 14, marginBottom: 32, transition: 'color 0.3s ease' }}>Masuk menggunakan akun Rifinity Anda.</p>

          {/* Demo Quick Access */}
          <div style={{ marginBottom: 28 }}>
            <p className="demo-heading" style={{ color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.3s ease' }}>Quick Demo Access</p>
            <div className="demo-grid">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  className="demo-chip"
                  onClick={() => fillDemo(acc)}
                  style={{
                    background: `linear-gradient(135deg, ${acc.color}15, ${acc.color}08)`,
                    border: `1px solid ${acc.color}30`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: acc.color, marginBottom: 2 }}>{acc.label}</div>
                  <div className="demo-chip-desc" style={{ fontSize: 10, color: '#64748b', transition: 'color 0.3s ease' }}>{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <label className="login-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8, transition: 'color 0.3s ease' }}>Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#f1f5f9',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label className="login-label" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8, transition: 'color 0.3s ease' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#f1f5f9',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex',
                }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                color: '#f87171', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
              }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Memverifikasi...</> : 'Masuk ke Sistem'}
            </button>
          </form>

          <p className="demo-password-note" style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 1.6, transition: 'color 0.3s ease' }}>
            Default password akun demo: <strong style={{ color: 'inherit' }}>password123</strong>
          </p>
        </div>
      </div>

      {/* Premium Login Success Overlay */}
      <AnimatePresence>
        {successPopup && (
          <div className="login-success-overlay" style={{
            position: 'fixed', inset: 0, background: theme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(5, 8, 22, 0.85)',
            backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 99999, padding: '1.5rem'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              style={{
                background: theme === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.95)', 
                border: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2.5rem 2rem', borderRadius: '24px', maxWidth: '420px', width: '100%',
                boxShadow: theme === 'light' ? '0 20px 40px rgba(15, 23, 42, 0.12)' : '0 25px 50px -12px rgba(0, 0, 0, 0.6)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle size={32} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : 'white', marginBottom: '0.5rem' }}>Login Berhasil!</h3>
                <p style={{ fontSize: '0.95rem', color: theme === 'light' ? '#475569' : 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                  Selamat datang kembali di <strong style={{ color: '#6366f1' }}>Rifinity Logistik WMS</strong>. Menyiapkan sesi dashboard Anda...
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                <span className="dot-pulse-1" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                <span className="dot-pulse-2" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', margin: '0 4px' }}></span>
                <span className="dot-pulse-3" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Login Error Toast */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)',
              background: theme === 'light' ? '#fecaca' : 'rgba(239, 68, 68, 0.95)', 
              border: theme === 'light' ? '1px solid #f87171' : '1px solid rgba(239, 68, 68, 0.3)',
              padding: '1rem 1.5rem', borderRadius: '14px', zIndex: 99999,
              display: 'flex', alignItems: 'center', gap: '0.75rem', 
              color: theme === 'light' ? '#991b1b' : 'white',
              fontWeight: 600, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.25)',
              backdropFilter: 'blur(10px)', maxWidth: '90%', width: '380px'
            }}
          >
            <AlertCircle size={20} />
            <div style={{ flex: 1, fontSize: '0.875rem' }}>{errorPopup}</div>
            <button onClick={() => setErrorPopup('')} style={{ background: 'none', border: 'none', color: theme === 'light' ? '#991b1b' : 'white', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
