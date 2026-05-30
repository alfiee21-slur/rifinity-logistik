'use client'

import React, { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useRouter } from 'next/navigation'

export default function SearchToAction() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    // Navigate to inventory with search query
    router.push(`/inventory?search=${encodeURIComponent(query)}`)
  }

  const handleAskAI = () => {
    if (!query.trim()) return
    window.dispatchEvent(new CustomEvent('ai-search', { detail: query }))
    setQuery('')
  }

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className={`search-wrapper ${isFocused ? 'focused' : ''}`}>
        <div className="search-icon-wrapper">
          <Search size={20} className="search-icon" />
        </div>
        <input 
          type="text" 
          placeholder="Tampilkan barang yang masuk hari ini..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="search-input"
        />
        <div className="search-actions">
          <AnimatePresence>
            {query && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ai-btn"
                type="button"
                onClick={handleAskAI}
              >
                <Sparkles size={16} />
                <span>Ask AI</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  )
}
