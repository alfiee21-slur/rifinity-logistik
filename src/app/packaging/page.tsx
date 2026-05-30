'use client'

import React, { useState } from 'react'
import { 
  PackageCheck, 
  Sparkles, 
  Package, 
  Truck, 
  Send, 
  History, 
  ArrowUpRight, 
  AlertCircle,
  CheckCircle,
  X,
  MapPin,
  Tag,
  Printer,
  Search,
  Bluetooth,
  Wifi,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAndSendTelegramAlert } from '@/lib/telegram'
import ContactAutocomplete from '@/components/ContactAutocomplete'
import { 
  BluetoothPrinterState, 
  WebBluetoothPrinterManager, 
  generateLogisticsLabelEscPos, 
  EscPosParser, 
  SimulatedLine 
} from '@/lib/bluetoothPrinter'

// Highly realistic vector Code 128 / Code 39 Barcode Generator SVG
function BarcodeSVG({ value }: { value: string }) {
  return (
    <svg width="220" height="72" viewBox="0 0 100 32" xmlns="http://www.w3.org/2000/svg">
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

export default function PackagingPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'packaging' | 'dispatch'>('dispatch')
  
  // AI Packaging States
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' })
  const [result, setResult] = useState<null | { type: string; reason: string; material: string }>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  // Outbound Dispatch States
  const [itemsList, setItemsList] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [outboundQty, setOutboundQty] = useState('')
  const [outboundPrice, setOutboundPrice] = useState('')
  const [recipient, setRecipient] = useState('')
  const [outboundNotes, setOutboundNotes] = useState('')
  const [dispatchHistory, setDispatchHistory] = useState<any[]>([])
  const [isDispatchLoading, setIsDispatchLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'non-tunai'>('tunai')
  const [dispatchSearch, setDispatchSearch] = useState('')

  // Local Courier API Simulation States (Territorial Database)
  const [provincesList, setProvincesList] = useState<any[]>([])
  const [citiesList, setCitiesList] = useState<any[]>([])
  const [selectedProvinceId, setSelectedProvinceId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedCourierCode, setSelectedCourierCode] = useState('')
  const [isShippingLoading, setIsShippingLoading] = useState(false)
  const [customResi, setCustomResi] = useState('')

  // Shipping Label Print States
  const [activeLabelData, setActiveLabelData] = useState<any | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  // Web Bluetooth Thermal Printer States
  const [printMethod, setPrintMethod] = useState<'system' | 'bluetooth'>('system')
  const [btState, setBtState] = useState<BluetoothPrinterState>('disconnected')
  const [btError, setBtError] = useState<string>('')
  const [btManager, setBtManager] = useState<WebBluetoothPrinterManager | null>(null)
  const [simulatedReceiptLines, setSimulatedReceiptLines] = useState<SimulatedLine[]>([])
  const [showSimulator, setShowSimulator] = useState(false)
  const [isSimulatingPrint, setIsSimulatingPrint] = useState(false)

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

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
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
    if (!btManager) return
    btManager.disconnect()
    showNotification('Printer terputus.', 'success')
    setSimulatedReceiptLines([])
    setShowSimulator(false)
  }

  const handleBluetoothPrint = async () => {
    if (!btManager || !activeLabelData) return
    
    const bytes = generateLogisticsLabelEscPos({
      recipient: activeLabelData.recipient,
      city: activeLabelData.city,
      address: activeLabelData.address,
      courier: activeLabelData.courier,
      resi: activeLabelData.resi,
      paymentMethod: activeLabelData.paymentMethod,
      itemName: activeLabelData.itemName,
      qty: activeLabelData.qty,
      unit: activeLabelData.unit,
      weight: activeLabelData.weight,
      date: activeLabelData.date,
      notes: activeLabelData.notes
    })

    const state = btManager.getState()
    if (state === 'disconnected') {
      showNotification('Silakan hubungkan printer (Simulator/Bluetooth) terlebih dahulu.', 'error')
      return
    }

    try {
      if (state === 'connected_sim') {
        setIsSimulatingPrint(true)
        setShowSimulator(true)
        setSimulatedReceiptLines([]) // clear previous
        
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
        
      } else if (state === 'connected_real') {
        await btManager.print(bytes)
        showNotification('Label berhasil dikirim ke printer bluetooth!', 'success')
      }
    } catch (err: any) {
      console.error(err)
      showNotification('Gagal mencetak: ' + err.message, 'error')
    }
  }

  const fetchHistory = () => {
    fetch('/api/packaging')
      .then(res => res.json())
      .then(data => setResult(null)) // Reset result logic
      .then(() => fetch('/api/packaging').then(res => res.json()).then(data => setHistory(data)))
      .catch(err => console.error(err))
  }

  const fetchInventory = () => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItemsList(data.filter(item => item.status !== 'NONAKTIF'))
        } else {
          setItemsList([])
        }
      })
      .catch(err => console.error(err))
  }

  const fetchDispatchHistory = () => {
    fetch('/api/transactions?type=OUT')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDispatchHistory(data)
        }
      })
      .catch(err => console.error(err))
  }

  const fetchCities = () => {
    fetch('/api/shipping/cost')
      .then(res => res.json())
      .then(data => {
        if (data.provinces && data.cities) {
          setProvincesList(data.provinces)
          setCitiesList(data.cities)
        }
      })
      .catch(err => console.error(err))
  }

  const [companyName, setCompanyName] = useState('PT. Rifinity Logistik')
  const [companyAddress, setCompanyAddress] = useState('DI Yogyakarta, Sleman')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('rifinity_settings_company_name')
      if (savedName) setCompanyName(savedName)
      
      const savedAddress = localStorage.getItem('rifinity_settings_company_address')
      if (savedAddress) setCompanyAddress(savedAddress)
    }
    fetchHistory()
    fetchInventory()
    fetchDispatchHistory()
    fetchCities()
  }, [])

  const selectedItem = itemsList.find(item => item.id === selectedItemId)

  // Auto-fill Item Sell Price when item is selected
  React.useEffect(() => {
    if (selectedItem) {
      setOutboundPrice(selectedItem.sellPrice.toString())
    } else {
      setOutboundPrice('')
    }
  }, [selectedItemId, selectedItem])

  // Trigger Real-Time shipping fee calculations from our territorial database
  React.useEffect(() => {
    const qty = parseInt(outboundQty)
    if (!selectedItemId || !selectedItem || isNaN(qty) || qty <= 0 || !selectedCityId) {
      setShippingOptions([])
      setSelectedCourierCode('')
      return
    }

    const totalWeightKg = (selectedItem.weight || 0.5) * qty
    setIsShippingLoading(true)

    fetch('/api/shipping/cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationId: selectedCityId,
        weightKg: totalWeightKg
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.options) {
          setShippingOptions(data.options)
          
          // Map default courier name from WMS settings to standard simulated courier code
          const savedDefault = localStorage.getItem('rifinity_settings_wms_default_courier') || 'PT Rifinity Express'
          let targetCode = data.options[0]?.code || ''
          
          if (savedDefault.toLowerCase().includes('jne')) {
            const found = data.options.find((o: any) => o.code === 'jne')
            if (found) targetCode = 'jne'
          } else if (savedDefault.toLowerCase().includes('j&t') || savedDefault.toLowerCase().includes('jnt') || savedDefault.toLowerCase().includes('express')) {
            const found = data.options.find((o: any) => o.code === 'jnt')
            if (found) targetCode = 'jnt'
          } else if (savedDefault.toLowerCase().includes('sicepat')) {
            const found = data.options.find((o: any) => o.code === 'sicepat')
            if (found) targetCode = 'sicepat'
          }
          
          setSelectedCourierCode(targetCode)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsShippingLoading(false))
  }, [selectedItemId, selectedItem, outboundQty, selectedCityId])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dimensions)
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      fetchHistory()
    } catch (err) {
      alert(t('packaging_recommend_err'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId || !selectedItem) {
      showNotification(t('outbound_item_select_err'), 'error')
      return
    }
    
    const qty = parseInt(outboundQty)
    if (isNaN(qty) || qty <= 0) {
      showNotification(t('outbound_qty_invalid_err'), 'error')
      return
    }

    if (qty > selectedItem.quantity) {
      showNotification(`${t('outbound_qty_insufficient_err')} ${selectedItem.quantity} ${selectedItem.unit}`, 'error')
      return
    }

    if (!selectedCityId) {
      showNotification(t('outbound_city_select_err'), 'error')
      return
    }

    if (!selectedCourierCode) {
      showNotification(t('outbound_courier_select_err'), 'error')
      return
    }

    const chosenCity = citiesList.find(c => c.id === selectedCityId)
    const chosenCourier = shippingOptions.find(o => o.code === selectedCourierCode)
    
    // Auto-generate realistic Nomor Resi matching the selected courier structure
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString()
    const generatedResi = customResi.trim() || `${selectedCourierCode.toUpperCase()}-${randomDigits}`

    requestActionConfirm(
      'Konfirmasi Pengeluaran Outbound',
      `Apakah Anda yakin ingin memproses pengeluaran barang "${selectedItem.name}" sejumlah ${qty} ${selectedItem.unit} untuk penerima ${recipient} (${chosenCity?.name || 'Umum'})?`,
      () => executeDispatch(qty, chosenCity, chosenCourier, generatedResi)
    )
  }

  const executeDispatch = async (qty: number, chosenCity: any, chosenCourier: any, generatedResi: string) => {
    setIsDispatchLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedItem.sku,
          itemName: selectedItem.name,
          category: selectedItem.category,
          unit: selectedItem.unit,
          quantity: qty.toString(),
          buyPrice: selectedItem.buyPrice.toString(),
          sellPrice: outboundPrice || selectedItem.sellPrice.toString(),
          type: 'OUT',
          notes: outboundNotes || null,
          recipient,
          recipientCity: chosenCity?.name || '',
          recipientAddr: recipientAddress || '',
          courierName: chosenCourier?.name || '',
          courierCode: selectedCourierCode,
          awbNumber: generatedResi,
          shippingCost: chosenCourier?.cost || 0,
          paymentMethod: paymentMethod === 'tunai' ? 'Tunai' : 'Non-Tunai',
        })
      })

      if (!res.ok) throw new Error('Failed to dispatch')
      const data = await res.json()
      
      showNotification(t('outbound_dispatch_success_toast'), 'success')
      
      // Auto check and trigger Telegram Alert if below threshold
      if (data.item) {
        checkAndSendTelegramAlert(data.item)
      }
      setOutboundQty('')
      setRecipient('')
      setRecipientAddress('')
      setOutboundNotes('')
      setSelectedItemId('')
      setSelectedProvinceId('')
      setSelectedCityId('')
      setCustomResi('')
      setShippingOptions([])
      setPaymentMethod('tunai')
      
      fetchInventory()
      fetchDispatchHistory()
    } catch (err) {
      showNotification(t('outbound_dispatch_fail_toast'), 'error')
    } finally {
      setIsDispatchLoading(false)
    }
  }

  // Build label data from structured transaction fields (no more string parsing!)
  const buildLabelData = (row: any) => {
    const item = row.item
    const qty = row.quantity
    return {
      recipient:     row.recipient     || 'Umum',
      city:          row.recipientCity || 'Yogyakarta',
      address:       row.recipientAddr || 'Alamat tidak diisi',
      courier:       row.courierName   || 'Ekspedisi Standard',
      courierCode:   row.courierCode   || '',
      ongkir:        row.shippingCost > 0
                       ? 'Rp ' + row.shippingCost.toLocaleString('id-ID')
                       : 'Rp 0',
      resi:          row.awbNumber     || 'AWB-000000',
      paymentMethod: row.paymentMethod || 'Tunai',
      itemName:      item?.name        || 'Barang Logistik',
      qty,
      unit:          item?.unit        || 'pcs',
      weight:        ((item?.weight || 0.5) * qty).toFixed(1) + ' kg',
      date:          row.createdAt
                       ? new Date(row.createdAt).toLocaleDateString('id-ID')
                       : new Date().toLocaleDateString('id-ID'),
      notes:         row.notes         || '',
    }
  }

  const handleOpenPrintModal = (row: any) => {
    setActiveLabelData(buildLabelData(row))
    setIsPrintModalOpen(true)
  }

  // Snappy client-side filtering for daily dispatch tracking
  const filteredDispatchHistory = dispatchHistory.filter((row: any) => {
    const searchLower = dispatchSearch.trim().toLowerCase()
    if (!searchLower) return true
    
    const itemName = (row.item?.name || '').toLowerCase()
    const sku = (row.item?.sku || '').toLowerCase()
    const rec = (row.recipient || '').toLowerCase()
    const city = (row.recipientCity || '').toLowerCase()
    const awb = (row.awbNumber || '').toLowerCase()
    const courier = (row.courierName || '').toLowerCase()
    
    return itemName.includes(searchLower) ||
           sku.includes(searchLower) ||
           rec.includes(searchLower) ||
           city.includes(searchLower) ||
           awb.includes(searchLower) ||
           courier.includes(searchLower)
  })

  return (
    <div className="page-container">
      {/* CSS @media print block injection for flawless thermal labels */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide all application elements */
          body * {
            visibility: hidden !important;
          }
          /* Make shipping label visible and fit standard A6 */
          .print-label-paper, .print-label-paper * {
            visibility: visible !important;
          }
          .print-label-paper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            border: 2px solid #000000 !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
        }

        @media (max-width: 768px) {
          .packaging-grid, .dispatch-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .inner-form-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .responsive-table-card {
            padding: 0.75rem !important;
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
            align-items: flex-start !important;
            padding: 0.6rem 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            text-align: right !important;
            font-size: 0.85rem !important;
            white-space: normal !important;
            max-width: none !important;
            word-break: normal !important;
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
            align-items: flex-end !important;
            text-align: right !important;
            width: 100% !important;
          }
          .responsive-table td.shipping-info-cell {
            display: block !important;
            text-align: left !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            padding: 0.75rem 0 !important;
          }
          .responsive-table td.shipping-info-cell::before {
            display: block !important;
            margin-bottom: 0.5rem !important;
            text-align: left !important;
          }
          .responsive-table td.shipping-info-cell .td-wrapper {
            display: block !important;
            text-align: left !important;
            width: 100% !important;
          }
          .responsive-table td.shipping-info-cell .recipient-address {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            text-align: left !important;
            margin-top: 0.25rem !important;
          }
          .responsive-table td.shipping-info-cell .shipping-badges-container {
            justify-content: flex-start !important;
            margin-top: 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .print-modal-overlay {
            align-items: flex-start !important;
            overflow-y: auto !important;
            padding: 1.5rem 0.75rem !important;
          }
          .print-modal-card {
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
            padding: 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-label-paper {
            transform: scale(0.85) !important;
            transform-origin: top center !important;
            margin-bottom: -50px !important;
          }
        }

        /* Simulator paper roll container */
        .simulator-printer-box {
          position: relative;
          background: #1e293b;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          height: 380px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: inset 0 4px 12px rgba(0,0,0,0.5);
        }
        .simulator-printer-slot {
          background: #0f172a;
          height: 12px;
          border-radius: 6px;
          margin: 15px 20px 0 20px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05);
          position: relative;
          z-index: 10;
        }
        .simulator-paper-feed {
          background: #fdfdfd;
          color: #111111;
          margin: 0 30px;
          padding: 20px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          border-left: 1px dashed #cccccc;
          border-right: 1px dashed #cccccc;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.4;
          min-height: 340px;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          /* Smooth scrollbar for retro receipt */
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }
        /* Jagged bottom edge for visual torn effect */
        .simulator-paper-feed::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8px;
          background-image: linear-gradient(135deg, transparent 50%, #fdfdfd 50%), linear-gradient(45deg, transparent 50%, #fdfdfd 50%);
          background-size: 8px 8px;
          background-repeat: repeat-x;
        }
        .simulator-paper-feed::-webkit-scrollbar {
          width: 4px;
        }
        .simulator-paper-feed::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
        }
        .thermal-line {
          white-space: pre-wrap;
          word-break: break-all;
        }
        .thermal-bold {
          font-weight: bold;
        }
        .thermal-size-double-height {
          transform: scaleY(1.4);
          transform-origin: left center;
          display: inline-block;
          margin-bottom: 2px;
        }
        .thermal-size-double-width {
          transform: scaleX(1.4);
          transform-origin: left center;
          display: inline-block;
          letter-spacing: 0.5px;
        }
        .thermal-size-double-both {
          transform: scale(1.4);
          transform-origin: left center;
          display: inline-block;
          margin: 2px 0;
          letter-spacing: 0.5px;
        }
        .thermal-divider {
          border-top: 1px dashed #333333;
          margin: 6px 0;
          width: 100%;
        }
        .thermal-barcode-box {
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .thermal-barcode-bars {
          letter-spacing: 1.5px;
          font-weight: 100;
          font-family: monospace;
          color: #000000;
          font-size: 20px;
          background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);
          width: 120px;
          height: 35px;
          margin-bottom: 4px;
        }
        
        /* Light mode adjustments for simulator box */
        .light-mode .simulator-printer-box {
          background: #e2e8f0;
          border-color: rgba(15,23,42,0.1);
        }
        .light-mode .simulator-printer-slot {
          background: #1e293b;
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

      {/* Shipping Label Print Preview Modal */}
      <AnimatePresence>
        {isPrintModalOpen && activeLabelData && (
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
                maxWidth: printMethod === 'bluetooth' && showSimulator ? '840px' : '440px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                transition: 'max-width 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Printer size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('preview_shipping_label')}</h3>
                </div>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab Selector: System Print vs Bluetooth */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setPrintMethod('system')}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: printMethod === 'system' ? 'var(--primary)' : 'transparent',
                    color: printMethod === 'system' ? '#0b1329' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                  }}
                >
                  <Printer size={14} />
                  <span>Sistem Print (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMethod('bluetooth')}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: printMethod === 'bluetooth' ? 'var(--primary)' : 'transparent',
                    color: printMethod === 'bluetooth' ? '#0b1329' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                  }}
                >
                  <Bluetooth size={14} />
                  <span>Bluetooth Thermal</span>
                </button>
              </div>

              {printMethod === 'system' ? (
                <>
                  <div className="print-label-paper" style={{
                    background: '#ffffff', color: '#000000', border: '2px solid #000000',
                    borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column',
                    gap: '10px', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', border: '2px solid #000000', padding: '4px 10px', borderRadius: '4px' }}>
                        {activeLabelData.courier.toUpperCase().includes('J&T') ? 'J&T' : activeLabelData.courier.toUpperCase().includes('SICEPAT') ? 'SICEPAT' : 'JNE'}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>PT. RIFINITY LOGISTIK</div>
                        <div style={{ fontSize: '8px', color: '#555555', fontWeight: 600 }}>WMS FULFILLMENT CENTER</div>
                      </div>
                    </div>

                    {/* Barcode representation */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 0', borderBottom: '2px solid #000000' }}>
                      <BarcodeSVG value={activeLabelData.resi} />
                    </div>

                    {/* Receiver / Sender Blocks */}
                    <div style={{ borderBottom: '2px solid #000000', paddingBottom: '8px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', fontSize: '9px' }}>
                      <div>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#555555', display: 'block', marginBottom: '2px' }}>{t('receiver_label').toUpperCase()}</span>
                        <strong style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>{activeLabelData.recipient}</strong>
                        <span style={{ display: 'block', lineHeight: '1.3', fontSize: '9px', fontWeight: 500 }}>{activeLabelData.address}</span>
                        <strong style={{ fontSize: '10px', display: 'block', marginTop: '4px' }}>{activeLabelData.city.toUpperCase()}</strong>
                      </div>
                      <div style={{ borderLeft: '1px dashed #000000', paddingLeft: '10px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#555555', display: 'block', marginBottom: '2px' }}>{t('sender_label').toUpperCase()}</span>
                        <strong style={{ fontSize: '10px', display: 'block' }}>{companyName}</strong>
                        <span style={{ display: 'block', fontSize: '9px', color: '#333333' }}>{companyAddress}</span>
                      </div>
                    </div>

                    {/* Package details */}
                    <div style={{ borderBottom: '2px solid #000000', paddingBottom: '6px', fontSize: '9px' }}>
                      <span style={{ fontSize: '8px', fontWeight: 800, color: '#555555', display: 'block', marginBottom: '2px' }}>{t('package_content_label').toUpperCase()}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '10px' }}>
                        <span>{activeLabelData.itemName}</span>
                        <span>x{activeLabelData.qty} {activeLabelData.unit}</span>
                      </div>
                    </div>

                    {/* Footer: payment & ongkir info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                      <div>
                        <span>{t('weight_label')} <strong>{activeLabelData.weight}</strong></span>
                      </div>
                      <div>
                        <span>{t('courier_label')} <strong>{activeLabelData.courier}</strong></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <div style={{ border: '2px solid #000000', padding: '1px 5px', fontWeight: 900, borderRadius: '3px', fontSize: '8px' }}>
                          {activeLabelData.paymentMethod?.includes('Non-Tunai') ? t('payment_non_cash').toUpperCase() : t('payment_cash').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Print Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => setIsPrintModalOpen(false)}
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
                        `Apakah Anda yakin ingin mencetak label logistik dengan resi ${activeLabelData?.resi || ''} menggunakan printer sistem?`,
                        () => window.print()
                      )}
                      className="btn-primary"
                      style={{
                        flex: 1.5, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      <Printer size={16} />
                      {t('print_physical_label')}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: showSimulator ? '1.1fr 0.9fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
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
                      <div>• Format Barcode: <strong>Standard Code 128 (AWB)</strong></div>
                      <div>• Ukuran Roll Kertas: <strong>58mm / 80mm Autowidth</strong></div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <button 
                        type="button"
                        onClick={() => setIsPrintModalOpen(false)}
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
                          `Apakah Anda yakin ingin mengirim perintah cetak label dengan resi ${activeLabelData?.resi || ''} ke printer thermal?`,
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
                                          <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>{seg.barcodeValue}</span>
                                        </div>
                                      );
                                    }
                                    
                                    let sizeClass = 'thermal-line';
                                    if (seg.bold) sizeClass += ' thermal-bold';
                                    if (seg.size === 'double-height') sizeClass += ' thermal-size-double-height';
                                    else if (seg.size === 'double-width') sizeClass += ' thermal-size-double-width';
                                    else if (seg.size === 'double-both') sizeClass += ' thermal-size-double-both';
                                    
                                    return (
                                      <span key={sIdx} className={sizeClass}>
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

      <header className="dashboard-header">
        <div>
          <h1 className="page-title">{t('smart_outbound')}</h1>
          <p className="page-subtitle">{t('smart_outbound_subtitle')}</p>
        </div>
      </header>

      {/* Modern Glassmorphic Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('dispatch')}
          style={{
            background: activeTab === 'dispatch' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'dispatch' ? '#0b1329' : 'white',
            border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
          }}
        >
          <Truck size={16} />
          {t('tab_dispatch')}
        </button>

        <button 
          onClick={() => setActiveTab('packaging')}
          style={{
            background: activeTab === 'packaging' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'packaging' ? '#0b1329' : 'white',
            border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} />
          {t('tab_packaging_assistant')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'packaging' ? (
          <motion.div
            key="packaging-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <div className="packaging-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Package size={20} className="text-primary" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('dimensions_weight_card')}</h3>
                </div>
                <form onSubmit={handleCalculate}>
                  <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { key: 'length', label: t('length_cm'), placeholder: '30' },
                      { key: 'width', label: t('width_cm'), placeholder: '20' },
                      { key: 'height', label: t('height_cm'), placeholder: '15' },
                      { key: 'weight', label: t('weight_kg'), placeholder: '5.5' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{field.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={field.placeholder}
                          value={dimensions[field.key as keyof typeof dimensions]}
                          onChange={e => setDimensions(p => ({ ...p, [field.key]: e.target.value }))}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                    {isLoading ? `🔄 ${t('analyzing_loading')}...` : <><Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{t('recommend_packaging')}</>}
                  </button>
                </form>
              </div>

              <div>
                {result ? (
                  <motion.div className="card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <Sparkles size={20} className="text-primary" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('ai_recommendation_title')}</h3>
                    </div>
                    <div style={{ 
                       padding: '1.25rem', 
                       background: 'rgba(59,130,246,0.08)', 
                       borderRadius: '12px', 
                       border: '1px solid rgba(59,130,246,0.2)',
                       marginBottom: '1rem'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>{t('recommended_packaging_sub')}</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>{result.type}</p>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                        <strong>{t('reason')}:</strong> {result.reason}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '0.875rem 1rem', 
                      background: 'rgba(245,158,11,0.08)', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(245,158,11,0.2)',
                      fontSize: '0.875rem',
                      color: 'var(--warning)'
                    }}>
                      💡 {result.material}
                    </div>
                  </motion.div>
                ) : (
                  <div className="card glass" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                    <div className="empty-state">
                      <PackageCheck size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>{t('ai_recommendation_empty_tip')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card glass responsive-table-card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} />
                {t('packaging_history_title')}
              </h3>
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{t('table_dimensions')}</th>
                    <th>{t('weight_kg')}</th>
                    <th>{t('table_packaging')}</th>
                    <th>{t('table_time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('no_data')}</td></tr>
                  ) : history.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t('table_dimensions')}>
                        <div className="td-wrapper">
                          {row.length}×{row.width}×{row.height}
                        </div>
                      </td>
                      <td data-label={t('weight_kg')}>
                        <div className="td-wrapper">
                          {row.weight} kg
                        </div>
                      </td>
                      <td data-label={t('table_packaging')}>
                        <div className="td-wrapper">
                          <span className="badge badge-primary">{row.recommendation}</span>
                        </div>
                      </td>
                      <td data-label={t('table_time')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        <div className="td-wrapper">
                          {new Date(row.createdAt).toLocaleString('id-ID')} WIB
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dispatch-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
          >
            <div className="dispatch-grid" style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '1.5rem' }}>
              {/* Outbound Form */}
              <div className="card glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <Truck size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('outbound_form_title')}</h3>
                </div>
                
                <form onSubmit={handleDispatch}>
                  <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('select_item')}</label>
                      <select
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                        required
                        style={{
                          width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white', fontSize: '0.875rem', outline: 'none'
                        }}
                      >
                        <option value="" style={{ background: '#0b1329' }}>-- {t('select_item')} --</option>
                        {itemsList.map(item => (
                          <option key={item.id} value={item.id} style={{ background: '#0b1329' }}>
                            {item.name} ({item.sku}) - {t('table_storage_rack').split('&')[0].trim()}: {item.quantity}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('recipient_name')}</label>
                      <ContactAutocomplete
                        type="CUSTOMER"
                        value={recipient}
                        onChange={val => setRecipient(val)}
                        onSelect={contact => {
                          setRecipient(contact.name)
                          if (contact.address) setRecipientAddress(contact.address)
                        }}
                        placeholder={t('recipient_name')}
                        id="outbound-recipient"
                      />
                    </div>
                  </div>

                  <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('outbound_qty')}</label>
                      <input
                        type="number"
                        placeholder={t('outbound_qty')}
                        value={outboundQty}
                        onChange={e => setOutboundQty(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('sell_price_unit_rp')}</label>
                      <input
                        type="number"
                        placeholder="Nominal Rupiah"
                        value={outboundPrice}
                        onChange={e => setOutboundPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* SHIPPING API SIMULATION FIELDS (38 Provinces & 450+ Cities cascading) */}
                  <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <MapPin size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('address_shipping_title')}</span>
                    </div>

                    <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{t('destination_province')}</label>
                        <select
                          value={selectedProvinceId}
                          onChange={e => {
                            setSelectedProvinceId(e.target.value)
                            setSelectedCityId('') // Reset city when province changes
                          }}
                          required
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.8rem', outline: 'none'
                          }}
                        >
                          <option value="" style={{ background: '#0b1329' }}>-- {t('destination_province')} --</option>
                          {provincesList.map(prov => (
                            <option key={prov.id} value={prov.id} style={{ background: '#0b1329' }}>
                              {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{t('destination_city')}</label>
                        <select
                          value={selectedCityId}
                          onChange={e => setSelectedCityId(e.target.value)}
                          required
                          disabled={!selectedProvinceId}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.8rem', outline: 'none',
                            opacity: selectedProvinceId ? 1 : 0.5
                          }}
                        >
                          <option value="" style={{ background: '#0b1329' }}>-- {t('destination_city')} --</option>
                          {citiesList
                            .filter(city => city.provinceId === selectedProvinceId)
                            .map(city => (
                              <option key={city.id} value={city.id} style={{ background: '#0b1329' }}>
                                {city.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="inner-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{t('full_destination_address')}</label>
                        <textarea
                          placeholder={t('full_destination_address')}
                          value={recipientAddress}
                          onChange={e => setRecipientAddress(e.target.value)}
                          rows={1}
                          style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.8rem', outline: 'none', resize: 'vertical'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{t('resi_awb_number')}</label>
                        <input
                          type="text"
                          placeholder={t('resi_placeholder')}
                          value={customResi}
                          onChange={e => setCustomResi(e.target.value)}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    {/* Dynamic Real-Time Shipping Options (Like RajaOngkir API Response!) */}
                    {isShippingLoading && (
                      <div style={{ textAlign: 'center', padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                        🔄 {t('calculating_shipping_loading')}
                      </div>
                    )}

                    {!isShippingLoading && shippingOptions.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>{t('available_courier_services')}</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {shippingOptions.map(opt => {
                            const isSelected = selectedCourierCode === opt.code
                            return (
                              <div 
                                key={opt.code}
                                onClick={() => setSelectedCourierCode(opt.code)}
                                style={{
                                  padding: '0.75rem 1rem', borderRadius: '8px',
                                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input 
                                    type="radio" 
                                    checked={isSelected}
                                    onChange={() => setSelectedCourierCode(opt.code)}
                                    style={{ width: 'auto', cursor: 'pointer' }}
                                  />
                                  <div>
                                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'white' }}>{opt.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>ETA: {opt.eta}</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399' }}>Rp {opt.cost.toLocaleString('id-ID')}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('payment_method_label')}</label>
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('tunai')}
                        style={{
                          flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                          background: paymentMethod === 'tunai' ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                          color: paymentMethod === 'tunai' ? '#0b1329' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.2s'
                        }}
                      >
                        💵 {t('payment_cash')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('non-tunai')}
                        style={{
                          flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                          background: paymentMethod === 'non-tunai' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                          color: paymentMethod === 'non-tunai' ? 'white' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.2s'
                        }}
                      >
                        📲 {t('payment_non_cash')}
                      </button>
                    </div>
                  </div>


                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{t('additional_shipping_notes')}</label>
                    <textarea
                      placeholder={t('additional_shipping_notes')}
                      value={outboundNotes}
                      onChange={e => setOutboundNotes(e.target.value)}
                      rows={1}
                      style={{
                        width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '0.875rem', outline: 'none', resize: 'vertical'
                      }}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isDispatchLoading}>
                    {isDispatchLoading ? `🔄 ${t('dispatch_processing_loading')}...` : <><Send size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />{t('dispatch_outbound_btn')}</>}
                  </button>
                </form>
              </div>

              {/* Real-time Inventory & Shipping Cost Insight */}
              <div>
                <div className="card glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <PackageCheck size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('details_cost_estimation')}</h3>
                  </div>

                  {selectedItem ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                      <div style={{ padding: '0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>{t('table_item_name')}</p>
                        <p style={{ fontSize: '0.925rem', fontWeight: 700 }}>{selectedItem.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>SKU: {selectedItem.sku} | {t('weight_kg')}: {selectedItem.weight || 0.5} kg</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)' }}>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(16,185,129,0.8)', display: 'block' }}>{t('warehouse_stock')}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{selectedItem.quantity} {selectedItem.unit}</span>
                        </div>
                        <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.1)' }}>
                          <span style={{ fontSize: '0.65rem', color: 'rgba(245,158,11,0.8)', display: 'block' }}>{t('total_package_weight')}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                            {((selectedItem.weight || 0.5) * parseInt(outboundQty || '0')).toFixed(1)} kg
                          </span>
                        </div>
                      </div>

                      {/* Financial Preview Card */}
                      {selectedCourierCode && shippingOptions.length > 0 && (
                        <div style={{ 
                          padding: '1rem', 
                          background: 'rgba(59,130,246,0.06)', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(59,130,246,0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Tag size={12} /> {t('outbound_value_details')}
                          </span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                            <span>{t('items_subtotal')}:</span>
                            <span>Rp {( (parseFloat(outboundPrice) || selectedItem.sellPrice) * parseInt(outboundQty || '0') ).toLocaleString('id-ID')}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                            <span>{t('shipping_fee')}:</span>
                            <span>Rp {(shippingOptions.find(o => o.code === selectedCourierCode)?.cost || 0).toLocaleString('id-ID')}</span>
                          </div>

                          <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                            <span>{t('total_estimated_transaction')}</span>
                            <span>
                              Rp {(
                                ( (parseFloat(outboundPrice) || selectedItem.sellPrice) * parseInt(outboundQty || '0') ) +
                                ( shippingOptions.find(o => o.code === selectedCourierCode)?.cost || 0 )
                              ).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )}

                      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                        <span>{t('estimation_real_geographical_tip')}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', textAlign: 'center' }}>
                      {t('select_item_estimation_tip')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Outbound Dispatch Logs with Real-time Search */}
            <div className="card glass responsive-table-card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <History size={18} />
                  {t('outbound_history_title')}
                </h3>
                
                {/* Snappy Real-time Filter Bar */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder={t('outbound_history_search_placeholder')}
                    value={dispatchSearch}
                    onChange={e => setDispatchSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.8rem',
                      outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  {dispatchSearch && (
                    <button 
                      onClick={() => setDispatchSearch('')}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{t('table_item_name')}</th>
                    <th>{t('table_outbound_qty')}</th>
                    <th>{t('table_item_value_label')}</th>
                    <th>{t('table_expedition_resi_recipient')}</th>
                    <th>{t('table_time')}</th>
                    <th style={{ textAlign: 'center' }}>{t('table_label')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatchHistory.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('empty_outbound_history_alert')}</td></tr>
                  ) : filteredDispatchHistory.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t('table_item_name')} style={{ fontWeight: 600 }}>
                        <div className="td-wrapper">
                          {row.item?.name || 'Unknown'}
                        </div>
                      </td>
                      <td data-label={t('table_outbound_qty')}>
                        <div className="td-wrapper">
                          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowUpRight size={12} /> {row.quantity} {row.item?.unit || 'pcs'}
                          </span>
                        </div>
                      </td>
                      <td data-label={t('table_item_value_label')} style={{ fontWeight: 600, color: '#f87171' }}>
                        <div className="td-wrapper">
                          Rp {row.totalValue.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="shipping-info-cell" data-label={t('table_expedition_resi_recipient')} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', maxWidth: '380px', lineHeight: 1.4 }}>
                        <div className="td-wrapper">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                            <div style={{ textAlign: 'inherit' }}>👤 <strong>{row.recipient || 'Umum'}</strong> ({row.recipientCity || 'Yogyakarta'})</div>
                            <div className="recipient-address" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'inherit' }}>📍 {row.recipientAddr || t('address_not_written')}</div>
                            <div className="shipping-badges-container" style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                🚚 {row.courierName || 'Standard'}
                              </span>
                              <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                📦 {row.awbNumber || '-'}
                              </span>
                              <span style={{ background: row.paymentMethod === 'Non-Tunai' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', color: row.paymentMethod === 'Non-Tunai' ? '#818cf8' : '#34d399', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                {row.paymentMethod === 'Non-Tunai' ? `📲 ${t('payment_non_cash')}` : `💵 ${t('payment_cash')}`}
                              </span>
                            </div>
                            {row.notes && (
                              <div style={{ fontStyle: 'italic', fontSize: '0.75rem', marginTop: '2px', color: 'var(--warning)', textAlign: 'inherit' }}>
                                💬 {t('table_notes')}: {row.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label={t('table_time')} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        <div className="td-wrapper">
                          {new Date(row.createdAt).toLocaleString('id-ID')} WIB
                        </div>
                      </td>
                      <td data-label={t('table_label')} style={{ textAlign: 'center' }}>
                        <div className="td-wrapper">
                          <button
                            onClick={() => handleOpenPrintModal(row)}
                            className="btn-secondary btn-sm"
                            style={{
                              padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--primary)',
                              borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.2)'
                              e.currentTarget.style.borderColor = 'var(--primary)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.12)'
                              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'
                            }}
                          >
                            <Printer size={12} />
                            {t('print_btn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
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
    </div>
  )
}
