'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/components/LanguageProvider'
import { 
  Search, 
  Printer, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Truck, 
  User, 
  MapPin, 
  CreditCard, 
  History, 
  ArrowUpRight, 
  Inbox,
  AlertCircle
} from 'lucide-react'

export default function OutboundHistoryPage() {
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [totalAvailable, setTotalAvailable] = useState<number>(0)

  const [companyName, setCompanyName] = useState('PT. RIFINITY LOGISTIK GLOBAL')
  const [companyTagline, setCompanyTagline] = useState('Smart Warehousing & Integrated Supply Chain')
  const [companyAddress, setCompanyAddress] = useState('Jl. Raya Logistik No. 18, Jakarta Timur, Indonesia')
  const [companyPhone, setCompanyPhone] = useState('(021) 1234 5678')
  const [companyEmail, setCompanyEmail] = useState('info@rifinitylogistics.com')
  const [companyWeb, setCompanyWeb] = useState('www.rifinitylogistics.com')
  const [companyLogo, setCompanyLogo] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('rifinity_settings_company_name')
      if (savedName) setCompanyName(savedName)
      const savedTagline = localStorage.getItem('rifinity_settings_company_tagline')
      if (savedTagline) setCompanyTagline(savedTagline)
      const savedAddress = localStorage.getItem('rifinity_settings_company_address')
      if (savedAddress) setCompanyAddress(savedAddress)
      const savedPhone = localStorage.getItem('rifinity_settings_company_phone')
      if (savedPhone) setCompanyPhone(savedPhone)
      const savedEmail = localStorage.getItem('rifinity_settings_company_email')
      if (savedEmail) setCompanyEmail(savedEmail)
      const savedWeb = localStorage.getItem('rifinity_settings_company_web')
      if (savedWeb) setCompanyWeb(savedWeb)
      const savedLogo = localStorage.getItem('rifinity_settings_company_logo')
      if (savedLogo) setCompanyLogo(savedLogo)
    }

    fetch('/api/inventory')
      .then(res => res.json())
      .then(items => {
        if (Array.isArray(items)) {
          const sum = items.reduce((acc, item) => acc + item.quantity, 0)
          setTotalAvailable(sum)
        }
      })
      .catch(err => console.error(err))
  }, [])

  // Months lists
  const monthOptions = [
    { value: 'all', label: t('all_months') },
    { value: '11', label: t('december') },
    { value: '0', label: t('january') },
    { value: '1', label: t('february') },
    { value: '2', label: t('march') },
    { value: '3', label: t('april') },
    { value: '4', label: t('may') }
  ]

  const yearOptions = [
    { value: 'all', label: t('all_years') },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' }
  ]

  const fetchHistory = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedMonth !== 'all') params.append('month', selectedMonth)
    if (selectedYear !== 'all') params.append('year', selectedYear)
    if (search.trim() !== '') params.append('search', search)

    fetch(`/api/outbound-history?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTransactions(data)
        } else {
          setTransactions([])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setTransactions([])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchHistory()
  }, [selectedMonth, selectedYear])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchHistory()
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedMonth('all')
    setSelectedYear('2026')
  }

  // Calculate summary metrics for filtered dataset
  const totalPackages = transactions.reduce((acc, curr) => acc + curr.quantity, 0)
  const totalValue = transactions.reduce((acc, curr) => acc + curr.totalValue, 0)
  const totalShipping = transactions.reduce((acc, curr) => acc + (curr.shippingCost || 0), 0)
  const avgShipping = transactions.length > 0 ? Math.round(totalShipping / transactions.length) : 0

  const totalInternalValue = transactions.reduce((acc, curr) => acc + (curr.item?.owner === 'PT Rifinity Logistik' ? curr.totalValue : 0), 0)
  const totalClientValue = transactions.reduce((acc, curr) => acc + (curr.item?.owner !== 'PT Rifinity Logistik' ? curr.totalValue : 0), 0)

  const totalInternalPackages = transactions.reduce((acc, curr) => acc + (curr.item?.owner === 'PT Rifinity Logistik' ? curr.quantity : 0), 0)
  const totalClientPackages = transactions.reduce((acc, curr) => acc + (curr.item?.owner !== 'PT Rifinity Logistik' ? curr.quantity : 0), 0)

  // Grouped items quantity count for print-out audit summary
  const itemSummaryMap = transactions.reduce((acc: any, curr: any) => {
    const itemName = curr.item?.name || 'Unknown Item'
    const itemSku = curr.item?.sku || 'N/A'
    const key = `${itemName} (${itemSku})`
    acc[key] = (acc[key] || 0) + curr.quantity
    return acc
  }, {})

  const sortedItemSummary = Object.keys(itemSummaryMap)
    .map(key => ({ name: key, qty: itemSummaryMap[key] }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8) // Show top 8 for clean spacing

  // Find top courier choice
  const courierCounts = transactions.reduce((acc: any, curr: any) => {
    const name = curr.courierCode || 'Standard'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  
  let topCourier = '-'
  let maxCourierCount = 0
  Object.keys(courierCounts).forEach(key => {
    if (courierCounts[key] > maxCourierCount) {
      maxCourierCount = courierCounts[key]
      topCourier = key
    }
  })

  return (
    <div className="outbound-history-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Printable Header - Screen Hidden */}
      <div className="print-report-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #000000', paddingBottom: '12px', marginBottom: '16px' }}>
          {companyLogo ? (
            <img src={companyLogo} style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }} alt="Logo" />
          ) : (
            <div style={{ width: '45px', height: '45px', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '6px', fontSize: '18px', fontFamily: 'sans-serif' }}>
              {companyName ? companyName.charAt(0) : 'R'}
            </div>
          )}
          <div style={{ textAlign: 'right', flex: 1, marginLeft: '20px', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 2px 0', color: '#000000', textTransform: 'uppercase' }}>
              {companyName}
            </h1>
            <p style={{ fontSize: '8px', fontStyle: 'italic', margin: '0 0 3px 0', color: '#444444' }}>
              {companyTagline}
            </p>
            <p style={{ fontSize: '7.5px', margin: '0 0 2px 0', color: '#555555' }}>
              {companyAddress}
            </p>
            <p style={{ fontSize: '7.5px', margin: 0, color: '#555555' }}>
              Telp: {companyPhone} | Email: {companyEmail} | Web: {companyWeb}
            </p>
          </div>
        </div>
        
        {/* Document Title & Period */}
        <div style={{ textAlign: 'center', marginBottom: '16px', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', textDecoration: 'underline', color: '#000000' }}>
            {t('outbound_print_report_title')}
          </h2>
          <span style={{ fontSize: '8px', color: '#333333' }}>
            {t('print_period')}: <strong>{monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear === 'all' ? '' : selectedYear}</strong> | {t('print_date')}: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Dynamic side-by-side summary blocks for print */}
        <div style={{ display: 'flex', gap: '5%', marginBottom: '16px' }}>
          {/* Print Summary Metrics */}
          <div style={{ width: '48%' }}>
            <h3 style={{ fontSize: '9px', fontWeight: 900, borderBottom: '1px solid #000000', paddingBottom: '3px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{t('print_sec_1')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0' }}>{t('print_total_outbound_volume')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>{totalPackages} unit</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0 2px 10px', color: '#4b5563', fontSize: '7.5px' }}>↳ {t('print_internal_owned')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0', textAlign: 'right', color: '#4b5563', fontSize: '7.5px' }}>{totalInternalPackages} unit</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0 2px 10px', color: '#d97706', fontSize: '7.5px' }}>↳ {t('print_client_consigned')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0', textAlign: 'right', color: '#d97706', fontSize: '7.5px' }}>{totalClientPackages} unit</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0' }}>{t('print_total_goods_value')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>Rp {totalValue.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0 2px 10px', color: '#4b5563', fontSize: '7.5px' }}>↳ {t('print_internal_owned')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0', textAlign: 'right', color: '#4b5563', fontSize: '7.5px' }}>Rp {totalInternalValue.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0 2px 10px', color: '#d97706', fontSize: '7.5px' }}>↳ {t('print_client_assets')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '2px 0', textAlign: 'right', color: '#d97706', fontSize: '7.5px' }}>Rp {totalClientValue.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0' }}>{t('print_total_shipping_fees')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>Rp {totalShipping.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0' }}>{t('print_most_popular_courier')}</td>
                  <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase' }}>{topCourier} ({maxCourierCount} Resi)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grouped Item breakdown summary */}
          <div style={{ width: '48%' }}>
            <h3 style={{ fontSize: '9px', fontWeight: 900, borderBottom: '1px solid #000000', paddingBottom: '3px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{t('print_sec_2')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
              <tbody>
                {sortedItemSummary.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: '3px 0', color: '#777777' }}>{t('no_data')}</td></tr>
                ) : sortedItemSummary.map((item, i) => (
                  <tr key={i}>
                    <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</td>
                    <td style={{ borderBottom: '1px solid #dddddd', padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>{item.qty} unit</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <h3 className={!includeDetails ? 'print-hidden' : ''} style={{ fontSize: '9px', fontWeight: 900, borderBottom: '1px solid #000000', paddingBottom: '3px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{t('print_sec_3_outbound')}</h3>
      </div>

      {/* Screen Header Layout */}
      <header className="print-hidden screen-header-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={24} style={{ color: 'var(--primary)' }} />
            {t('outbound_history_report_title')}
          </h1>
          <p className="page-subtitle">{t('outbound_history_report_subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={includeDetails} 
              onChange={e => setIncludeDetails(e.target.checked)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            {t('pdf_include_details')}
          </label>
          <button 
            onClick={() => window.print()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)' }}
          >
            <Printer size={16} />
            {t('pdf_export_report')}
          </button>
        </div>
      </header>

      {/* Visual Analytics Mini Cards */}
      <div className="print-hidden stats-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t('total_packages_dispatched')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{totalPackages.toLocaleString('id-ID')} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>pcs</span></h3>
            <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
              <ArrowUpRight size={10} /> OUT
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('internal_owned')}:</span>
              <strong style={{ color: '#60a5fa' }}>{totalInternalPackages.toLocaleString('id-ID')} pcs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('client_consigned')}:</span>
              <strong style={{ color: '#fbbf24' }}>{totalClientPackages.toLocaleString('id-ID')} pcs</strong>
            </div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t('total_available_stock_realtime')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{totalAvailable.toLocaleString('id-ID')} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>pcs</span></h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('on_hand_stock')}</span>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t('total_distribution_value_valuation')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }}>Rp {totalValue.toLocaleString('id-ID')}</h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('total_goods')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('internal_owned')}:</span>
              <strong style={{ color: '#60a5fa' }}>Rp {totalInternalValue.toLocaleString('id-ID')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('client_consigned')}:</span>
              <strong style={{ color: '#fbbf24' }}>Rp {totalClientValue.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t('accumulated_shipping_cost')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>Rp {totalShipping.toLocaleString('id-ID')}</h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Pass-through</span>
          </div>
        </div>

        <div className="card glass" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t('most_popular_courier')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>{topCourier}</h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{maxCourierCount} {t('receipts')}</span>
          </div>
        </div>

      </div>

      {/* Dynamic Filter Controls Block */}
      <div className="card glass print-hidden" style={{ padding: '1.25rem' }}>
        <form className="filter-form-layout" onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', width: '100%' }}>
          
          {/* Keyword Search Input */}
          <div className="filter-search-input-wrapper" style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder={t('search_dispatch_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Month Selector */}
          <div className="filter-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '160px' }}>
            <Calendar size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{
                flex: 1, padding: '0.6rem', background: 'rgba(25, 30, 50, 0.95)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="filter-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px' }}>
            <Filter size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{
                flex: 1, padding: '0.6rem', background: 'rgba(25, 30, 50, 0.95)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              {yearOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Buttons action group */}
          <div className="filter-buttons-wrapper" style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            >
              {t('btn_search')}
            </button>
            <button 
              type="button" 
              onClick={handleResetFilters}
              style={{
                padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.85rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <RefreshCw size={14} />
              {t('btn_reset')}
            </button>
          </div>

        </form>
      </div>

      {/* Main Reports Results Table Card */}
      <div className="card glass printable-report-card responsive-table-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw className="spin" size={32} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.875rem' }}>{t('loading_outbound_history')}</span>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            <Inbox size={48} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{t('data_not_found')}</h3>
            <p style={{ fontSize: '0.8rem', maxWidth: '300px' }}>{t('empty_outbound_history_alert')}</p>
          </div>
        ) : (
          <table className={`printable-report-table ${!includeDetails ? 'print-hidden' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid rgba(255,255,255,0.08)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_time')}</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_item_detail')}</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_quantity')}</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_item_value')}</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_recipient_address')}</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_expedition_cost')}</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t('table_notes')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr 
                  key={tx.id} 
                  className="report-row"
                  style={{ 
                    borderBottom: idx < transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Timestamp */}
                  <td data-label={t('table_time')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                    <div className="td-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div>{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </div>
                  </td>

                  {/* Item Description */}
                  <td data-label={t('table_item_detail')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top' }}>
                    <div className="td-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>{tx.item?.name || 'Unknown Item'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginTop: '4px' }}>
                        {tx.item?.owner === 'PT Rifinity Logistik' ? (
                          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '4px', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.2)', whiteSpace: 'nowrap' }}>
                            Internal
                          </span>
                        ) : (
                          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '4px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', whiteSpace: 'nowrap' }}>
                            {t('consigned')}: {tx.item?.owner?.replace('PT ', '') || 'Klien'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                          SKU: <strong>{tx.item?.sku || 'N/A'}</strong>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                          {t('category_short')}: {tx.item?.category || 'General'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td data-label={t('table_quantity')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', textAlign: 'center' }}>
                    <div className="td-wrapper">
                      <span className="badge badge-secondary" style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {tx.quantity} {tx.item?.unit || 'pcs'}
                      </span>
                    </div>
                  </td>

                  {/* Goods Value */}
                  <td data-label={t('table_item_value')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', textAlign: 'right', fontWeight: 600, color: '#f87171', whiteSpace: 'nowrap' }}>
                    <div className="td-wrapper" style={{ fontWeight: 600, color: '#f87171' }}>
                      Rp {tx.totalValue.toLocaleString('id-ID')}
                    </div>
                  </td>

                  {/* Recipient Details */}
                  <td data-label={t('table_recipient_address')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    <div className="td-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'white' }}>
                        <User size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>{tx.recipient || 'Umum'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', color: 'rgba(255,255,255,0.5)', marginTop: '3px', lineHeight: '1.25' }}>
                        <MapPin size={11} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{tx.recipientAddr || t('address_not_written')}, <strong>{tx.recipientCity || 'Yogyakarta'}</strong></span>
                      </div>
                    </div>
                  </td>

                  {/* Expedition Details */}
                  <td data-label={t('table_expedition_cost')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', fontSize: '0.8rem' }}>
                    <div className="td-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'white' }}>
                        <Truck size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <span>{tx.courierName || 'Standard'}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {t('awb_receipt')}: <strong style={{ color: 'var(--primary)' }}>{tx.awbNumber || '-'}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600 }}>
                          🪙 Rp {(tx.shippingCost || 0).toLocaleString('id-ID')}
                        </span>
                        <span style={{ 
                          background: tx.paymentMethod === 'Non-Tunai' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', 
                          color: tx.paymentMethod === 'Non-Tunai' ? '#818cf8' : '#34d399', 
                          padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600 
                        }}>
                          {tx.paymentMethod === 'Non-Tunai' ? `📲 ${t('non_cash')}` : `💵 ${t('cash')}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Notes */}
                  <td data-label={t('table_notes')} style={{ padding: '0.85rem 0.5rem', verticalAlign: 'top', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', maxWidth: '120px', wordBreak: 'break-word' }}>
                    <div className="td-wrapper">
                      {tx.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Embedded print CSS configuration overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide sidebar, chat, and other screen-only components */
          .sidebar, .sidebar *, 
          .chat-container, .chat-container *, 
          header, header *, 
          .stats-grid, .stats-grid *,
          .card.glass:not(.printable-report-card),
          form, form *,
          .btn-primary,
          .print-hidden, .print-hidden * {
            display: none !important;
            visibility: hidden !important;
          }

          /* Reset main content margins for full-width print */
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          /* Root page container resets */
          .outbound-history-container {
            padding: 0 !important;
            gap: 0 !important;
            background: none !important;
          }

          /* Show the print-only report header */
          .print-report-header {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            color: #000000 !important;
          }
          
          .print-report-header * {
            visibility: visible !important;
            color: #000000 !important;
          }

          /* Table card styling resets */
          .card.glass.printable-report-card {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Detailed Table flowing naturally */
          .printable-report-table {
            display: table !important;
            visibility: visible !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
            color: #000000 !important;
            font-size: 8px !important;
          }

          .printable-report-table * {
            visibility: visible !important;
            color: #000000 !important;
          }

          /* Clean black borders for printable table */
          .printable-report-table th {
            border-bottom: 2px solid #000000 !important;
            color: #000000 !important;
            padding: 6px 4px !important;
            font-weight: bold !important;
            font-size: 8px !important;
          }

          .printable-report-table td {
            border-bottom: 1px solid #cccccc !important;
            padding: 6px 4px !important;
            color: #000000 !important;
            font-size: 7.5px !important;
          }

          .badge {
            border: 1px solid #000000 !important;
            padding: 1px 3px !important;
            font-weight: bold !important;
            background: none !important;
            color: #000000 !important;
          }
        }

        @media (max-width: 768px) {
          .screen-header-layout {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .screen-header-layout > div:last-child {
            width: 100% !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .screen-header-layout .btn-primary {
            width: 100% !important;
            justify-content: center !important;
          }
          .stats-grid-layout {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.75rem !important;
          }
          .filter-form-layout {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .filter-search-input-wrapper,
          .filter-select-wrapper {
            width: 100% !important;
            min-width: 100% !important;
          }
          .filter-buttons-wrapper {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 0.5rem !important;
          }
          .filter-buttons-wrapper button,
          .filter-buttons-wrapper div {
            flex: 1 !important;
            justify-content: center !important;
          }
          .filter-buttons-wrapper button {
            padding: 0.75rem !important;
          }
          .responsive-table-card {
            padding: 0.75rem !important;
          }
          .printable-report-table thead {
            display: none !important;
          }
          .printable-report-table,
          .printable-report-table tbody,
          .printable-report-table tr,
          .printable-report-table td {
            display: block !important;
            width: 100% !important;
          }
          .printable-report-table tr.report-row {
            background: rgba(255, 255, 255, 0.01) !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            border-radius: 12px !important;
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }
          .printable-report-table tr.report-row:last-child {
            margin-bottom: 0 !important;
          }
          .printable-report-table td {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            padding: 0.6rem 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            text-align: right !important;
            font-size: 0.85rem !important;
            white-space: normal !important;
            max-width: none !important;
            word-break: normal !important;
          }
          .printable-report-table td:last-child {
            border-bottom: none !important;
          }
          .printable-report-table td::before {
            content: attr(data-label) !important;
            font-weight: 600 !important;
            color: rgba(255, 255, 255, 0.45) !important;
            text-align: left !important;
            margin-right: 1.5rem !important;
            flex-shrink: 0 !important;
            font-size: 0.8rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
          }
          .light-mode .printable-report-table td::before {
            color: rgba(15, 23, 42, 0.6) !important;
          }
          .printable-report-table .td-wrapper {
            align-items: flex-end !important;
            text-align: right !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .stats-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}} />

    </div>
  )
}
