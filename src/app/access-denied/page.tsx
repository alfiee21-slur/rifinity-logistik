'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldX, Lock } from 'lucide-react'

export default function AccessDeniedPage() {
  const router = useRouter()
  const [isLoggedOut, setIsLoggedOut] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('rifinity_theme') || 'dark'
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode')
      } else {
        document.documentElement.classList.remove('light-mode')
      }

      // Detect if user has been logged out (by auto-lock or manual expiration)
      const userStr = localStorage.getItem('rifinity_user')
      setIsLoggedOut(!userStr)
    }
  }, [])

  return (
    <div className="denied-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        
        .denied-page-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.1) 0%, transparent 60%), linear-gradient(135deg, #0a0f1a 0%, #0d1425 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          transition: background 0.3s ease;
          padding: 20px;
        }

        .denied-card {
          animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          text-align: center;
          padding: 64px 56px;
          background: rgba(15,20,40,0.8);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 28px;
          backdrop-filter: blur(20px);
          max-width: 480px;
          width: 100%;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .denied-icon { animation: float 4s ease-in-out infinite; }
        .action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.3) !important; }

        .denied-title {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }

        .denied-desc {
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 40px;
          transition: color 0.3s ease;
        }

        @media (max-width: 480px) {
          .denied-card {
            padding: 40px 24px;
          }
        }

        /* Light Mode CSS Overrides */
        .light-mode .denied-page-wrapper {
          background: radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.08) 0%, transparent 60%), linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
        }

        .light-mode .denied-card {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: rgba(239, 68, 68, 0.25) !important;
          box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.08) !important;
        }

        .light-mode .denied-title {
          color: #0f172a !important;
        }

        .light-mode .denied-desc {
          color: #475569 !important;
        }
      `}</style>

      <div className="denied-card">
        <div className="denied-icon" style={{ marginBottom: 32, display: 'inline-block' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 70%)',
            border: '2px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <ShieldX size={44} color="#ef4444" />
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 100, padding: '4px 14px', marginBottom: 20,
        }}>
          <Lock size={12} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>403 — AKSES DITOLAK</span>
        </div>

        <h1 className="denied-title">
          Anda Tidak Berwenang
        </h1>
        <p className="denied-desc">
          {isLoggedOut
            ? 'Sesi Anda telah berakhir demi keamanan karena tidak ada aktivitas. Silakan masuk kembali.'
            : 'Halaman yang Anda coba akses memerlukan peran yang lebih tinggi. Hubungi administrator sistem untuk mendapatkan izin akses.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isLoggedOut ? (
            <button
              className="action-btn"
              onClick={() => router.push('/login')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 36px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
              }}
            >
              Login Kembali
            </button>
          ) : (
            <button
              className="action-btn"
              onClick={() => router.push('/')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 36px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
              }}
            >
              Ke Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
