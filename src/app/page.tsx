'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import SearchToAction from '@/components/SearchToAction'
import DailyFlowChart from '@/components/DailyFlowChart'
import { useLanguage } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthGuard'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  { label: 'Total Items', value: '1,248', icon: Package, color: '#3b82f6', trend: '+12%', up: true },
  { label: 'Inbound Today', value: '42', icon: ArrowDownRight, color: '#10b981', trend: '+5%', up: true },
  { label: 'Outbound Today', value: '18', icon: ArrowUpRight, color: '#6366f1', trend: '-2%', up: false },
  { label: 'Low Stock Alerts', value: '7', icon: AlertTriangle, color: '#f59e0b', trend: 'High Priority', up: null },
]

export default function Dashboard() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  // Audit Logs states & fetchers
  const [activeTab, setActiveTab] = React.useState<'transactions' | 'audit'>('transactions')
  const [auditLogs, setAuditLogs] = React.useState<any[]>([])
  const [auditLoading, setAuditLoading] = React.useState(false)

  const fetchAuditLogs = () => {
    setAuditLoading(true)
    fetch('/api/audit-logs')
      .then(res => {
        if (!res.ok) throw new Error('Access denied or failed to load')
        return res.json()
      })
      .then(data => {
        setAuditLogs(data)
        setAuditLoading(false)
      })
      .catch(err => {
        console.error(err)
        setAuditLoading(false)
      })
  }

  // AI Stock Forecasting states & fetcher
  const [aiForecasts, setAiForecasts] = React.useState<any[]>([])
  const [aiForecastLoading, setAiForecastLoading] = React.useState(true)

  const fetchAiForecasts = () => {
    setAiForecastLoading(true)
    const savedPredictive = localStorage.getItem('rifinity_settings_wms_predictive_threshold') || '20'
    fetch(`/api/dashboard/ai-forecast?predictive=${savedPredictive}`)
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setAiForecasts(json)
        }
        setAiForecastLoading(false)
      })
      .catch(err => {
        console.error('Failed to load AI forecast:', err)
        setAiForecastLoading(false)
      })
  }

  React.useEffect(() => {
    if (activeTab === 'audit' && user?.role === 'MANAGER') {
      fetchAuditLogs()
    }
  }, [activeTab, user])

  React.useEffect(() => {
    setMounted(true)
    
    // Read dynamic WMS threshold settings from localStorage
    const savedCritical = localStorage.getItem('rifinity_settings_wms_critical_threshold') || '5'
    const savedPredictive = localStorage.getItem('rifinity_settings_wms_predictive_threshold') || '20'

    fetch(`/api/dashboard?critical=${savedCritical}&predictive=${savedPredictive}`)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
      
    fetchAiForecasts()
  }, [])

  const stats = (data && !data.error) ? [
    { label: t('total_items', 'Total Items'), value: (data.totalItems || 0).toLocaleString(), icon: Package, color: '#3b82f6', trend: t('overview', 'Overview'), up: true },
    { label: t('total_units', 'Total Units'), value: (data.totalUnits || 0).toLocaleString(), icon: ArrowDownRight, color: '#10b981', trend: t('wcc_in_warehouse', 'In Warehouse'), up: true },
    { label: t('critical_stock', 'Stok Kritis'), value: (data.criticalStock || 0).toString(), icon: AlertTriangle, color: '#f59e0b', trend: t('need_restock', 'Needs Restock'), up: false },
  ] : []

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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">{t('wcc_title', 'Warehouse Control Center')}</h1>
          <p className="page-subtitle">{t('wcc_subtitle', "Welcome back, Logistic Officer. Here's your warehouse status.")}</p>
        </div>
        <div className="current-date card glass">
          <Clock size={16} />
          <span>{mounted ? new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
        </div>
      </header>

      <SearchToAction />

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('wcc_loading', 'Memuat data dashboard...')}</div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                className="card stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}1a`, color: stat.color }}>
                  <stat.icon size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-value-row">
                    <h3 className="stat-value">{stat.value}</h3>
                    {stat.trend && (
                      <span className={`stat-trend ${stat.up === true ? 'up' : stat.up === false ? 'down' : 'neutral'}`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <motion.div className="card glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('total_expense_month', 'Total Pengeluaran (Bulan Ini)')}</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.totalExpense)}
                  </h2>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                  <CreditCard size={24} />
                </div>
              </div>
            </motion.div>
            
            <motion.div className="card glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('total_income_month', 'Total Pemasukan (Bulan Ini)')}</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.totalIncome)}
                  </h2>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                  <DollarSign size={24} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 30-Day Real-Time Area Chart */}
          {data.dailyData && data.dailyData.length > 0 && (
            <motion.div
              className="card glass"
              style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: '#6366f1' }} />
                {t('realtime_flow_chart', 'Arus Barang Real-Time (30 Hari Terakhir)')}
              </h3>
              <DailyFlowChart data={data.dailyData} />
            </motion.div>
          )}

          {/* Warehouse Performance Trend Chart */}
          {data.monthlyData && data.monthlyData.length > 0 && (
            <motion.div 
              className="card glass" 
              style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                {t('performance_trend_chart', 'Tren Arus Barang Gudang (6 Bulan Terakhir)')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(() => {
                  const allValues = data.monthlyData.flatMap((d: any) => [d.inbound, d.outbound]);
                  const globalMax = Math.max(...allValues, 1);
                  
                  return data.monthlyData.map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{d.month}</span>
                        <span style={{ opacity: 0.7 }}>
                          📥 In: <strong style={{ color: '#60a5fa' }}>{d.inbound.toLocaleString()}</strong> | 📤 Out: <strong style={{ color: '#f472b6' }}>{d.outbound.toLocaleString()}</strong>
                        </span>
                      </div>
                      {/* Inbound Bar */}
                      <div style={{ background: 'rgba(128,128,128,0.1)', borderRadius: '4px', height: '8px', position: 'relative' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: ((d.inbound / (globalMax * 1.1)) * 100) + '%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ 
                            position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '4px',
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                          }} 
                        />
                      </div>
                      {/* Outbound Bar */}
                      <div style={{ background: 'rgba(128,128,128,0.1)', borderRadius: '4px', height: '6px', position: 'relative' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: ((d.outbound / (globalMax * 1.1)) * 100) + '%' }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          style={{ 
                            position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '4px',
                            background: 'linear-gradient(90deg, #ec4899, #f472b6)'
                          }} 
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', display: 'inline-block' }} /> {t('inbound_masuk', 'Inbound (Masuk)')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(90deg, #ec4899, #f472b6)', display: 'inline-block' }} /> {t('outbound_keluar', 'Outbound (Keluar)')}
                </span>
              </div>
            </motion.div>
          )}

          <div className="dashboard-grid">
            {/* Left Column Stacked Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Panel 1: Original Static Predictive Restock Alert */}
              <section className="card glass predictive-section dashboard-predictive">
                <div className="section-header">
                  <TrendingUp size={20} className="text-primary" />
                  <h3>{t('predictive_restock_alert', 'Predictive Restock Alert')}</h3>
                </div>
                <div className="prediction-list">
                  {loading ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>Memuat data stok kritis...</div>
                  ) : (!data.predictiveAlerts || data.predictiveAlerts.length === 0) ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{t('all_stock_healthy', 'Semua stok dalam kondisi aman atau data tidak tersedia.')}</p>
                  ) : (
                    data.predictiveAlerts.map((item: any) => (
                      <div key={item.id} className="prediction-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="prediction-info">
                          <strong>{item.name}</strong>
                          <span>{t('only_left', 'Tersisa hanya')} {item.quantity} {item.unit}</span>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => router.push(`/docs?action=order&item=${encodeURIComponent(item.name)}&owner=${encodeURIComponent(item.owner || 'PT Rifinity Logistik')}`)}>{t('order_now', 'Pesan Sekarang')}</button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Panel 2: AI Fast-Moving — compact scrollable rows */}
              <section className="card glass dashboard-fastmoving">
                <div className="section-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <TrendingUp size={18} style={{ color: '#ec4899', flexShrink: 0 }} />
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>
                    Barang Terlaris
                    <span style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 7px', borderRadius: '100px', fontWeight: 600, border: '1px solid rgba(96,165,250,0.18)', marginLeft: '6px', verticalAlign: 'middle' }}>🔮 AI Fast-Moving</span>
                  </h3>
                </div>

                {/* Scrollable list capped via flex: 1 inside capped height container */}
                <div className="fastmoving-list">
                  {aiForecastLoading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} style={{ height: '52px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }} className="animate-pulse" />
                    ))
                  ) : aiForecasts.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Belum ada data pergerakan barang.</p>
                  ) : (
                    aiForecasts.map((item: any) => {
                      const days = item.daysRemaining;
                      const badge = days === null
                        ? { label: 'Stabil', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.08)' }
                        : days <= 3
                          ? { label: `🚨 ${days}h`, bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' }
                          : days <= 7
                            ? { label: `⚠️ ${days}h`, bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' }
                            : { label: `🟢 ${days}h`, bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' };

                      return (
                        <div
                          key={item.itemId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.6rem 0.875rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize: '0.71rem', color: 'rgba(255,255,255,0.4)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.supplier || 'Supplier Umum'} · <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{item.quantity} {item.unit}</strong> · {item.dailyOutflow}/hari
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
                              {badge.label}
                            </span>
                            <button
                              className="btn-primary btn-sm"
                              style={{ padding: '3px 9px', fontSize: '0.7rem', borderRadius: '6px', whiteSpace: 'nowrap' }}
                              onClick={() => router.push(`/docs?action=order&item=${encodeURIComponent(item.name)}&owner=${encodeURIComponent(item.supplier || 'PT Rifinity Logistik')}`)}
                            >
                              Pesan
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Recommendation hint for top fastest-moving item only */}
                {!aiForecastLoading && aiForecasts.length > 0 && aiForecasts[0].recommendation && (
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>💡</span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#93c5fd', lineHeight: '1.45' }}>
                      <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{aiForecasts[0].name}:</strong>{' '}{aiForecasts[0].recommendation}
                    </p>
                  </div>
                )}

                {/* Color legend */}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.625rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, alignSelf: 'center' }}>Keterangan:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: '#f87171' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block', flexShrink: 0 }} />
                    Kritis ≤ 3 hari
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: '#fbbf24' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', flexShrink: 0 }} />
                    Siaga ≤ 7 hari
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: '#34d399' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', flexShrink: 0 }} />
                    Aman &gt; 7 hari
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-block', flexShrink: 0 }} />
                    Stabil (tidak bergerak)
                  </span>
                </div>
              </section>

            </div>

            <section className="card glass recent-activity dashboard-recent">
              <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} className="text-secondary" />
                  <h3 style={{ margin: 0 }}>{t('recent_activity', 'Aktivitas Terbaru')}</h3>
                </div>
                
                {/* Tab Switcher for Manager */}
                {user?.role === 'MANAGER' && (
                  <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px' }}>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: activeTab === 'transactions' ? 'var(--primary)' : 'none',
                        color: activeTab === 'transactions' ? 'white' : 'rgba(255,255,255,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Transaksi
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: activeTab === 'audit' ? 'var(--primary)' : 'none',
                        color: activeTab === 'audit' ? 'white' : 'rgba(255,255,255,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Log Staf
                    </button>
                  </div>
                )}
              </div>

              {activeTab === 'transactions' ? (
                <div className="activity-list" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {(!data.recentActivity || data.recentActivity.length === 0) ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>{t('no_recent_activity', 'Tidak ada aktivitas terbaru.')}</p>
                  ) : (
                    data.recentActivity.map((tx: any) => (
                      <div key={tx.id} className="activity-item">
                        <div className="activity-point" style={{ backgroundColor: tx.type === 'IN' ? '#3b82f6' : '#ec4899' }}></div>
                        <div className="activity-content">
                          <p><strong>{tx.type}:</strong> {tx.type === 'IN' ? t('received', 'Received') : t('dispatched', 'Dispatched')} {tx.quantity} {t('units_of', 'units of')} &quot;{tx.item?.name}&quot; {tx.notes ? `(${tx.notes})` : ''}</p>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{new Date(tx.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="activity-list" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {auditLoading ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>Memuat log aktivitas staf...</div>
                  ) : (!auditLogs || auditLogs.length === 0) ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>Belum ada log aktivitas staf terdaftar.</p>
                  ) : (
                    auditLogs.map((log: any) => {
                      const badge = getActionBadge(log.action);
                      return (
                        <div key={log.id} className="activity-item" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '1.25rem', marginTop: '2px', flexShrink: 0 }}>
                            {badge.icon}
                          </div>
                          <div className="activity-content" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                              <strong style={{ fontSize: '0.85rem' }}>{log.name}</strong>
                              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                                {log.role}
                              </span>
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: badge.color, color: badge.text, fontWeight: 600 }}>
                                {badge.label}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.825rem', opacity: 0.9, lineHeight: '1.4', color: 'rgba(255,255,255,0.85)' }}>
                              {log.details}
                            </p>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                              {new Date(log.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
