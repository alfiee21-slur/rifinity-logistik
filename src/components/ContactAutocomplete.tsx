'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, UserPlus, X } from 'lucide-react'

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
}

interface ContactAutocompleteProps {
  type: 'SUPPLIER' | 'CUSTOMER'
  value: string
  onChange: (value: string) => void
  onSelect?: (contact: Contact) => void
  placeholder?: string
  label?: string
  id?: string
  required?: boolean
}

export default function ContactAutocomplete({
  type,
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  id,
  required = false
}: ContactAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Contact[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    setIsFetching(true)
    try {
      const res = await fetch(`/api/contacts?type=${type}&q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
        setIsOpen(true)
        setHighlightedIndex(-1)
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsFetching(false)
    }
  }, [type])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleSelect = (contact: Contact) => {
    onChange(contact.name)
    setSuggestions([])
    setIsOpen(false)
    if (onSelect) onSelect(contact)
  }

  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setIsOpen(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const defaultPlaceholder = type === 'SUPPLIER' ? 'Cari atau ketik nama supplier...' : 'Cari atau ketik nama pelanggan...'

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .autocomplete-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
          margin-bottom: 0.35rem;
        }
        .light-mode .autocomplete-label {
          color: rgba(15,23,42,0.7) !important;
        }
        .autocomplete-search-icon {
          position: absolute;
          left: 0.75rem;
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
          pointer-events: none;
        }
        .light-mode .autocomplete-search-icon {
          color: rgba(15,23,42,0.4) !important;
        }
        .autocomplete-input {
          width: 100%;
          padding-left: 2.25rem;
          padding-top: 0.625rem;
          padding-bottom: 0.625rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: var(--text-primary, white);
          fontSize: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .light-mode .autocomplete-input {
          background: rgba(15,23,42,0.02) !important;
          border-color: rgba(15,23,42,0.08) !important;
          color: #0f172a !important;
        }
        .autocomplete-clear-btn {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 3px;
          display: flex;
          align-items: center;
          color: rgba(255,255,255,0.35);
        }
        .light-mode .autocomplete-clear-btn {
          color: rgba(15,23,42,0.4) !important;
        }
        .contact-autocomplete-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.97);
          border: 1px solid rgba(96,165,250,0.2);
          border-radius: 10px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
          overflow: hidden;
          max-height: 220px;
          overflow-y: auto;
        }
        .light-mode .contact-autocomplete-dropdown {
          background: rgba(255, 255, 255, 0.98) !important;
          border-color: rgba(96,165,250,0.3) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important;
        }
        .autocomplete-item {
          padding: 0.625rem 0.875rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .light-mode .autocomplete-item {
          border-bottom-color: rgba(15,23,42,0.03) !important;
        }
        .autocomplete-item-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .light-mode .autocomplete-item-title {
          color: #0f172a !important;
        }
        .autocomplete-item-subtitle {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.45);
          margin-top: 1px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .light-mode .autocomplete-item-subtitle {
          color: rgba(15,23,42,0.6) !important;
        }
        .autocomplete-item-phone {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .light-mode .autocomplete-item-phone {
          color: rgba(15,23,42,0.4) !important;
        }
      `}} />

      {label && (
        <label htmlFor={id} className="autocomplete-label">
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} className="autocomplete-search-icon" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
          placeholder={placeholder || defaultPlaceholder}
          required={required}
          autoComplete="off"
          className="autocomplete-input"
          style={{
            paddingRight: value ? '2.25rem' : '0.875rem',
          }}
          onFocusCapture={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(96,165,250,0.5)'}
          onBlurCapture={e => (e.target as HTMLInputElement).style.borderColor = ''}
        />
        {isFetching && (
          <div style={{ position: 'absolute', right: '0.75rem', width: '14px', height: '14px', border: '2px solid rgba(96,165,250,0.4)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        )}
        {!isFetching && value && (
          <button type="button" onClick={handleClear} className="autocomplete-clear-btn">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="contact-autocomplete-dropdown">
          {suggestions.map((contact, idx) => (
            <div
              key={contact.id}
              onMouseDown={() => handleSelect(contact)}
              className="autocomplete-item"
              style={{
                background: idx === highlightedIndex ? 'rgba(96,165,250,0.12)' : 'transparent',
                borderBottom: idx === suggestions.length - 1 ? 'none' : undefined,
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <div style={{ minWidth: 0 }}>
                <div className="autocomplete-item-title">
                  {contact.name}
                </div>
                {(contact.company || contact.city) && (
                  <div className="autocomplete-item-subtitle">
                    {[contact.company, contact.city].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              {contact.phone && (
                <span className="autocomplete-item-phone">{contact.phone}</span>
              )}
            </div>
          ))}

          {/* Add new contact shortcut */}
          <div
            onMouseDown={async () => {
              if (!value.trim()) return
              try {
                await fetch('/api/contacts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type, name: value.trim() })
                })
              } catch {}
              setIsOpen(false)
            }}
            style={{
              padding: '0.5rem 0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderTop: '1px solid rgba(96,165,250,0.1)',
              background: 'rgba(96,165,250,0.04)',
            }}
          >
            <UserPlus size={12} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
              Simpan &quot;{value}&quot; sebagai kontak baru
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
