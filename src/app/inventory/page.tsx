'use client'

import React, { useState, Suspense } from 'react'
import { Boxes, Search, Plus, TrendingDown, TrendingUp, Minus, Printer, Wifi, Info, Bluetooth, AlertCircle, X, CheckCircle, Trash2, RotateCcw, CheckSquare, Square, Layers } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthGuard'
import { checkAndSendTelegramAlert } from '@/lib/telegram'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WebBluetoothPrinterManager, 
  EscPosParser, 
  generateStockLabelEscPos, 
  BluetoothPrinterState, 
  SimulatedLine 
} from '@/lib/bluetoothPrinter'

function InventoryContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    owner: 'PT Rifinity Logistik',
    quantity: 0,
    unit: 'pcs',
    location: 'TBD',
    rackLocation: 'TBD',
    supplier: '',
    buyPrice: 0,
    sellPrice: 0,
    notes: ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Bluetooth Thermal Printing State Management
  const [btManager, setBtManager] = useState<WebBluetoothPrinterManager | null>(null)
  const [btState, setBtState] = useState<BluetoothPrinterState>('disconnected')
  const [btError, setBtError] = useState<string>('')
  const [simulatedReceiptLines, setSimulatedReceiptLines] = useState<SimulatedLine[]>([])
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [printTab, setPrintTab] = useState<'system' | 'bluetooth'>('system')
  const [activeBarcodeData, setActiveBarcodeData] = useState<any>(null)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)

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

  // Batch Label Printing State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [batchCopies, setBatchCopies] = useState(1)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchPrintMode, setBatchPrintMode] = useState<'system' | 'bluetooth'>('system')
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filtered.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filtered.map(i => i.id)))
    }
  }

  const handleBatchSystemPrint = () => {
    const toPrint = filtered.filter(i => selectedItems.has(i.id))
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) return

    const copies = Math.max(1, batchCopies)
    const labelPages = toPrint.flatMap(item => Array(copies).fill(item)).map(item => {
      const ownerName = item.owner || 'PT Rifinity Logistik'
      const isInternal = ownerName === 'PT Rifinity Logistik'
      const rackLoc = item.rackLocation || getRackLocation(item.category || 'General', item.sku || '')
      return `
        <div class="label-wrap">
          <div class="label-container">
            <div class="label-header">
              <span class="logo-text">${isInternal ? 'PT RIFINITY LOGISTIK' : ownerName}</span>
              <span class="badge-verified">${isInternal ? 'WMS VERIFIED' : 'TITIPAN'}</span>
            </div>
            <div class="label-body">
              <div class="label-barcode">
                <svg width="80" height="30" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="32" fill="white"/><rect x="3" y="2" width="1.5" height="21" fill="black"/><rect x="5" y="2" width="0.5" height="21" fill="black"/><rect x="6.5" y="2" width="2" height="21" fill="black"/><rect x="9.5" y="2" width="1" height="21" fill="black"/><rect x="12.5" y="2" width="1.5" height="21" fill="black"/><rect x="16" y="2" width="2" height="21" fill="black"/><rect x="19" y="2" width="1.5" height="21" fill="black"/><rect x="22" y="2" width="1" height="21" fill="black"/><rect x="24" y="2" width="2" height="21" fill="black"/><rect x="28.5" y="2" width="1.5" height="21" fill="black"/><rect x="31" y="2" width="1" height="21" fill="black"/><rect x="34.5" y="2" width="2.5" height="21" fill="black"/><rect x="38" y="2" width="1" height="21" fill="black"/><rect x="41.5" y="2" width="1.5" height="21" fill="black"/><rect x="44" y="2" width="2" height="21" fill="black"/><rect x="48.5" y="2" width="1.5" height="21" fill="black"/><rect x="54.5" y="2" width="2" height="21" fill="black"/><rect x="60.5" y="2" width="1.5" height="21" fill="black"/><rect x="64" y="2" width="2" height="21" fill="black"/><rect x="72" y="2" width="2" height="21" fill="black"/><rect x="76.5" y="2" width="1.5" height="21" fill="black"/><rect x="82.5" y="2" width="2.5" height="21" fill="black"/><rect x="89.5" y="2" width="1.5" height="21" fill="black"/><rect x="92" y="2" width="2" height="21" fill="black"/><rect x="96.5" y="2" width="2.5" height="21" fill="black"/><text x="50" y="29" font-family="monospace" font-size="5" text-anchor="middle" fill="black" font-weight="bold">${item.sku}</text></svg>
              </div>
              <div class="label-info">
                <p class="item-name">${item.name}</p>
                <p class="item-detail">SKU: <strong>${item.sku}</strong></p>
                <p class="item-detail">Kategori: ${item.category}</p>
                <p class="item-detail">Stok: <strong>${item.quantity} ${item.unit}</strong></p>
                <p class="item-detail">Lokasi: <strong>${rackLoc}</strong></p>
              </div>
            </div>
            <div class="label-footer">
              <span>${new Date().toLocaleDateString('id-ID')}</span>
              <span>RIFINITY WMS v2.0</span>
            </div>
          </div>
        </div>
      `
    })

    doc.open()
    doc.write(`
      <html><head><title>Cetak Label Massal (${toPrint.length} barang)</title>
      <style>
        @page { size: 80mm 50mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .label-wrap { width: 80mm; height: 50mm; padding: 2mm; page-break-after: always; }
        .label-container { border: 1.5px solid #000; border-radius: 5px; height: 100%; display: flex; flex-direction: column; padding: 1.5mm; justify-content: space-between; }
        .label-header { border-bottom: 1.5px solid #000; padding-bottom: 0.8mm; display: flex; justify-content: space-between; align-items: center; }
        .logo-text { font-size: 7pt; font-weight: 700; text-transform: uppercase; }
        .badge-verified { font-size: 5pt; border: 1px solid #000; border-radius: 2px; padding: 0.2mm 0.8mm; font-weight: 700; }
        .label-body { display: flex; flex: 1; padding-top: 1.5mm; gap: 2mm; }
        .label-barcode { flex-shrink: 0; display: flex; align-items: center; }
        .label-info { flex: 1; }
        .item-name { font-size: 8pt; font-weight: 700; margin-bottom: 0.8mm; line-height: 1.2; }
        .item-detail { font-size: 6.5pt; color: #333; margin-bottom: 0.3mm; }
        .label-footer { border-top: 1px solid #ccc; padding-top: 0.5mm; display: flex; justify-content: space-between; font-size: 5.5pt; color: #666; }
      </style></head><body>${labelPages.join('')}</body></html>
    `)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 3000)
    }, 400)
    setShowBatchModal(false)
    setSelectedItems(new Set())
    showNotification(`✅ ${toPrint.length * copies} label dikirim ke printer!`, 'success')
  }

  const handleBatchBTPrint = async () => {
    if (!btManager) return
    const state = btManager.getState()
    if (state === 'disconnected') {
      showNotification('Hubungkan printer Bluetooth terlebih dahulu!', 'error')
      return
    }
    const toPrint = filtered.filter(i => selectedItems.has(i.id))
    const copies = Math.max(1, batchCopies)
    const queue = toPrint.flatMap(item => Array(copies).fill(item))
    setShowBatchModal(false)
    setBatchProgress({ current: 0, total: queue.length })

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      setBatchProgress({ current: i + 1, total: queue.length })
      const labelData = {
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        owner: item.owner || 'PT Rifinity Logistik',
        location: item.location || 'Utama',
        rackLocation: item.rackLocation || getRackLocation(item.category || 'General', item.sku || '')
      }
      const bytes = generateStockLabelEscPos(labelData)
      try {
        if (state === 'connected_sim') {
          const parsed = EscPosParser.parse(bytes)
          setSimulatedReceiptLines([])
          await new Promise<void>(resolve => {
            let idx = 0
            const iv = setInterval(() => {
              if (idx < parsed.length) {
                setSimulatedReceiptLines(prev => [...prev, parsed[idx]])
                idx++
              } else { clearInterval(iv); resolve() }
            }, 60)
          })
        } else {
          await btManager.print(bytes)
        }
        // Small delay between labels
        await new Promise(r => setTimeout(r, 300))
      } catch (err: any) {
        showNotification(`Error cetak label ${i + 1}: ${err.message}`, 'error')
        break
      }
    }
    setBatchProgress(null)
    showNotification(`✅ ${queue.length} label berhasil dicetak!`, 'success')
    setSelectedItems(new Set())
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
      setShowSimulator(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleConnectRealBluetooth = async () => {
    if (!btManager) return
    try {
      await btManager.connectRealDevice()
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
      setShowSimulator(false)
      setSimulatedReceiptLines([])
    }
  }

  const handleBluetoothPrint = async () => {
    if (!btManager || !activeBarcodeData) return
    
    const state = btManager.getState()
    if (state === 'disconnected') return

    try {
      // Prepare label data
      const labelData = {
        name: activeBarcodeData.item?.name || 'Unknown Item',
        sku: activeBarcodeData.item?.sku || 'SKU-UNKNOWN',
        quantity: activeBarcodeData.quantity || 0,
        unit: activeBarcodeData.item?.unit || 'pcs',
        owner: activeBarcodeData.item?.owner || 'PT Rifinity Logistik',
        location: activeBarcodeData.item?.location || 'Utama',
        rackLocation: activeBarcodeData.item?.rackLocation || getRackLocation(activeBarcodeData.item?.category || 'General', activeBarcodeData.item?.sku || '')
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
          }
        }, 150)
      } else {
        await btManager.print(bytes)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const handlePrintLabelClick = (item: any) => {
    setActiveBarcodeData({
      item: {
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        owner: item.owner,
        location: item.location || 'Utama',
        rackLocation: item.rackLocation || getRackLocation(item.category || 'General', item.sku || ''),
        category: item.category
      },
      quantity: item.quantity
    })
    setIsBarcodeModalOpen(true)
  }

  const getRackLocation = (category: string, sku: string) => {
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
      let hash = 0;
      for (let i = 0; i < sku.length; i++) {
        hash += sku.charCodeAt(i);
      }
      zone = String.fromCharCode(65 + (hash % 6)); // A - F
      rack = String(1 + (hash % 15)).padStart(2, '0'); // 01 - 15
    }
    
    return `ZONA-${zone} / RAK-${rack}`;
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestActionConfirm(
      'Konfirmasi Registrasi Barang',
      `Apakah Anda yakin ingin mendaftarkan barang baru "${formData.name}" sejumlah ${formData.quantity} ${formData.unit} ke dalam WMS?`,
      () => executeFormSubmit()
    )
  }

  const executeFormSubmit = async () => {
    setErrorMsg('')
    setSubmitting(true)
    try {
      const rackLoc = formData.rackLocation === 'TBD' || !formData.rackLocation
        ? getRackLocation(formData.category, formData.sku)
        : formData.rackLocation

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: formData.name,
          sku: formData.sku,
          category: formData.category,
          owner: formData.owner,
          quantity: String(formData.quantity),
          unit: formData.unit,
          buyPrice: String(formData.buyPrice),
          sellPrice: String(formData.sellPrice),
          supplier: formData.supplier,
          rackLocation: rackLoc,
          location: formData.location === 'TBD' ? 'Utama' : formData.location,
          notes: formData.notes || 'Registrasi barang baru via Inventory',
          type: 'IN'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan barang')
      }
      setItems(prev => [data.item, ...prev])
      setShowAddModal(false)
      showNotification('Barang berhasil ditambahkan ke inventaris!', 'success')
      
      // Auto check and trigger Telegram Alert if below threshold
      if (data.item) {
        checkAndSendTelegramAlert(data.item)
      }
      setFormData({
        name: '',
        sku: '',
        category: '',
        owner: 'PT Rifinity Logistik',
        quantity: 0,
        unit: 'pcs',
        location: 'TBD',
        rackLocation: 'TBD',
        supplier: '',
        buyPrice: 0,
        sellPrice: 0,
        notes: ''
      })
    } catch (err: any) {
      setErrorMsg(err.message)
      showNotification(err.message || 'Gagal menyimpan barang.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivateItem = (itemId: string, itemName: string) => {
    requestActionConfirm(
      'Konfirmasi Penonaktifan Barang',
      `Apakah Anda yakin ingin menonaktifkan barang "${itemName}" dari WMS? Barang tidak akan dihapus, melainkan diubah statusnya menjadi Nonaktif.`,
      () => executeDeactivateItem(itemId)
    )
  }

  const executeDeactivateItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/inventory?id=${itemId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menonaktifkan barang')
      }

      // Selalu lakukan update status menjadi NONAKTIF di state lokal
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'NONAKTIF' } : item))
      showNotification(data.message || 'Barang berhasil dinonaktifkan.', 'success')
    } catch (err: any) {
      console.error(err)
      showNotification(err.message || 'Gagal menonaktifkan barang.', 'error')
    }
  }

  const handleReactivateItem = (itemId: string, itemName: string) => {
    requestActionConfirm(
      'Konfirmasi Aktivasi Kembali Barang',
      `Apakah Anda yakin ingin mengaktifkan kembali barang "${itemName}" di dalam WMS?`,
      () => executeReactivateItem(itemId)
    )
  }

  const executeReactivateItem = async (itemId: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: 'AKTIF' })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengaktifkan kembali barang')
      }

      // Update state
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'AKTIF' } : item))
      showNotification('Barang berhasil diaktifkan kembali!', 'success')
    } catch (err: any) {
      console.error(err)
      showNotification(err.message || 'Gagal mengaktifkan kembali barang.', 'error')
    }
  }

  const printLabel = (item: any) => {
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

    const ownerName = item.owner || 'PT Rifinity Logistik';
    const isInternal = ownerName === 'PT Rifinity Logistik';

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Cetak Label - \${item.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
            @page {
              size: 80mm 50mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: 80mm;
              height: 50mm;
              margin: 0;
              padding: 2mm;
              font-family: 'Outfit', 'Arial', sans-serif;
              background: #fff;
              color: #000;
            }
            .label-container {
              border: 1.5px solid #000;
              border-radius: 6px;
              height: 100%;
              display: flex;
              flex-direction: column;
              padding: 1.5mm;
              justify-content: space-between;
            }
            .label-header {
              border-bottom: 1.5px solid #000;
              padding-bottom: 0.8mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo-text {
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .badge-verified {
              font-size: 5pt;
              border: 1px solid #000;
              border-radius: 2px;
              padding: 0.2mm 0.8mm;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .label-body {
              display: flex;
              flex: 1;
              padding-top: 1.5mm;
              gap: 2mm;
              align-items: center;
            }
            .label-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: space-between;
            }
            .item-name {
              font-size: 7.5pt;
              font-weight: 700;
              line-height: 1.25;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .item-details {
              font-size: 6pt;
              display: flex;
              flex-direction: column;
              gap: 0.5mm;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
            }
            .detail-row strong {
              font-family: monospace;
              font-size: 7pt;
            }
            .badge-owner {
              border: 0.5px solid #000;
              padding: 0.1mm 0.5mm;
              border-radius: 2px;
              font-size: 5pt;
              font-weight: 600;
              display: inline-block;
              max-width: 90px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .qr-container {
              width: 22mm;
              height: 22mm;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #ddd;
              padding: 0.5mm;
              border-radius: 4px;
              flex-shrink: 0;
            }
            .qr-image {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="label-header">
              <span class="logo-text">PT RIFINITY LOGISTIK</span>
              <span class="badge-verified">WMS VERIFIED</span>
            </div>
            
            <div class="label-body">
               <div class="label-info">
                 <div class="item-name">${item.name}</div>
                 <div class="item-details">
                   <div class="detail-row">
                     <span>SKU:</span>
                     <strong>${item.sku}</strong>
                   </div>
                   <div class="detail-row">
                     <span>LOKASI:</span>
                     <strong>${item.location || 'TBD'}</strong>
                   </div>
                   <div class="detail-row" style="align-items: center; margin-top: 0.5mm;">
                     <span>PEMILIK:</span>
                     <span class="badge-owner" title="${ownerName}">
                       ${isInternal ? 'INTERNAL' : ownerName.toUpperCase()}
                     </span>
                   </div>
                 </div>
               </div>
               
               <div class="qr-container">
                 <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(item.sku)}" onload="window.print(); setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 500);" />
               </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();
  };

  const [criticalThreshold, setCriticalThreshold] = useState(5)
  const [predictiveThreshold, setPredictiveThreshold] = useState(20)

  React.useEffect(() => {
    // Load WMS Threshold settings from localStorage
    if (typeof window !== 'undefined') {
      const savedCritical = localStorage.getItem('rifinity_settings_wms_critical_threshold')
      if (savedCritical) setCriticalThreshold(parseInt(savedCritical) || 5)
      
      const savedPredictive = localStorage.getItem('rifinity_settings_wms_predictive_threshold')
      if (savedPredictive) setPredictiveThreshold(parseInt(savedPredictive) || 20)
    }

    fetch('/api/inventory')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HTTP error! status: ${res.status}. Response: ${text.substring(0, 50)}...`)
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data)
        } else {
          console.error('Data received is not an array:', data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch inventory:', err)
        setLoading(false)
      })
  }, [])

  const filtered = items.filter(i => {
    const matchesSearch = 
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = showInactive ? true : (i.status !== 'NONAKTIF')
    return matchesSearch && matchesStatus
  })

  const getStockStatus = (qty: number) => {
    if (qty <= criticalThreshold) return { label: t('status_critical', 'Kritis'), cls: 'badge-danger', icon: <TrendingDown size={12} /> }
    if (qty <= predictiveThreshold) return { label: t('status_low', 'Rendah'), cls: 'badge-warning', icon: <Minus size={12} /> }
    return { label: t('status_normal', 'Normal'), cls: 'badge-success', icon: <TrendingUp size={12} /> }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLocation, setEditLocation] = useState('')

  const handleEditClick = (item: any) => {
    setEditingId(item.id)
    setEditLocation(item.location === 'TBD' ? '' : item.location)
  }

  const handleSaveLocation = async (id: string) => {
    const finalLocation = editLocation.trim() || 'TBD'
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, location: finalLocation })
      })
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, location: finalLocation } : i))
      }
    } catch (e) {
      console.error(e)
    }
    setEditingId(null)
  }

  return (
    <div className="page-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .inventory-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .inventory-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .dashboard-header button {
            width: 100% !important;
            justify-content: center !important;
          }
          .responsive-table-card {
            padding: 0.75rem !important;
          }
          .responsive-table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
          }
          .responsive-table thead {
            display: none !important;
          }
          .responsive-table,
          .responsive-table tbody,
          .responsive-table tr,
          .responsive-table td {
            display: block !important;
            width: 100% !important;
          }
          .responsive-table tr {
            background: rgba(255, 255, 255, 0.01) !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            border-radius: 12px !important;
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }
          .responsive-table tr:last-child {
            margin-bottom: 0 !important;
          }
          .responsive-table td {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 0.6rem 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            text-align: right !important;
            font-size: 0.85rem !important;
            background: transparent !important;
          }
          .responsive-table td:last-child {
            border-bottom: none !important;
          }
          .responsive-table td::before {
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
          .light-mode .responsive-table td::before {
            color: rgba(15, 23, 42, 0.6) !important;
          }
          .responsive-table .td-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            text-align: right !important;
            width: 100% !important;
          }
          .inner-form-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
        .batch-selection-bar {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          z-index: 9999;
          width: 90%;
          max-width: 650px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .light-mode .batch-selection-bar {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .batch-selection-bar-cancel {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 0.75rem;
          cursor: pointer;
          text-decoration: underline;
        }
        .light-mode .batch-selection-bar-cancel {
          color: rgba(15,23,42,0.5) !important;
        }
        .batch-selection-bar-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .light-mode .batch-selection-bar-label {
          color: rgba(15,23,42,0.6) !important;
        }
        .batch-selection-bar-input {
          width: 50px;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.8rem;
          text-align: center;
          outline: none;
        }
        .light-mode .batch-selection-bar-input {
          background: rgba(15,23,42,0.04) !important;
          border-color: rgba(15,23,42,0.12) !important;
          color: #0f172a !important;
        }
        .batch-confirm-modal-text {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.65);
        }
        .light-mode .batch-confirm-modal-text {
          color: rgba(15,23,42,0.7) !important;
        }
        .batch-option-btn {
          flex: 1;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: all 0.2s;
        }
        .batch-option-btn.active {
          background: var(--primary);
          color: #0b1329;
        }
        .light-mode .batch-option-btn {
          background: rgba(15,23,42,0.02) !important;
          color: rgba(15,23,42,0.7) !important;
          border-color: rgba(15,23,42,0.08) !important;
        }
        .light-mode .batch-option-btn.active {
          background: var(--primary) !important;
          color: #0f172a !important;
        }
        .batch-progress-card {
          width: 100%;
          max-width: 320px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
        }
        .light-mode .batch-progress-card {
          background: #ffffff !important;
          border-color: rgba(15,23,42,0.08) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.08) !important;
        }
        .batch-progress-title {
          margin: 0 0 0.5rem;
          color: white;
        }
        .light-mode .batch-progress-title {
          color: #0f172a !important;
        }
        .batch-progress-subtitle {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          margin: 0 0 1rem;
        }
        .light-mode .batch-progress-subtitle {
          color: rgba(15,23,42,0.5) !important;
        }
      `}} />

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.5rem', borderRadius: '12px',
              background: notification.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
              border: notification.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
              color: 'white', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)'
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '0.5rem' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="dashboard-header">
        <div>
          <h1 className="page-title">{t('inventory_title', 'Inventory')}</h1>
          <p className="page-subtitle">{t('inventory_desc', 'Kelola dan pantau stok barang gudang secara real-time.')}</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          {t('add_item', 'Tambah Barang')}
        </button>
      </header>

      <div className="inventory-stats-grid">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>{t('total_sku', 'Total SKU')}</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{items.length}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>{t('critical_stock', 'Stok Kritis')}</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
            {items.filter(i => i.quantity <= criticalThreshold).length}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>{t('total_units', 'Total Unit')}</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
            {items.reduce((a, b) => a + b.quantity, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card glass">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input
              placeholder={t('search_placeholder', 'Cari nama barang atau SKU...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer', 
            userSelect: 'none',
            fontSize: '0.875rem',
            background: showInactive ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
            border: showInactive ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.08)',
            padding: '8px 14px',
            borderRadius: '10px',
            color: showInactive ? '#f87171' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s ease',
          }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              style={{ 
                width: '15px', 
                height: '15px', 
                cursor: 'pointer',
                accentColor: '#f87171'
              }}
            />
            <span>Tampilkan Barang Nonaktif</span>
          </label>
        </div>

        <table className="responsive-table">
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    margin: '0 auto'
                  }}
                  title={selectedItems.size === filtered.length ? 'Batalkan semua pilihan' : 'Pilih semua'}
                >
                  {selectedItems.size === filtered.length && filtered.length > 0 ? (
                    <CheckSquare size={17} style={{ color: 'var(--primary)' }} />
                  ) : (
                    <Square size={17} style={{ opacity: 0.5 }} />
                  )}
                </button>
              </th>
              <th>{t('table_item_name', 'Nama Barang')}</th>
              <th>{t('table_sku', 'SKU')}</th>
              <th>{t('table_category', 'Kategori')}</th>
              <th>{t('table_owner', 'Pemilik (Owner)')}</th>
              <th>{t('table_stock', 'Stok')}</th>
              <th>{t('table_location', 'Lokasi')}</th>
              <th>{t('table_status', 'Status')}</th>
              <th>{t('table_action', 'Aksi')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center' }}>{t('loading', 'Loading...')}</td></tr>
            ) : filtered.map(item => {
              const status = getStockStatus(item.quantity)
              return (
                <tr key={item.id} style={{ background: selectedItems.has(item.id) ? 'rgba(59, 130, 246, 0.04)' : 'none' }}>
                  <td data-label="Pilih" style={{ width: '45px', textAlign: 'center' }}>
                    <div className="td-wrapper" style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: selectedItems.has(item.id) ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                          margin: '0 auto'
                        }}
                      >
                        {selectedItems.has(item.id) ? (
                          <CheckSquare size={17} style={{ color: 'var(--primary)' }} />
                        ) : (
                          <Square size={17} style={{ opacity: 0.5 }} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td data-label={t('table_item_name', 'Nama Barang')} style={{ fontWeight: 500 }}>
                    <div className="td-wrapper">
                      {item.name}
                    </div>
                  </td>
                  <td data-label={t('table_sku', 'SKU')} style={{ opacity: 0.55, fontFamily: 'monospace' }}>
                    <div className="td-wrapper">
                      {item.sku}
                    </div>
                  </td>
                  <td data-label={t('table_category', 'Kategori')}>
                    <div className="td-wrapper">
                      {item.category}
                    </div>
                  </td>
                  <td data-label={t('table_owner', 'Pemilik (Owner)')}>
                    <div className="td-wrapper">
                      {item.owner === 'PT Rifinity Logistik' || !item.owner ? (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {t('internal', 'Internal')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 500 }} title={item.owner}>
                          {item.owner}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label={t('table_stock', 'Stok')}>
                    <div className="td-wrapper">
                      <strong>{item.quantity}</strong> {item.unit}
                    </div>
                  </td>
                  <td data-label={t('table_location', 'Lokasi')}>
                    <div className="td-wrapper">
                      {editingId === item.id ? (
                        <input 
                          autoFocus
                          value={editLocation}
                          onChange={e => setEditLocation(e.target.value)}
                          onBlur={() => handleSaveLocation(item.id)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveLocation(item.id)}
                          style={{ 
                            width: '90px', 
                            padding: '0.25rem 0.5rem', 
                            background: 'var(--glass)',
                            color: 'var(--foreground)', 
                            border: '1px solid var(--primary)', 
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}
                          placeholder={t('table_location', 'Lokasi')}
                        />
                      ) : (
                        <span 
                          className="badge badge-primary" 
                          style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px dashed transparent' }}
                          onClick={() => handleEditClick(item)}
                          onMouseEnter={e => e.currentTarget.style.border = '1px dashed white'}
                          onMouseLeave={e => e.currentTarget.style.border = '1px dashed transparent'}
                          title={t('click_to_change_location', 'Klik untuk ubah lokasi')}
                        >
                          {item.location}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label={t('table_status', 'Status')}>
                    <div className="td-wrapper">
                      {item.status === 'NONAKTIF' ? (
                        <span className="badge" style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171',
                          fontWeight: 600
                        }}>
                          <AlertCircle size={12} /> Nonaktif
                        </span>
                      ) : (
                        <span className={`badge ${status.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {status.icon}{status.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label={t('table_action', 'Aksi')}>
                    <div className="td-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handlePrintLabelClick(item)}
                        className="btn-secondary btn-sm"
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          color: 'var(--primary)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--primary)'
                          e.currentTarget.style.color = 'white'
                          e.currentTarget.style.borderColor = 'var(--primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                          e.currentTarget.style.color = 'var(--primary)'
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <Printer size={12} />
                        {t('print_label', 'Label')}
                      </button>

                      {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                        <>
                          {item.status === 'NONAKTIF' ? (
                            <button
                              onClick={() => handleReactivateItem(item.id, item.name)}
                              className="btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#10b981'
                                e.currentTarget.style.color = 'white'
                                e.currentTarget.style.borderColor = '#10b981'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                                e.currentTarget.style.color = '#10b981'
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                              }}
                            >
                              <RotateCcw size={12} />
                              Aktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivateItem(item.id, item.name)}
                              className="btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#ef4444'
                                e.currentTarget.style.color = 'white'
                                e.currentTarget.style.borderColor = '#ef4444'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                e.currentTarget.style.color = '#f87171'
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                              }}
                            >
                              <Trash2 size={12} />
                              Nonaktifkan
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card glass" style={{
            width: '100%',
            maxWidth: '550px',
            padding: '1.75rem',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={22} style={{ color: 'var(--primary)' }} />
                {t('add_new_item', 'Tambah Barang Baru')}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', outline: 'none', opacity: 0.5 }}
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('item_name_req', 'Nama Barang *')}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Sepatu Lari Premium" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('sku_req', 'SKU Barang *')}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. SH-NIK-A1" 
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('category_req', 'Kategori *')}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Fashion, Consumable" 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('unit_type', 'Satuan Unit')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. pcs, unit, roll, pasang" 
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('owner_req', 'Pemilik (Owner) *')}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. PT Rifinity Logistik, Nike Indonesia" 
                  value={formData.owner}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                />
              </div>

              <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('buy_price_label', 'Harga Beli (Modal)')}</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 15000" 
                    value={formData.buyPrice || ''}
                    onChange={e => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('sell_price_label', 'Harga Jual (Pemasukan)')}</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 25000" 
                    value={formData.sellPrice || ''}
                    onChange={e => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('initial_stock', 'Stok Awal')}</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('rack_location', 'Lokasi Rak')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ZONA-P / RAK-03" 
                    value={formData.rackLocation}
                    onChange={e => setFormData({ ...formData, rackLocation: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('warehouse_location', 'Lokasi Gudang')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Utama, TBD" 
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('default_supplier', 'Pemasok Default (Supplier)')}</label>
                <input 
                  type="text" 
                  placeholder="e.g. PT Mitra Logistik Indonesia" 
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>{t('notes_label', 'Catatan')}</label>
                <textarea 
                  placeholder="Kondisi barang, nomor PO, dll..." 
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(128,128,128,0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  {t('cancel', 'Batal')}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting}
                  style={{ flex: 2, padding: '0.6rem' }}
                >
                  {submitting ? t('adding_loading', 'Menambahkan...') : t('save_item', 'Simpan Barang')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('preview_rack_barcode', 'Pratinjau Label Barang')}</h3>
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
                      <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.5px' }}>PT RIFINITY LOGISTIK</span>
                      <span style={{ fontSize: '7px', fontWeight: 900, background: '#000000', color: '#ffffff', padding: '1px 3px', borderRadius: '2px' }}>WMS VERIFIED</span>
                    </div>

                    {/* QR Code / Info block */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '8px' }}>
                        <div>NAMA: <strong style={{ fontSize: '9px' }}>{activeBarcodeData.item?.name || 'Unknown Item'}</strong></div>
                        <div>SKU: <strong>{activeBarcodeData.item?.sku || 'SKU-UNKNOWN'}</strong></div>
                        <div>LOKASI: <strong>{activeBarcodeData.item?.location || 'Utama'}</strong></div>
                        <div>PEMILIK: <strong>{(activeBarcodeData.item?.owner || 'PT RIFINITY LOGISTIK').toUpperCase()}</strong></div>
                      </div>
                      
                      <div style={{ width: '60px', height: '60px', border: '1px solid #ddd', padding: '2px', borderRadius: '4px', flexShrink: 0 }}>
                        <img 
                          style={{ width: '100%', height: '100%' }} 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(activeBarcodeData.item?.sku || '')}`} 
                          alt="QR Code" 
                        />
                      </div>
                    </div>

                    {/* Rack Location Section */}
                    <div style={{ 
                      marginTop: '2px', padding: '3px', background: '#000000', color: '#ffffff', 
                      fontWeight: 900, textAlign: 'center', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.5px'
                    }}>
                      LOKASI RAK: {activeBarcodeData.item?.rackLocation || 'ZONA-A / RAK-01'}
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
                      {t('cancel', 'Batal')}
                    </button>
                    <button 
                      onClick={() => requestActionConfirm(
                        'Konfirmasi Cetak Sistem',
                        `Apakah Anda yakin ingin mencetak label barang untuk SKU ${activeBarcodeData?.item?.sku || ''} menggunakan printer sistem?`,
                        () => printLabel(activeBarcodeData.item)
                      )}
                      className="btn-primary"
                      style={{
                        flex: 1.5, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'var(--accent)'
                      }}
                    >
                      <Printer size={16} />
                      {t('print_label', 'Cetak Label')}
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
                        {t('cancel', 'Batal')}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => requestActionConfirm(
                          'Konfirmasi Cetak Thermal',
                          `Apakah Anda yakin ingin mengirim perintah cetak label barang SKU ${activeBarcodeData?.item?.sku || ''} ke printer thermal?`,
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

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {selectedItems.size > 0 && (
          <motion.div
            className="batch-selection-bar"
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                {selectedItems.size} Barang Terpilih
              </div>
              <button
                type="button"
                onClick={() => setSelectedItems(new Set())}
                className="batch-selection-bar-cancel"
                onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >
                Batal
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="batch-selection-bar-label">Salinan:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={batchCopies}
                  onChange={e => setBatchCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="batch-selection-bar-input"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="btn-primary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--primary)',
                  color: '#0b1329'
                }}
              >
                <Printer size={14} />
                Cetak Massal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Print Config Modal */}
      <AnimatePresence>
        {showBatchModal && (
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
              style={{ maxWidth: '460px', border: '1px solid rgba(59, 130, 246, 0.2)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <Layers size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <h3>Konfirmasi Cetak Massal</h3>
                <p className="batch-confirm-modal-text">
                  Anda akan mencetak label barcode untuk <strong>{selectedItems.size} barang</strong> dengan masing-masing <strong>{batchCopies} salinan</strong> (Total {selectedItems.size * batchCopies} label).
                </p>
              </div>

              {/* Mode Selection */}
              <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
                <button
                  type="button"
                  onClick={() => setBatchPrintMode('system')}
                  className={`batch-option-btn ${batchPrintMode === 'system' ? 'active' : ''}`}
                >
                  🖥️ Printer Sistem
                </button>
                <button
                  type="button"
                  onClick={() => setBatchPrintMode('bluetooth')}
                  className={`batch-option-btn ${batchPrintMode === 'bluetooth' ? 'active' : ''}`}
                >
                  🔵 Bluetooth Thermal
                </button>
              </div>

              {batchPrintMode === 'bluetooth' && (
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <Bluetooth size={16} />
                  <span>
                    Pastikan printer Bluetooth (atau Simulator) sudah terhubung sebelum memulai pencetakan.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowBatchModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={batchPrintMode === 'system' ? handleBatchSystemPrint : handleBatchBTPrint}
                  style={{
                    flex: 1.5, padding: '0.75rem', borderRadius: '8px', border: 'none',
                    background: 'var(--primary)', color: '#0b1329', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem'
                  }}
                >
                  Mulai Cetak
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Progress Overlay */}
      <AnimatePresence>
        {batchProgress && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5, 8, 22, 0.9)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100001, padding: '1.5rem'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="batch-progress-card"
            >
              <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <Bluetooth size={24} style={{ color: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
              </div>
              <h4 className="batch-progress-title">Mencetak Label Massal</h4>
              <p className="batch-progress-subtitle">
                Mengirim antrean data ke printer thermal...
              </p>
              
              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    height: '100%', background: 'var(--primary)', borderRadius: '10px',
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    transition: 'width 0.2s ease-out'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                {batchProgress.current} / {batchProgress.total} Label
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <InventoryContent />
    </Suspense>
  )
}
