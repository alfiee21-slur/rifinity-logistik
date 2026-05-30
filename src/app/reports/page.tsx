'use client'

import React from 'react'
import { FileText, TrendingUp, TrendingDown, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthGuard'

const monthlyData = [
  { month: 'Jan', inbound: 240, outbound: 180 },
  { month: 'Feb', inbound: 310, outbound: 220 },
  { month: 'Mar', inbound: 280, outbound: 290 },
  { month: 'Apr', inbound: 420, outbound: 350 },
  { month: 'Mei', inbound: 380, outbound: 310 },
]

export default function ReportsPage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [selectedMonth, selectedYear])

  const handleExportPDF = () => {
    if (!data) return;

    // Load corporate branding details from localStorage
    const savedName = localStorage.getItem('rifinity_settings_company_name') || 'PT. RIFINITY LOGISTIK GLOBAL'
    const savedTagline = localStorage.getItem('rifinity_settings_company_tagline') || 'Smart Warehouse & Digital Logistics Solutions'
    const savedAddress = localStorage.getItem('rifinity_settings_company_address') || 'Jl. Tekno Logistik No. 88, Kawasan Industri Modern, Jakarta 12340'
    const savedPhone = localStorage.getItem('rifinity_settings_company_phone') || '(021) 8899-7711'
    const savedEmail = localStorage.getItem('rifinity_settings_company_email') || 'support@rifinitylogistik.co.id'
    const savedWeb = localStorage.getItem('rifinity_settings_company_web') || 'www.rifinitylogistik.co.id'
    const savedLogo = localStorage.getItem('rifinity_settings_company_logo') || ''

    // Load dynamic signature of the logged-in user who executes this report
    const savedSig = user ? localStorage.getItem(`rifinity_signature_${user.username}`) : null
    const savedScale = user ? localStorage.getItem(`rifinity_signature_scale_${user.username}`) : null
    const scale = savedScale ? parseFloat(savedScale) / 100 : 1.0

    const finalHeight = Math.round(75 * scale)
    const finalWidth = Math.round(170 * scale)
    const containerHeight = Math.round(80 * scale)

    const roleLabel = user?.role === 'MANAGER' ? 'Warehouse Manager'
      : user?.role === 'ADMIN' ? 'Warehouse Admin'
      : user?.role === 'FINANCE' ? 'Finance Officer'
      : 'Warehouse Operator'

    // Build unified corporate logo (either custom base64 image or high-quality vector fallbacks)
    let logoHtml = `
      <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="#3b82f6" />
        <path d="M18 22L32 14L46 22V42L32 50L18 42V22Z" stroke="white" stroke-width="3" stroke-linejoin="round" />
        <path d="M32 14V32M32 32L18 22M32 32L46 22M32 32V50" stroke="white" stroke-width="2.5" stroke-linejoin="round" opacity="0.85" />
      </svg>
    `
    if (savedLogo) {
      logoHtml = `<img src="${savedLogo}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px;" />`
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const monthNamesIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const currentMonthName = monthNamesIndo[selectedMonth];
    const currentYear = selectedYear;

    const now = new Date();
    const formattedDate = `${now.getDate()} ${monthNamesIndo[now.getMonth()]} ${now.getFullYear()}`;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Laporan Bulanan WMS - ${currentMonthName} ${currentYear}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Inter', 'Arial', sans-serif;
              color: #1e293b;
              background: #fff;
              line-height: 1.4;
              font-size: 9pt;
            }
            table.print-layout {
              width: 100%;
              border-collapse: collapse;
            }
            .header-spacer {
              height: 3.5cm;
            }
            .footer-spacer {
              height: 2.2cm;
            }
            .header-content {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 3.5cm;
              padding: 1.0cm 2.0cm 0 2.0cm;
              background: white;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              z-index: 9999;
            }
            .footer-content {
              position: fixed;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 2.2cm;
              padding: 0.4cm 2.0cm 0.8cm 2.0cm;
              background: white;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8pt;
              color: #64748b;
              z-index: 9999;
            }
            .main-content {
              padding: 0.3cm 2.0cm 0.5cm 2.0cm;
            }
            .double-line {
              border-top: 1.5px solid #000;
              border-bottom: 0.5px solid #000;
              height: 3px;
              margin-top: 0.2cm;
              width: 100%;
            }
            .doc-title {
              font-size: 12pt;
              font-weight: 700;
              text-align: center;
              color: #0f172a;
              margin-top: 0.6cm;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .period-text {
              font-size: 8.5pt;
              text-align: center;
              color: #475569;
              margin-bottom: 0.6cm;
            }
            .section-title {
              font-size: 9pt;
              font-weight: 700;
              color: #1e3a8a;
              margin-top: 0.4cm;
              margin-bottom: 0.25cm;
              text-transform: uppercase;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 2px;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.5cm;
              font-size: 8pt;
            }
            .report-table th {
              background: #f8fafc;
              color: #334155;
              font-weight: 600;
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            .report-table td {
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
              color: #334155;
            }
            .sign-block {
              display: flex;
              justify-content: space-between;
              width: 100%;
              font-size: 8.5pt;
              margin-top: 1.2cm;
              page-break-inside: avoid;
            }
            .sign-col {
              width: 45%;
            }
          </style>
        </head>
        <body>
          <table class="print-layout">
            <thead>
              <tr>
                <td>
                  <div class="header-spacer"></div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="main-content">
                    <h1 class="doc-title">LAPORAN ANALISIS OPERASIONAL & KEUANGAN BULANAN</h1>
                    <div class="period-text">Periode Laporan: ${currentMonthName} ${currentYear}</div>
                    
                    <h3 class="section-title">I. RINGKASAN KINERJA OPERASIONAL GUDANG</h3>
                    <table class="report-table">
                      <thead>
                        <tr>
                          <th>Indikator Kinerja Utama (KPI)</th>
                          <th style="text-align: right;">Capaian Bulanan</th>
                          <th>Keterangan / Satuan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Total Volume Inbound (Barang Masuk)</td>
                          <td style="text-align: right; font-weight: bold;">${data.summary.totalInbound.toLocaleString()}</td>
                          <td>Unit Fisik Terdaftar</td>
                        </tr>
                        <tr>
                          <td>Total Volume Outbound (Barang Keluar)</td>
                          <td style="text-align: right; font-weight: bold;">${data.summary.totalOutbound.toLocaleString()}</td>
                          <td>Unit Fisik Terdistribusi</td>
                        </tr>
                        <tr>
                          <td>Rata-rata Penanganan Harian</td>
                          <td style="text-align: right; font-weight: bold;">${data.summary.averageDaily.toLocaleString()}</td>
                          <td>Unit / Hari Kalender</td>
                        </tr>
                        <tr>
                          <td>Rasio Perputaran Persediaan (Turnover)</td>
                          <td style="text-align: right; font-weight: bold;">${data.summary.turnover}</td>
                          <td>Frekuensi Putaran Stok</td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 class="section-title">II. NERACA FINANSIAL & BIAYA OPERASIONAL</h3>
                    <table class="report-table">
                      <thead>
                        <tr>
                          <th>Pos Keuangan Pergudangan</th>
                          <th style="text-align: right;">Nilai Nominal (Rupiah)</th>
                          <th>Keterangan Analisis</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Belanja Pengadaan Barang (Expense)</td>
                          <td style="text-align: right; font-weight: bold; color: #dc2626;">Rp ${(data.summary.totalExpense || 0).toLocaleString('id-ID')}</td>
                          <td>Pembelian persediaan barang milik internal PT</td>
                        </tr>
                        <tr>
                          <td>Hasil Penjualan Barang Internal</td>
                          <td style="text-align: right; font-weight: bold; color: #16a34a;">Rp ${(data.summary.internalSales || 0).toLocaleString('id-ID')}</td>
                          <td>Omzet penjualan ritel internal PT</td>
                        </tr>
                        <tr>
                          <td>Pendapatan Layanan Fulfillment 3PL</td>
                          <td style="text-align: right; font-weight: bold; color: #16a34a;">Rp ${(data.summary.fulfillmentRevenue || 0).toLocaleString('id-ID')}</td>
                          <td>Biaya penanganan packaging & sewa space klien</td>
                        </tr>
                        <tr>
                          <td>Total Pemasukan Operasional (Income)</td>
                          <td style="text-align: right; font-weight: bold; color: #16a34a;">Rp ${(data.summary.totalIncome || 0).toLocaleString('id-ID')}</td>
                          <td>Penjualan Internal + Layanan Jasa 3PL</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                          <td style="font-weight: bold;">Margin Keuntungan Bersih (Net Operating Margin)</td>
                          <td style="text-align: right; font-weight: bold; color: ${data.summary.netProfit >= 0 ? '#16a34a' : '#dc2626'}">
                            Rp ${(data.summary.netProfit || 0).toLocaleString('id-ID')}
                          </td>
                          <td style="font-weight: bold; color: ${data.summary.netProfit >= 0 ? '#16a34a' : '#dc2626'}">
                            ${data.summary.netProfit >= 0 ? 'OPERASIONAL LABA (SURPLUS)' : 'OPERASIONAL DEFISIT (RUGI)'}
                          </td>
                        </tr>
                        <tr>
                          <td>Nilai Aset Stok Gudang (PT)</td>
                          <td style="text-align: right; font-weight: bold; color: #1e3a8a;">Rp ${(data.summary.totalAssetValuation || 0).toLocaleString('id-ID')}</td>
                          <td>Nilai modal barang fisik di atas rak</td>
                        </tr>
                        <tr>
                          <td>Nilai Barang Titipan (Klien 3PL)</td>
                          <td style="text-align: right; font-weight: bold; color: #d97706;">Rp ${(data.summary.clientAssetValuation || 0).toLocaleString('id-ID')}</td>
                          <td>Estimasi nilai perlindungan asuransi gudang</td>
                        </tr>
                        <tr>
                          <td>Total Ongkos Kirim Logistik (Expedition Cost)</td>
                          <td style="text-align: right; font-weight: bold; color: #7c3aed;">Rp ${(data.summary.totalShippingCost || 0).toLocaleString('id-ID')}</td>
                          <td>Biaya logistik pengiriman via kurir ekspedisi</td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 class="section-title">III. ANALISIS TREN PRODUK TERAKTIF (TOP 5 ITEMS)</h3>
                    <table class="report-table">
                      <thead>
                        <tr>
                          <th>Nama Produk / Barang</th>
                          <th style="text-align: right;">Total Aktivitas Transaksi</th>
                          <th>Status Penanganan</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${data.topItems.map((item: any) => `
                          <tr>
                            <td>${item.name}</td>
                            <td style="text-align: right; font-weight: bold;">${item.moves} kali</td>
                            <td>Sangat Aktif (Fast Moving)</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <div class="sign-block">
                      <div class="sign-col">
                        <p style="margin: 0; color: #444;">Dilaporkan Oleh,</p>
                        <p style="margin: 2px 0 0 0; font-weight: bold; color: #111;">${savedName}</p>
                        <div style="height: ${containerHeight}px; display: flex; align-items: center; justify-content: flex-start; margin: 10px 0; overflow: visible;">
                          ${savedSig
                            ? `<img src="${savedSig}" style="max-height: ${finalHeight}px; max-width: ${finalWidth}px; object-fit: contain; transform: scale(${scale}); transform-origin: left center;" />`
                            : `<div style="height: 1px; border-bottom: 1.5px solid #555; width: 150px; margin: 55px 0 0 0;"></div>`
                          }
                        </div>
                        <p style="text-decoration: underline; margin: 0; font-weight: bold; color: #111;">${user?.name || 'Arif Asisten Logistik'}</p>
                        <p style="font-size: 8pt; color: #555; margin: 2px 0 0 0;">${roleLabel}</p>
                      </div>
                      <div class="sign-col" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                        <p style="margin: 0; color: #444;">Mengetahui & Menyetujui,</p>
                        <p style="margin: 2px 0 0 0; font-weight: bold; color: #111;">Direktur ${savedName.replace('PT. ', '')}</p>
                        <div style="height: ${containerHeight}px; display: flex; align-items: center; justify-content: flex-end; margin: 10px 0;">
                          <div style="height: 1px; border-bottom: 1.5px solid #555; width: 150px; margin: 55px 0 0 0;"></div>
                        </div>
                        <p style="text-decoration: underline; margin: 0; font-weight: bold; color: #111;">Operational & Financial Director</p>
                        <p style="font-size: 8pt; color: #555; margin: 2px 0 0 0;">Direktur Utama</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div class="footer-spacer"></div>
                </td>
              </tr>
            </tfoot>
          </table>

          <div class="header-content">
            <div style="width: 100%; border-bottom: 3px double #3b82f6; padding-bottom: 12px; margin-bottom: 25px; font-family: 'Inter', 'Arial', sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border: none; border-collapse: collapse; margin: 0; background: transparent;">
                <tr style="border: none; background: transparent;">
                  <td style="width: 60px; border: none; padding: 0; vertical-align: middle; background: transparent;">
                    ${logoHtml}
                  </td>
                  <td style="border: none; padding: 0 0 0 15px; vertical-align: middle; text-align: left; background: transparent; font-family: 'Inter', 'Arial', sans-serif;">
                    <h1 style="margin: 0; font-size: 14pt; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">${savedName}</h1>
                    <p style="margin: 2px 0 6px 0; font-size: 8.5pt; font-weight: 600; color: #3b82f6; letter-spacing: 0.3px; text-transform: uppercase; font-style: italic;">${savedTagline}</p>
                    <p style="margin: 0; font-size: 7.5pt; color: #475569; line-height: 1.4;">
                      ${savedAddress}<br/>
                      Telp: ${savedPhone} | Email: ${savedEmail} | Web: ${savedWeb}
                    </p>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div class="footer-content">
            <span>Sistem Informasi WMS - ${savedName}</span>
            <span>Dicetak otomatis pada: ${formattedDate}</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (loading || !data) {
    return <div className="page-container" style={{ padding: '2rem', textAlign: 'center' }}>Loading reports data...</div>
  }

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .reports-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .financial-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .financial-sec-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 1.25rem;
        }
        .financial-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .reports-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .top-active-items-list {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.75rem !important;
          width: 100% !important;
        }
        .reports-actions-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .reports-date-selectors {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 1024px) {
          .reports-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .financial-cards-grid,
          .financial-sec-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 0.75rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .page-container .card {
            padding: 0.875rem !important;
          }
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.875rem !important;
            margin-bottom: 1.25rem !important;
            width: 100% !important;
          }
          .reports-actions-bar {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
          }
          .reports-date-selectors {
            width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            gap: 0.5rem !important;
          }
          .reports-date-selectors select {
            flex: 1 !important;
            min-width: 0 !important;
            width: 100% !important;
            padding: 0.4rem 1.5rem 0.4rem 0.5rem !important;
            font-size: 0.75rem !important;
            border-radius: 6px !important;
            background-position: right 0.4rem center !important;
            background-size: 1em !important;
          }
          .reports-actions-bar button {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.45rem 1rem !important;
            font-size: 0.8rem !important;
            border-radius: 6px !important;
          }
          
          .reports-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
            margin-bottom: 1.25rem !important;
          }
          .reports-stats-grid .card {
            padding: 0.65rem 0.75rem !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 0.75rem !important;
          }
          .reports-stats-grid .card > div:first-child {
            width: 34px !important;
            height: 34px !important;
            border-radius: 8px !important;
          }
          .reports-stats-grid .card > div:first-child svg {
            width: 16px !important;
            height: 16px !important;
          }
          .reports-stats-grid .card p:nth-child(1) {
            font-size: 0.7rem !important;
          }
          .reports-stats-grid .card p:nth-child(2) {
            font-size: 1.15rem !important;
            margin-top: 1px !important;
          }
          .reports-stats-grid .card p:nth-child(3) {
            font-size: 0.68rem !important;
          }
          
          .financial-cards-grid,
          .financial-sec-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .financial-cards-grid > div,
          .financial-sec-grid > div {
            padding: 0.875rem !important;
            gap: 0.35rem !important;
          }
          .financial-value {
            font-size: 1.15rem !important;
          }
          .income-subdetails {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }

          .reports-charts-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
        }
      `}} />

      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{t('financial_reports_title', 'Laporan Keuangan & Kinerja')}</h1>
          <p className="page-subtitle">{t('financial_reports_desc', 'Analisis laba rugi operasional, perputaran stok, dan nilai aset pergudangan.')}</p>
        </div>
        
        <div className="reports-actions-bar">
          <div className="reports-date-selectors">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ 
                background: 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '0.5rem 1.8rem 0.5rem 1rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'></polyline></svg>")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em'
              }}
            >
              {(language === 'id' ? [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ] : [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ]).map((m, idx) => (
                <option key={idx} value={idx} style={{ background: '#0b1329', color: 'white' }}>{m}</option>
              ))}
            </select>
   
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ 
                background: 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '0.5rem 1.8rem 0.5rem 1rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'></polyline></svg>")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em'
              }}
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} style={{ background: '#0b1329', color: 'white' }}>{yr}</option>
              ))}
            </select>
          </div>
 
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExportPDF}>
            <FileText size={18} />
            {t('export_pdf', 'Export PDF')}
          </button>
        </div>
      </header>
 
      <div className="reports-stats-grid">
        {[
          { label: t('total_inbound', 'Total Inbound'), value: data.summary.totalInbound.toLocaleString(), icon: ArrowDownRight, color: '#10b981', trend: t('units', 'units') },
          { label: t('total_outbound', 'Total Outbound'), value: data.summary.totalOutbound.toLocaleString(), icon: ArrowUpRight, color: '#6366f1', trend: t('units', 'units') },
          { label: t('daily_average', 'Rata-rata Harian'), value: data.summary.averageDaily.toLocaleString(), icon: Package, color: '#3b82f6', trend: t('units_per_day', 'unit/hari') },
          { label: t('inventory_turnover', 'Inventory Turnover'), value: data.summary.turnover, icon: TrendingUp, color: '#f59e0b', trend: t('per_month', 'per bulan') },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: stat.color + '1a', color: stat.color
            }}>
              <stat.icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</p>
              <p style={{ fontSize: '0.75rem', color: stat.color }}>{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* Warehouse Financial Analytics Panel */}
      <div className="card glass" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#60a5fa' }} />
          {t('financial_analysis', 'Analisis Finansial Pergudangan')}
        </h3>
        
        <div className="financial-cards-grid">
          {/* Expense Card */}
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(239, 68, 68, 0.7)', fontWeight: 500 }}>{t('expense_label', 'Belanja Pengadaan Barang (Expense)')}</span>
            <span className="financial-value" style={{ color: '#f87171' }}>
              Rp {(data.summary.totalExpense || 0).toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('expense_desc', 'Hanya mencakup pembelian barang milik internal PT')}</span>
          </div>
 
          {/* Income Card */}
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(16, 185, 129, 0.7)', fontWeight: 500 }}>{t('income_label', 'Total Pemasukan Operasional (Income)')}</span>
            <span className="financial-value" style={{ color: '#34d399' }}>
              Rp {(data.summary.totalIncome || 0).toLocaleString('id-ID')}
            </span>
            <div className="income-subdetails" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>{t('internal_sales', 'Jual Internal')}: <strong>Rp {data.summary.internalSales.toLocaleString('id-ID')}</strong></span>
              <span>{t('fulfillment_services', 'Jasa 3PL')}: <strong>Rp {data.summary.fulfillmentRevenue.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>
 
          {/* Net Profit Card */}
          <div style={{ 
            background: data.summary.netProfit >= 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            border: data.summary.netProfit >= 0 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: data.summary.netProfit >= 0 ? 'rgba(96, 165, 250, 0.8)' : 'rgba(248, 113, 113, 0.8)', 
              fontWeight: 500 
            }}>
              {t('net_profit_label', 'Margin Keuntungan Bersih (Laba/Rugi)')}
            </span>
            <span className="financial-value" style={{ color: data.summary.netProfit >= 0 ? '#60a5fa' : '#f87171' }}>
              Rp {(data.summary.netProfit || 0).toLocaleString('id-ID')}
            </span>
            <span style={{ 
              fontSize: '0.7rem', fontWeight: 600,
              color: data.summary.netProfit >= 0 ? '#34d399' : '#f87171' 
            }}>
              {data.summary.netProfit >= 0 ? t('status_surplus', '✓ STATUS SURPLUS (LABA OPERASIONAL)') : t('status_deficit', '✗ STATUS DEFISIT (RUGI OPERASIONAL)')}
            </span>
          </div>
        </div>
 
        {/* Secondary row for stock valuation and courier costs */}
        <div className="financial-sec-grid">
          {/* Internal Stock Valuation */}
          <div style={{ 
            background: 'rgba(96, 165, 250, 0.03)', border: '1px solid rgba(96, 165, 250, 0.12)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(96, 165, 250, 0.7)', fontWeight: 500 }}>{t('warehouse_asset_valuation', 'Nilai Aset Stok Gudang (PT)')}</span>
            <span className="financial-value" style={{ color: '#60a5fa' }}>
              Rp {(data.summary.totalAssetValuation || 0).toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('warehouse_asset_desc', 'Total nilai modal barang fisik di atas rak')}</span>
          </div>
 
          {/* Client Stock Insurance Valuation */}
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.12)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(245, 158, 11, 0.7)', fontWeight: 500 }}>{t('client_asset_valuation', 'Nilai Barang Titipan (Klien 3PL)')}</span>
            <span className="financial-value" style={{ color: '#fbbf24' }}>
              Rp {(data.summary.clientAssetValuation || 0).toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('client_asset_desc', 'Penting untuk perhitungan asuransi klaim gudang')}</span>
          </div>
 
          {/* Shipping Cost Expenditures */}
          <div style={{ 
            background: 'rgba(167, 139, 250, 0.03)', border: '1px solid rgba(167, 139, 250, 0.12)',
            borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(167, 139, 250, 0.7)', fontWeight: 500 }}>{t('total_shipping_cost_label', 'Total Ongkos Kirim Logistik')}</span>
            <span className="financial-value" style={{ color: '#c084fc' }}>
              Rp {(data.summary.totalShippingCost || 0).toLocaleString('id-ID')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{t('total_shipping_cost_desc', 'Akumulasi biaya pengiriman via ekspedisi')}</span>
          </div>
        </div>
      </div>
 
      <div className="reports-charts-grid">
        <div className="card glass">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('inbound_outbound_trend', 'Tren Inbound vs Outbound (6 Bulan Terakhir)')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(() => {
              const allValues = data.monthlyData.flatMap((d: any) => [d.inbound, d.outbound]);
              const globalMax = Math.max(...allValues, 1);
              
              return data.monthlyData.map((d: any, i: number) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{d.month}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>In: {d.inbound} | Out: {d.outbound}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '4px',
                      width: ((d.inbound / (globalMax * 1.1)) * 100) + '%', background: 'var(--accent)', opacity: 0.8 
                    }} />
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px', marginTop: '3px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '4px',
                      width: ((d.outbound / (globalMax * 1.1)) * 100) + '%', background: 'var(--secondary)', opacity: 0.6 
                    }} />
                  </div>
                </div>
              ));
            })()}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} /> Inbound
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--secondary)', display: 'inline-block' }} /> Outbound
            </span>
          </div>
        </div>
 
        <div className="card glass">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('top_active_items', 'Top Barang Paling Aktif')}</h3>
          <div className="top-active-items-list">
            {data.topItems.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{t('no_transaction_data', 'Belum ada data transaksi.')}</p>
            ) : data.topItems.map((item: any, i: number) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '1rem' }}>{item.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{item.moves} {t('transactions', 'transaksi')}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '6px' }}>
                  <div style={{ 
                    width: item.pct + '%', height: '100%', borderRadius: '4px',
                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
