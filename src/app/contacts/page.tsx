'use client'

import React, { useState, useEffect } from 'react'
import { BookUser, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Building2, X, RefreshCw, Download, Users, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthGuard'

interface Contact {
  id: string
  type: string
  name: string
  company?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
  createdAt: string
}

const emptyForm = {
  type: 'SUPPLIER',
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
}

export default function ContactsPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'MANAGER' || user?.role === 'ADMIN'

  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeTab, setActiveTab] = useState<'SUPPLIER' | 'CUSTOMER'>('SUPPLIER')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [form, setForm] = useState({ ...emptyForm, type: 'SUPPLIER' })
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
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

  const showNotif = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts?limit=1000')
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleAutoImport = () => {
    requestActionConfirm(
      'Konfirmasi Auto-Import',
      'Apakah Anda yakin ingin memindai histori transaksi masuk dan keluar untuk mengimpor kontak secara otomatis? Proses ini akan menganalisis riwayat pengiriman Anda.',
      async () => {
        setImporting(true)
        try {
          const res = await fetch('/api/contacts/import', { method: 'POST' })
          const data = await res.json()
          showNotif(`Berhasil mengimpor ${data.imported} kontak baru dari histori transaksi!`, 'success')
          fetchContacts()
        } catch {
          showNotif('Gagal mengimpor kontak.', 'error')
        } finally {
          setImporting(false)
        }
      }
    )
  }

  const openAddModal = () => {
    setEditContact(null)
    setForm({ ...emptyForm, type: activeTab })
    setShowModal(true)
  }

  const openEditModal = (contact: Contact) => {
    setEditContact(contact)
    setForm({
      type: contact.type,
      name: contact.name,
      company: contact.company || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      city: contact.city || '',
      notes: contact.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const method = editContact ? 'PUT' : 'POST'
      const body = editContact ? { id: editContact.id, ...form } : form
      const res = await fetch('/api/contacts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      showNotif(editContact ? 'Kontak berhasil diperbarui!' : 'Kontak baru berhasil ditambahkan!', 'success')
      setShowModal(false)
      fetchContacts()
    } catch {
      showNotif('Gagal menyimpan kontak.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (contact: Contact) => {
    requestActionConfirm(
      'Hapus Kontak',
      `Apakah Anda yakin ingin menghapus kontak "${contact.name}" dari direktori? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const res = await fetch(`/api/contacts?id=${contact.id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          showNotif('Kontak berhasil dihapus.', 'success')
          setContacts(prev => prev.filter(c => c.id !== contact.id))
        } catch {
          showNotif('Gagal menghapus kontak.', 'error')
        }
      }
    )
  }

  const filtered = contacts.filter(c =>
    c.type === activeTab && (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' }}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`contacts-notification-toast ${notification.type}`}
          >{notification.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookUser size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Buku Alamat</h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Direktori Supplier & Pelanggan Tetap</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleAutoImport}
            disabled={importing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.875rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600,
              cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={13} style={{ animation: importing ? 'spin 0.8s linear infinite' : 'none' }} />
            {importing ? 'Mengimpor...' : 'Auto-Import dari Transaksi'}
          </button>

          {canEdit && (
            <button
              onClick={openAddModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '8px',
                background: 'var(--primary, #3b82f6)', border: 'none',
                color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={15} />
              Tambah Kontak
            </button>
          )}
        </div>
      </div>

      {/* Tab + Search */}
      <div className="card glass" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Tab */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '3px' }}>
            {(['SUPPLIER', 'CUSTOMER'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                  background: activeTab === tab ? 'var(--primary, #3b82f6)' : 'none',
                  color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tab === 'SUPPLIER' ? <Truck size={13} /> : <Users size={13} />}
                {tab === 'SUPPLIER' ? 'Supplier' : 'Pelanggan'}
                <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0 5px' }}>
                  {contacts.filter(c => c.type === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kontak..."
              style={{
                width: '100%', paddingLeft: '2.25rem', paddingRight: '0.875rem',
                paddingTop: '0.5rem', paddingBottom: '0.5rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: 'white', fontSize: '0.8rem', outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: '72px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }} className="animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="card glass" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <BookUser size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Belum ada kontak {activeTab === 'SUPPLIER' ? 'supplier' : 'pelanggan'}.</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>Klik <strong>Auto-Import dari Transaksi</strong> untuk mengisi otomatis.</p>
          </div>
        ) : (
          filtered.map(contact => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card glass"
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: activeTab === 'SUPPLIER' ? 'rgba(96,165,250,0.1)' : 'rgba(236,72,153,0.1)',
                  border: `1px solid ${activeTab === 'SUPPLIER' ? 'rgba(96,165,250,0.2)' : 'rgba(236,72,153,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {activeTab === 'SUPPLIER'
                    ? <Truck size={16} style={{ color: '#60a5fa' }} />
                    : <Users size={16} style={{ color: '#ec4899' }} />
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '2px' }}>
                    {contact.company && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '2px' }}><Building2 size={10} /> {contact.company}</span>}
                    {contact.city && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {contact.city}</span>}
                    {contact.phone && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '2px' }}><Phone size={10} /> {contact.phone}</span>}
                    {contact.email && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '2px' }}><Mail size={10} /> {contact.email}</span>}
                  </div>
                </div>
              </div>

              {canEdit && (
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => openEditModal(contact)} style={{ padding: '5px 8px', borderRadius: '7px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(contact)} style={{ padding: '5px 8px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="confirm-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.75)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '1.5rem' }}>
            <motion.div
              className="confirm-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '480px', textAlign: 'left', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0 }}>{editContact ? 'Edit Kontak' : 'Tambah Kontak Baru'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '4px' }}><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Type selector */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['SUPPLIER', 'CUSTOMER'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: t }))}
                      className={`contacts-modal-btn-option ${form.type === t ? 'active' : ''}`}
                    >
                      {t === 'SUPPLIER' ? '🚚 Supplier' : '👤 Pelanggan'}
                    </button>
                  ))}
                </div>

                {[
                  { key: 'name', label: 'Nama *', placeholder: 'Nama kontak / perusahaan' },
                  { key: 'company', label: 'Perusahaan', placeholder: 'Nama PT/CV (opsional)' },
                  { key: 'phone', label: 'No. Telepon', placeholder: '08xxx' },
                  { key: 'email', label: 'Email', placeholder: 'email@domain.com' },
                  { key: 'city', label: 'Kota', placeholder: 'Jakarta, Surabaya, ...' },
                  { key: 'address', label: 'Alamat Lengkap', placeholder: 'Jl. ...' },
                  { key: 'notes', label: 'Catatan', placeholder: 'Keterangan tambahan' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="contacts-modal-label">{field.label}</label>
                    <input
                      type="text"
                      value={(form as any)[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.key === 'name'}
                      className="contacts-modal-input"
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button type="button" className="modal-btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" disabled={submitting} style={{ flex: 1.5, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary, #3b82f6)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontSize: '0.875rem' }}>
                    {submitting ? 'Menyimpan...' : editContact ? 'Simpan Perubahan' : 'Tambah Kontak'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="confirm-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,22,0.75)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100001, padding: '1.5rem' }}>
            <motion.div
              className="confirm-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '400px', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              <h3 style={{ margin: '0 0 0.5rem' }}>{confirmConfig.title}</h3>
              <p className="contacts-confirm-text" style={{ margin: '0 0 1.25rem', fontSize: '0.85rem' }}>
                {confirmConfig.message}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="modal-btn-cancel" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>Batal</button>
                <button
                  type="button"
                  onClick={confirmConfig.onConfirm}
                  style={{ flex: 1.5, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary, #3b82f6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .contacts-modal-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          margin-bottom: 0.3rem;
        }
        .light-mode .contacts-modal-label {
          color: rgba(15,23,42,0.6) !important;
        }

        .contacts-modal-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: white;
          font-size: 0.875rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .light-mode .contacts-modal-input {
          background: rgba(15,23,42,0.03) !important;
          border-color: rgba(15,23,42,0.1) !important;
          color: #0f172a !important;
        }
        .light-mode .contacts-modal-input:focus {
          border-color: var(--primary) !important;
        }

        .contacts-modal-btn-option {
          flex: 1;
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: all 0.2s;
        }
        .contacts-modal-btn-option.active {
          background: var(--primary, #3b82f6);
          color: white;
          border: none;
        }
        .light-mode .contacts-modal-btn-option {
          background: rgba(15,23,42,0.02) !important;
          color: rgba(15,23,42,0.6) !important;
          border-color: rgba(15,23,42,0.08) !important;
        }
        .light-mode .contacts-modal-btn-option.active {
          background: var(--primary, #3b82f6) !important;
          color: white !important;
          border: none !important;
        }

        .contacts-confirm-text {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.65);
        }
        .light-mode .contacts-confirm-text {
          color: rgba(15,23,42,0.7) !important;
        }
      ` }} />
    </div>
  )
}

