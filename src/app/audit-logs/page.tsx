'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Search, Shield, Filter, Clock, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthGuard'
import { motion } from 'framer-motion'

export default function AuditLogsPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch('/api/audit-logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'MANAGER') {
      fetchLogs()
    }
  }, [user])

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AUTH_LOGIN':
        return { label: 'Login', color: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', icon: '🔑' };
      case 'ITEM_CREATE':
        return { label: 'Tambah Barang', color: 'rgba(16, 185, 129, 0.15)', text: '#34d399', icon: '📦' };
      case 'ITEM_ACTIVATE':
        return { label: 'Aktivasi Barang', color: 'rgba(52, 211, 153, 0.15)', text: '#34d399', icon: '🟢' };
      case 'ITEM_DEACTIVATE':
        return { label: 'Nonaktifkan', color: 'rgba(239, 68, 68, 0.15)', text: '#f87171', icon: '🔴' };
      case 'ITEM_UPDATE':
        return { label: 'Ubah Lokasi', color: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', icon: '📍' };
      case 'TRANSACTION_IN':
        return { label: 'Inbound', color: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', icon: '📥' };
      case 'TRANSACTION_OUT':
        return { label: 'Outbound', color: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', icon: '📤' };
      case 'USER_PROFILE_UPDATE':
        return { label: 'Ubah Profil', color: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', icon: '👤' };
      case 'SYSTEM_BRAND_UPDATE':
        return { label: 'Kop/Branding', color: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', icon: '🏢' };
      default:
        return { label: 'Sistem', color: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255,255,255,0.7)', icon: '⚙️' };
    }
  }

  // Filter logs based on search and action dropdown
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
      
    if (filterAction === 'ALL') return matchesSearch;
    return matchesSearch && log.action === filterAction;
  })

  // Block non-authorized roles
  if (user && user.role !== 'MANAGER') {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="card glass" style={{ maxWidth: '450px', margin: '0 auto', padding: '2.5rem' }}>
          <Shield size={48} style={{ color: '#ef4444', marginBottom: '1.25rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Akses Ditolak</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Halaman log aktivitas staf hanya dapat diakses oleh **Manager** sistem.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={28} className="text-secondary" />
            Log Aktivitas Staf
          </h1>
          <p className="page-subtitle">Rincian audit trail terpusat atas seluruh tindakan operasional sistem WMS.</p>
        </div>
        <button 
          onClick={() => fetchLogs(true)} 
          disabled={refreshing}
          className="btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1.5s linear infinite' : 'none' }} />
          {refreshing ? 'Menyegarkan...' : 'Segarkan'}
        </button>
      </header>

      {/* Control panel: Search and Filters */}
      <div className="card glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Cari nama staf, username, atau detail tindakan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
            <Filter size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Semua Tindakan</option>
              <option value="AUTH_LOGIN">Login</option>
              <option value="ITEM_CREATE">Tambah Barang</option>
              <option value="ITEM_ACTIVATE">Aktivasi Barang</option>
              <option value="ITEM_DEACTIVATE">Nonaktifkan Barang</option>
              <option value="ITEM_UPDATE">Ubah Lokasi</option>
              <option value="TRANSACTION_IN">Inbound</option>
              <option value="TRANSACTION_OUT">Outbound</option>
              <option value="USER_PROFILE_UPDATE">Ubah Profil</option>
              <option value="SYSTEM_BRAND_UPDATE">Kop/Branding</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Memuat log aktivitas...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="card glass" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Tidak ada log aktivitas staf yang sesuai dengan kriteria filter Anda.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="card glass desktop-only-table" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Waktu</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Staf / Pengguna</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Kategori Aksi</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Detail Rincian Aktivitas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <motion.tr 
                        key={log.id} 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* Waktu */}
                        <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={12} />
                            <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        
                        {/* Staf */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div>
                            <strong style={{ display: 'block', color: 'white' }}>{log.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>@{log.username} • {log.role}</span>
                          </div>
                        </td>
                        
                        {/* Kategori Badge */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.3rem',
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            background: badge.color, 
                            color: badge.text, 
                            fontWeight: 600,
                            fontSize: '0.75rem' 
                          }}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        
                        {/* Detail */}
                        <td style={{ padding: '1rem 1.25rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>
                          {log.details}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="mobile-only-logs">
            {filteredLogs.map((log, i) => {
              const badge = getActionBadge(log.action);
              return (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="mobile-audit-card glass" 
                >
                  {/* Top Header: Badge and Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem',
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      background: badge.color, 
                      color: badge.text, 
                      fontWeight: 600,
                      fontSize: '0.7rem' 
                    }}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                      <Clock size={11} />
                      <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Staf Profile info block */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.65rem', width: '100%' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #60a5fa)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                      {log.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'white', display: 'block' }}>{log.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>@{log.username} • {log.role}</span>
                    </div>
                  </div>

                  {/* Log Rincian Details */}
                  <div style={{ width: '100%', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.45', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', boxSizing: 'border-box' }}>
                    {log.details}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
