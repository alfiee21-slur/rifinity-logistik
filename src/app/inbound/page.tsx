'use client'

import React, { useState } from 'react'
import { PackagePlus, Sparkles, CheckCircle, Camera, FileText, X, Printer, Wifi, Info, Bluetooth, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAndSendTelegramAlert } from '@/lib/telegram'
import ContactAutocomplete from '@/components/ContactAutocomplete'
import { 
  WebBluetoothPrinterManager, 
  EscPosParser, 
  generateStockLabelEscPos, 
  BluetoothPrinterState, 
  SimulatedLine 
} from '@/lib/bluetoothPrinter'

// Highly realistic vector Code 128 / Code 39 Barcode Generator SVG
function BarcodeSVG({ value }: { value: string }) {
  return (
    <svg width="180" height="42" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="32" fill="white" />
      {/* Dynamic looking black vertical bar configurations */}
      <rect x="3" y="2" width="1.5" height="21" fill="black" />
      <rect x="5" y="2" width="0.5" height="21" fill="black" />
      <rect x="6.5" y="2" width="2" height="21" fill="black" />
      <rect x="9.5" y="2" width="1" height="21" fill="black" />
      <rect x="11" y="2" width="0.5" height="21" fill="black" />
      <rect x="12.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="15" y="2" width="0.5" height="21" fill="black" />
      <rect x="16" y="2" width="2" height="21" fill="black" />
      <rect x="19" y="2" width="1.5" height="21" fill="black" />
      <rect x="21" y="2" width="0.5" height="21" fill="black" />
      <rect x="22" y="2" width="1" height="21" fill="black" />
      <rect x="24" y="2" width="2" height="21" fill="black" />
      <rect x="27" y="2" width="0.5" height="21" fill="black" />
      <rect x="28.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="31" y="2" width="1" height="21" fill="black" />
      <rect x="33" y="2" width="0.5" height="21" fill="black" />
      <rect x="34.5" y="2" width="2.5" height="21" fill="black" />
      <rect x="38" y="2" width="1" height="21" fill="black" />
      <rect x="40" y="2" width="0.5" height="21" fill="black" />
      <rect x="41.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="44" y="2" width="2" height="21" fill="black" />
      <rect x="47" y="2" width="0.5" height="21" fill="black" />
      <rect x="48.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="51" y="2" width="1" height="21" fill="black" />
      <rect x="53" y="2" width="0.5" height="21" fill="black" />
      <rect x="54.5" y="2" width="2" height="21" fill="black" />
      <rect x="57.5" y="2" width="1" height="21" fill="black" />
      <rect x="59" y="2" width="0.5" height="21" fill="black" />
      <rect x="60.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="63" y="2" width="0.5" height="21" fill="black" />
      <rect x="64" y="2" width="2" height="21" fill="black" />
      <rect x="67" y="2" width="1.5" height="21" fill="black" />
      <rect x="69" y="2" width="0.5" height="21" fill="black" />
      <rect x="70" y="2" width="1" height="21" fill="black" />
      <rect x="72" y="2" width="2" height="21" fill="black" />
      <rect x="75" y="2" width="0.5" height="21" fill="black" />
      <rect x="76.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="79" y="2" width="1" height="21" fill="black" />
      <rect x="81" y="2" width="0.5" height="21" fill="black" />
      <rect x="82.5" y="2" width="2.5" height="21" fill="black" />
      <rect x="86" y="2" width="1" height="21" fill="black" />
      <rect x="88" y="2" width="0.5" height="21" fill="black" />
      <rect x="89.5" y="2" width="1.5" height="21" fill="black" />
      <rect x="92" y="2" width="2" height="21" fill="black" />
      <rect x="95" y="2" width="0.5" height="21" fill="black" />
      <rect x="96.5" y="2" width="2.5" height="21" fill="black" />
      <text x="50" y="29" fontFamily="monospace" fontSize="5" textAnchor="middle" fill="black" fontWeight="bold">
        {value}
      </text>
    </svg>
  )
}

// Category-to-zone allocation mapping helper for high logistical realism
function getRackLocation(category: string, sku: string) {
  const cat = (category || '').toLowerCase().trim();
  let zone = 'A';
  let rack = '01';
  
  if (cat.includes('packaging')) {
    zone = 'P';
    rack = '03';
  } else if (cat.includes('fashion') || cat.includes('sepatu') || cat.includes('baju')) {
    zone = 'F';
    rack = '12';
  } else if (cat.includes('cosmetic') || cat.includes('skincare') || cat.includes('makeup')) {
    zone = 'C';
    rack = '08';
  } else if (cat.includes('food') || cat.includes('arabica') || cat.includes('coffee') || cat.includes('makanan')) {
    zone = 'B';
    rack = '04';
  } else {
    // Generate a quick hash rack location based on SKU letters
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash += sku.charCodeAt(i);
    }
    zone = String.fromCharCode(65 + (hash % 6)); // A - F
    rack = String(1 + (hash % 15)).padStart(2, '0'); // 01 - 15
  }
  
  return `ZONA-${zone} / RAK-${rack}`;
}

export default function InboundPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    itemName: '',
    sku: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    buyPrice: '',
    sellPrice: '',
    supplier: '',
    notes: '',
    owner: 'PT Rifinity Logistik',
    rackLocation: '',
    location: 'Utama',
  })
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  
  // Stock Bin Barcode States
  const [activeBarcodeData, setActiveBarcodeData] = useState<any>(null)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

  // Bluetooth Thermal Printing State Management
  const [btManager, setBtManager] = useState<WebBluetoothPrinterManager | null>(null)
  const [btState, setBtState] = useState<BluetoothPrinterState>('disconnected')
  const [btError, setBtError] = useState<string>('')
  const [simulatedReceiptLines, setSimulatedReceiptLines] = useState<SimulatedLine[]>([])
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [printTab, setPrintTab] = useState<'system' | 'bluetooth'>('system')

  // Premium Confirmation Popup State
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

  // Initialize Web Bluetooth Printer Manager
  React.useEffect(() => {
    const manager = new WebBluetoothPrinterManager((state, errorMsg) => {
      setBtState(state)
      if (errorMsg) {
        setBtError(errorMsg)
      } else {
        setBtError('')
      }
    })
    setBtManager(manager)

    return () => {
      if (manager) manager.disconnect()
    }
  }, [])

  const handleConnectSimulator = async () => {
    if (!btManager) return
    try {
      await btManager.connectSimulator()
      showNotification('Berhasil terhubung ke Simulator Printer WMS!', 'success')
      setShowSimulator(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConnectRealBluetooth = async () => {
    if (!btManager) return
    try {
      await btManager.connectRealDevice()
      showNotification('Berhasil terhubung ke Printer Bluetooth!', 'success')
    } catch (e: any) {
      const isCancelled = e.name === 'NotFoundError' || e.message?.includes('cancelled')
      if (!isCancelled) {
        console.error('Koneksi printer Bluetooth gagal:', e)
      } else {
        console.log('Koneksi Bluetooth dibatalkan oleh pengguna.')
      }
    }
  }

  const handleDisconnectPrinter = () => {
    if (btManager) {
      btManager.disconnect()
      showNotification('Koneksi printer diputuskan.', 'success')
      setShowSimulator(false)
      setSimulatedReceiptLines([])
    }
  }

  const handleBluetoothPrint = async () => {
    if (!btManager || !activeBarcodeData) return
    
    const state = btManager.getState()
    if (state === 'disconnected') {
      showNotification('Silakan hubungkan printer (Simulator/Bluetooth) terlebih dahulu.', 'error')
      return
    }

    try {
      // Prepare label data
      const labelData = {
        name: activeBarcodeData.item?.name || 'Unknown Item',
        sku: activeBarcodeData.item?.sku || 'SKU-UNKNOWN',
        quantity: activeBarcodeData.quantity,
        unit: activeBarcodeData.item?.unit || 'pcs',
        owner: activeBarcodeData.item?.owner || 'PT Rifinity Logistik',
        location: activeBarcodeData.item?.location || 'Utama',
        rackLocation: getRackLocation(activeBarcodeData.item?.category || 'General', activeBarcodeData.item?.sku || '')
      }

      const bytes = generateStockLabelEscPos(labelData)

      if (state === 'connected_sim') {
        setIsSimulatingPrint(true)
        setSimulatedReceiptLines([])
        
        // Parse bytes for simulator
        const parsed = EscPosParser.parse(bytes)
        
        let lineIndex = 0
        const interval = setInterval(() => {
          if (lineIndex < parsed.length) {
            setSimulatedReceiptLines(prev => [...prev, parsed[lineIndex]])
            lineIndex++
          } else {
            clearInterval(interval)
            setIsSimulatingPrint(false)
            showNotification('Simulator selesai mencetak label!', 'success')
          }
        }, 150)
      } else {
        await btManager.print(bytes)
        showNotification('Label berhasil dicetak ke Printer!', 'success')
      }
    } catch (err: any) {
      console.error(err)
      showNotification('Gagal mencetak label: ' + err.message, 'error')
    }
  }
  
  // Real Inbound Document AI States
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchHistory = () => {
    fetch('/api/transactions?type=IN')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data)
        } else {
          console.error('Data received is not an array:', data)
          setHistory([])
        }
      })
      .catch(err => console.error('Error fetching history:', err))
  }

  React.useEffect(() => {
    fetchHistory()
  }, [])

  // Smart Dynamic suggestions for Rack Location
  React.useEffect(() => {
    if (formData.category || formData.sku) {
      setFormData(prev => {
        // Auto calculate only if it's currently empty
        if (!prev.rackLocation) {
          return {
            ...prev,
            rackLocation: getRackLocation(prev.category, prev.sku)
          }
        }
        return prev
      })
    }
  }, [formData.category, formData.sku])

  const handleAiExtract = async () => {
    if (!selectedImage || !imageFile) {
      showNotification(t('inbound_upload_err'), 'error')
      return
    }

    setIsLoading(true)
    setAiSuggestion('')
    
    try {
      const base64Data = selectedImage.split(',')[1]
      const mimeType = imageFile.type

      // Load WMS AI Logistics settings from localStorage
      const savedModel = localStorage.getItem('rifinity_settings_ai_model') || 'gemini-1.5-flash'
      const savedCreativity = localStorage.getItem('rifinity_settings_ai_creativity') || '0.2'
      const savedCustomContext = localStorage.getItem('rifinity_settings_ai_custom_context') || ''
      const savedStrict = localStorage.getItem('rifinity_settings_ai_strict') || 'true'
      const savedOptMode = localStorage.getItem('rifinity_settings_ai_opt_mode') || 'Balanced'
      const savedDocLang = localStorage.getItem('rifinity_settings_ai_doc_lang') || 'ID'
      const savedCompliance = localStorage.getItem('rifinity_settings_ai_compliance') || 'true'

      const res = await fetch('/api/inbound/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64Data, 
          mimeType,
          model: savedModel,
          temperature: parseFloat(savedCreativity),
          systemInstruction: savedCustomContext,
          cleanPreamble: savedStrict === 'true',
          optimizationStrategy: savedOptMode,
          documentLanguage: savedDocLang,
          complianceCheck: savedCompliance === 'true'
        })
      })

      if (!res.ok) throw new Error('API extraction failed')
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Deterministic sell price: only use AI's value if explicitly found in document (> 0)
      // Otherwise, calculate from buy price with a fixed 30% margin for consistency
      const extractedBuyPrice = Number(data.buyPrice) || 0
      const extractedSellPrice = Number(data.sellPrice) || 0
      const finalSellPrice = extractedSellPrice > 0
        ? extractedSellPrice
        : extractedBuyPrice > 0
          ? Math.round(extractedBuyPrice * 1.3)
          : 0

      setFormData({
        itemName: data.itemName || '',
        sku: data.sku || '',
        category: data.category || '',
        quantity: String(data.quantity || ''),
        unit: data.unit || 'pcs',
        buyPrice: String(extractedBuyPrice),
        sellPrice: String(finalSellPrice),
        supplier: data.supplier || '',
        notes: `AI Extract - ${new Date().toLocaleDateString('id-ID')} WIB`,
        owner: data.owner || 'PT Rifinity Logistik',
        rackLocation: getRackLocation(data.category || '', data.sku || ''),
        location: 'Utama'
      })

      const sellPriceNote = extractedSellPrice > 0
        ? 'Harga jual diambil dari dokumen.'
        : extractedBuyPrice > 0
          ? `Harga jual dihitung otomatis (margin 30% = Rp ${finalSellPrice.toLocaleString('id-ID')}).`
          : 'Harga jual perlu diisi manual.'

      setAiSuggestion(`${t('inbound_ai_success_msg')} Owner: ${data.owner || 'PT Rifinity Logistik'}. ${sellPriceNote}`)

      showNotification(t('inbound_extract_success'), 'success')
    } catch (err: any) {
      console.error(err)
      showNotification(t('inbound_extract_fail'), 'error')
      setAiSuggestion(t('inbound_extract_fail'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestActionConfirm(
      'Konfirmasi Registrasi Inbound',
      `Apakah Anda yakin ingin mendaftarkan masuk barang "${formData.itemName}" sejumlah ${formData.quantity} ${formData.unit} ke dalam sistem WMS?`,
      () => executeSubmit()
    )
  }

  const executeSubmit = async () => {
    try {
      const rackLocation = formData.rackLocation || getRackLocation(formData.category, formData.sku)
      
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rackLocation,
          type: 'IN',
        })
      })
      
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      
      setSubmitted(true)
      showNotification('Inbound barang berhasil didaftarkan!', 'success')
      
      // Auto check and trigger Telegram Alert if below threshold
      if (data.item) {
        checkAndSendTelegramAlert(data.item)
      }
      setFormData({ itemName: '', sku: '', category: '', quantity: '', unit: 'pcs', buyPrice: '', sellPrice: '', supplier: '', notes: '', owner: 'PT Rifinity Logistik', rackLocation: '', location: 'Utama' })
      setAiSuggestion('')
      fetchHistory()
      
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      showNotification('Gagal menyimpan pendaftaran inbound barang.', 'error')
    }
  }

  return (
    <div className="page-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              padding: '1rem 1.5rem',
              background: notification.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 9999,
              fontWeight: 500
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="dashboard-header">
        <div>
          <h1 className="page-title">{t('smart_inbound')}</h1>
          <p className="page-subtitle">{t('smart_inbound_subtitle')}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        <form onSubmit={handleSubmit} className="card glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <PackagePlus size={20} className="text-primary" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('inbound_form_title')}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('table_item_name')}</label>
              <input value={formData.itemName} onChange={e => setFormData(p => ({ ...p, itemName: e.target.value }))} placeholder="Bubble Wrap..." required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('table_sku')}</label>
              <input value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} placeholder="BW-50M-001" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('table_category')}</label>
              <input value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="Packaging Material" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('table_owner')}</label>
              <input value={formData.owner} onChange={e => setFormData(p => ({ ...p, owner: e.target.value }))} placeholder="PT Rifinity Logistik atau Nama Klien..." required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <ContactAutocomplete
                type="SUPPLIER"
                value={formData.supplier}
                onChange={val => setFormData(p => ({ ...p, supplier: val }))}
                onSelect={contact => setFormData(p => ({ ...p, supplier: contact.name }))}
                label={t('table_supplier')}
                id="inbound-supplier"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('qty_and_unit')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} placeholder="100" required style={{ flex: 2 }} />
                <select 
                  value={formData.unit} 
                  onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, padding: '0.75rem' }}
                >
                  <option value="pcs" style={{ background: '#1a1b2e', color: 'white' }}>pcs</option>
                  <option value="roll" style={{ background: '#1a1b2e', color: 'white' }}>roll</option>
                  <option value="box" style={{ background: '#1a1b2e', color: 'white' }}>box</option>
                  <option value="kg" style={{ background: '#1a1b2e', color: 'white' }}>kg</option>
                  <option value="liter" style={{ background: '#1a1b2e', color: 'white' }}>liter</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('buy_price_unit')}</label>
              <input type="number" value={formData.buyPrice} onChange={e => setFormData(p => ({ ...p, buyPrice: e.target.value }))} placeholder="Rp 0" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('sell_price_unit')}</label>
              <input type="number" value={formData.sellPrice} onChange={e => setFormData(p => ({ ...p, sellPrice: e.target.value }))} placeholder="Rp 0" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('rack_location')}</label>
              <input value={formData.rackLocation} onChange={e => setFormData(p => ({ ...p, rackLocation: e.target.value }))} placeholder="e.g. ZONA-B / RAK-04" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('warehouse_location')}</label>
              <input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Utama" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('notes_label')}</label>
              <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Kondisi barang, nomor PO, dll..." rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {submitted ? `✓ ${t('saved_successfully')}` : t('save_inbound')}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('ai_doc_reader')}</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
              {t('ai_doc_reader_desc')}
            </p>
            <div 
              style={{ 
                border: '2px dashed rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                padding: selectedImage ? '0.5rem' : '2rem', 
                textAlign: 'center',
                marginBottom: '1rem',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '160px',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s'
              }} 
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              {selectedImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '140px' }}>
                  <img 
                    src={selectedImage} 
                    alt="Document preview" 
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px' }} 
                  />
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.95)', color: 'white',
                      padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)', cursor: 'pointer'
                    }}
                  >
                    <X size={12} /> {t('remove')}
                  </div>
                </div>
              ) : (
                <>
                  <Camera size={32} style={{ margin: '0 auto 0.5rem', color: 'rgba(255,255,255,0.3)' }} />
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {t('click_to_upload_doc')}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>
                    {t('doc_types_sub')}
                  </p>
                </>
              )}
            </div>
            <button onClick={handleAiExtract} className="btn-primary" style={{ width: '100%' }} disabled={isLoading || !selectedImage}>
              {isLoading ? (
                <span>{t('extract_loading')}</span>
              ) : (
                <><Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{t('extract_with_ai')}</>
              )}
            </button>
            {aiSuggestion && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(16,185,129,0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: '0.875rem',
                  color: '#10b981'
                }}
              >
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {aiSuggestion}
              </motion.div>
            )}
          </div>

          <div className="card glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <FileText size={20} style={{ color: 'var(--secondary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('recent_inbound')}</h3>
            </div>
            {(!Array.isArray(history) || history.length === 0) ? (
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{t('no_data')}</p>
            ) : history.slice(0, 5).map((item, i) => (
              <div key={item.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0', 
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}>
                <div style={{ flex: 1, marginRight: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.item?.name || 'Unknown Item'}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>
                    SKU: {item.item?.sku || 'N/A'} | {item.item?.category || 'General'}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
                    {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-success" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {item.quantity} {item.item?.unit || 'pcs'}
                  </span>
                  <button
                    onClick={() => {
                      setActiveBarcodeData(item);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="btn-secondary btn-sm"
                    style={{
                      padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--accent)',
                      borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.2)'
                      e.currentTarget.style.borderColor = 'var(--accent)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'
                    }}
                  >
                    <Printer size={12} />
                    {t('table_label')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Bin Barcode Label Print Modal */}
      <AnimatePresence>
        {isBarcodeModalOpen && activeBarcodeData && (
          <div className="print-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5, 8, 22, 0.75)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem'
          }}>
            <motion.div 
              className="print-modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '2rem', borderRadius: '16px', 
                maxWidth: printTab === 'bluetooth' && showSimulator ? '800px' : '450px', 
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                transition: 'max-width 0.3s ease-in-out'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Printer size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('preview_rack_barcode')}</h3>
                </div>
                <button 
                  onClick={() => setIsBarcodeModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab Selector: PDF System vs Bluetooth */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', padding: '3px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setPrintTab('system');
                    setShowSimulator(false);
                  }}
                  style={{
                    padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: printTab === 'system' ? 'var(--primary)' : 'transparent',
                    color: printTab === 'system' ? '#0b1329' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  Sistem PDF (A6/Browser)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTab('bluetooth')}
                  style={{
                    padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: printTab === 'bluetooth' ? 'var(--primary)' : 'transparent',
                    color: printTab === 'bluetooth' ? '#0b1329' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  Bluetooth Thermal
                </button>
              </div>

              {printTab === 'system' ? (
                <>
                  <div className="print-label-paper" style={{
                    background: '#ffffff', color: '#000000', border: '2px solid #000000',
                    borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column',
                    gap: '6px', fontFamily: 'monospace', boxSizing: 'border-box'
                  }}>
                    {/* Header branding */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #000000', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.5px' }}>RIFINITY WMS - STOCK LABEL</span>
                      <span style={{ fontSize: '7px', fontWeight: 900, background: '#000000', color: '#ffffff', padding: '1px 3px', borderRadius: '2px' }}>INBOUND</span>
                    </div>

                    {/* SKU Barcode */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                      <BarcodeSVG value={activeBarcodeData.item?.sku || 'SKU-UNKNOWN'} />
                    </div>

                    {/* Item metadata details */}
                    <div style={{ fontSize: '8px', borderTop: '1.5px solid #000000', paddingTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('table_item_name').toUpperCase()}: <strong style={{ fontSize: '9px' }}>{activeBarcodeData.item?.name || 'Unknown Item'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t('table_owner').toUpperCase()}: <strong>{activeBarcodeData.item?.owner || 'PT Rifinity Logistik'}</strong></span>
                        <span>{t('qty_and_unit').split('&')[0].trim().toUpperCase()}: <strong>{activeBarcodeData.quantity} {activeBarcodeData.item?.unit || 'pcs'}</strong></span>
                      </div>
                      
                      {/* Rack Location Section */}
                      <div style={{ 
                        marginTop: '2px', padding: '3px', background: '#000000', color: '#ffffff', 
                        fontWeight: 900, textAlign: 'center', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.5px'
                      }}>
                        {t('table_location').toUpperCase()}: {getRackLocation(activeBarcodeData.item?.category || 'General', activeBarcodeData.item?.sku || '')}
                      </div>
                    </div>
                  </div>

                  {/* Print Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => setIsBarcodeModalOpen(false)}
                      className="btn-cancel"
                      style={{
                        flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white',
                        fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      onClick={() => requestActionConfirm(
                        'Konfirmasi Cetak Sistem',
                        `Apakah Anda yakin ingin mencetak label inbound untuk SKU ${activeBarcodeData?.item?.sku || ''} menggunakan printer sistem?`,
                        () => window.print()
                      )}
                      className="btn-primary"
                      style={{
                        flex: 1.5, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'var(--accent)'
                      }}
                    >
                      <Printer size={16} />
                      {t('print_rack_barcode')}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: showSimulator ? '1.1fr 0.9fr' : '1fr', gap: '1.5rem', alignItems: 'start', transition: 'all 0.3s' }}>
                  {/* Bluetooth Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Status Printer:</span>
                        <span style={{
                          fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                          background: btState === 'connected_real' ? 'rgba(52,211,153,0.12)' : btState === 'connected_sim' ? 'rgba(59,130,246,0.12)' : btState === 'connecting' ? 'rgba(245,158,11,0.12)' : btState === 'printing' ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                          color: btState === 'connected_real' ? '#34d399' : btState === 'connected_sim' ? 'var(--primary)' : btState === 'connecting' ? 'var(--warning)' : btState === 'printing' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${btState === 'connected_real' ? 'rgba(52,211,153,0.18)' : btState === 'connected_sim' ? 'rgba(59,130,246,0.18)' : btState === 'connecting' ? 'rgba(245,158,11,0.18)' : btState === 'printing' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.06)'}`
                        }}>
                          {btState === 'connected_real' ? '● TERHUBUNG (BLUETOOTH)' : btState === 'connected_sim' ? '● TERHUBUNG (SIMULATOR)' : btState === 'connecting' ? '⚡ MENGHUBUNGKAN...' : btState === 'printing' ? '🔄 MENCETAK...' : '○ TERPUTUS'}
                        </span>
                      </div>

                      {btError && (
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--danger)', fontSize: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{btError}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {btState === 'disconnected' ? (
                          <>
                            <button
                              type="button"
                              onClick={handleConnectSimulator}
                              style={{
                                width: '100%', padding: '0.6rem', border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: '8px', background: 'rgba(59,130,246,0.05)', color: 'var(--primary)',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                              }}
                            >
                              <Wifi size={14} />
                              <span>Koneksi Simulator WMS</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={handleConnectRealBluetooth}
                              style={{
                                width: '100%', padding: '0.6rem', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'white',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                              }}
                            >
                              <Bluetooth size={14} />
                              <span>Koneksi Printer Bluetooth Asli</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleDisconnectPrinter}
                            style={{
                              width: '100%', padding: '0.6rem', border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: '8px', background: 'rgba(239,68,68,0.05)', color: 'var(--danger)',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Putuskan Koneksi Printer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Specs info */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontWeight: 600, color: 'white', marginBottom: '0.1rem' }}>Informasi Cetak Thermal ESC/POS:</span>
                      <div>• Driver: <strong>Web Bluetooth GATT Serial Write</strong></div>
                      <div>• Format Barcode: <strong>Standard Code 128 (SKU)</strong></div>
                      <div>• Ukuran Roll Kertas: <strong>58mm / 80mm Autowidth</strong></div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <button 
                        type="button"
                        onClick={() => setIsBarcodeModalOpen(false)}
                        className="btn-cancel"
                        style={{
                          flex: 1, padding: '0.65rem', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white',
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {t('cancel')}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => requestActionConfirm(
                          'Konfirmasi Cetak Thermal',
                          `Apakah Anda yakin ingin mengirim perintah cetak label inbound SKU ${activeBarcodeData?.item?.sku || ''} ke printer thermal?`,
                          () => handleBluetoothPrint()
                        )}
                        disabled={btState === 'disconnected' || btState === 'connecting' || isSimulatingPrint}
                        style={{
                          flex: 1.8, padding: '0.65rem', borderRadius: '8px',
                          background: btState === 'disconnected' || btState === 'connecting' || isSimulatingPrint ? 'rgba(255,255,255,0.03)' : 'var(--primary)',
                          color: btState === 'disconnected' || btState === 'connecting' || isSimulatingPrint ? 'rgba(255,255,255,0.15)' : '#0b1329',
                          border: 'none', fontWeight: 700, cursor: btState === 'disconnected' ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s'
                        }}
                      >
                        <Bluetooth size={15} />
                        <span>{isSimulatingPrint ? 'Mencetak...' : 'Cetak via Bluetooth'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Thermal Printer Simulator */}
                  {showSimulator && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Virtual Thermal Printer:</span>
                        {isSimulatingPrint && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600 }}>
                            ⚡ MENCETAK ROLL...
                          </span>
                        )}
                      </div>

                      <div className="simulator-printer-box">
                        <div className="simulator-printer-slot" />
                        
                        <div className="simulator-paper-feed">
                          {simulatedReceiptLines.length === 0 ? (
                            <div style={{ display: 'flex', height: '100%', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888888', fontSize: '9px', textAlign: 'center', padding: '1.25rem', gap: '0.4rem' }}>
                              <Wifi size={20} style={{ opacity: 0.3 }} />
                              <span>Printer Simulator Aktif.<br />Klik <strong>Cetak via Bluetooth</strong> untuk melihat simulasi output kertas struk!</span>
                            </div>
                          ) : (
                            simulatedReceiptLines.map((line, idx) => {
                              if (!line) return null;
                              const textAlign = line.align === 'center' ? 'center' : line.align === 'right' ? 'right' : 'left';
                              return (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    textAlign, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: line.align === 'center' ? 'center' : line.align === 'right' ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                  }}
                                >
                                  {line.segments.map((seg, sIdx) => {
                                    if (seg.type === 'line') {
                                      return <div key={sIdx} className="thermal-divider" />;
                                    }
                                    if (seg.type === 'barcode') {
                                      return (
                                        <div key={sIdx} className="thermal-barcode-box">
                                          <div className="thermal-barcode-bars" />
                                          <span className="thermal-barcode-text">{seg.barcodeValue}</span>
                                        </div>
                                      );
                                    }
                                    
                                    // Render text segment
                                    const fontSizeClass = 
                                      seg.size === 'double-both' ? 'thermal-text-both' :
                                      seg.size === 'double-height' ? 'thermal-text-height' :
                                      seg.size === 'double-width' ? 'thermal-text-width' :
                                      'thermal-text-normal';
                                    
                                    return (
                                      <span 
                                        key={sIdx} 
                                        className={`thermal-line-text ${fontSizeClass}`}
                                        style={{ fontWeight: seg.bold ? 800 : 400 }}
                                      >
                                        {seg.text}
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Glassmorphic Confirmation Popup */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="confirm-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5, 8, 22, 0.8)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '1.5rem'
          }}>
            <motion.div
              className="confirm-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <Info size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <h3>{confirmConfig.title || 'Konfirmasi Tindakan'}</h3>
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
                  Ya, Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded print media overrides for thermal label */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-label-paper, .print-label-paper * {
            visibility: visible;
          }
          .print-label-paper {
            position: absolute;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 70mm !important;
            height: 40mm !important;
            border: 2px solid #000000 !important;
            margin: 0 !important;
            padding: 10px !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}} />
    </div>
  )
}
