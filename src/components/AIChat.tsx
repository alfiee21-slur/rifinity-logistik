'use client'

import React, { useState } from 'react'
import { Sparkles, X, MessageSquare, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'

export default function AIChat() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([])
  const [hasInit, setHasInit] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Smooth scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Set or update initial welcome message when locale changes
  React.useEffect(() => {
    if (!hasInit) {
      setMessages([{ role: 'assistant', text: t('ai_chat_welcome') }])
      setHasInit(true)
    } else {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant') {
          return [{ role: 'assistant', text: t('ai_chat_welcome') }]
        }
        return prev
      })
    }
  }, [language, t, hasInit])

  // Scroll to bottom on new messages
  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const processResponse = (text: string) => {
    let cleanText = text
    const routeMatch = cleanText.match(/\[ROUTE:\s*(.*?)\]/)
    if (routeMatch) {
      const targetRoute = routeMatch[1].trim()
      cleanText = cleanText.replace(/\[ROUTE:\s*(.*?)\]/g, '')
      setTimeout(() => {
        router.push(targetRoute)
      }, 1000)
    }
    return cleanText
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    const newMessages = [...messages, { role: 'user', text: userMessage }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })
      
      const data = await response.json()
      
      if (data.text) {
        const cleanText = processResponse(data.text)
        setMessages(prev => [...prev, { role: 'assistant', text: cleanText }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${data.error || t('ai_chat_error')}` }])
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `${t('ai_chat_failed')} (${error.message || ''})` }])
    } finally {
      setIsLoading(false)
    }
  }

  const messagesRef = React.useRef(messages)
  React.useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  React.useEffect(() => {
    const handleAiSearch = async (e: any) => {
      const query = e.detail
      if (!query) return
      
      setIsOpen(true)
      
      const newMessages = [...messagesRef.current, { role: 'user', text: query }]
      setMessages(newMessages)
      setIsLoading(true)
      
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })
      .then(res => res.json())
      .then(data => {
        if (data.text) {
          const cleanText = processResponse(data.text)
          setMessages(m => [...m, { role: 'assistant', text: cleanText }])
        } else {
          setMessages(m => [...m, { role: 'assistant', text: `Error: ${data.error || t('ai_chat_error')}` }])
        }
      })
      .catch(err => {
        setMessages(m => [...m, { role: 'assistant', text: `${t('ai_chat_failed')} (${err.message || ''})` }])
      })
      .finally(() => setIsLoading(false))
    }

    window.addEventListener('ai-search', handleAiSearch)
    return () => window.removeEventListener('ai-search', handleAiSearch)
  }, [t])

  return (
    <div className="ai-chat-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="chat-window glass card"
          >
            <div className="chat-header">
              <div className="chat-title">
                <Sparkles size={18} className="text-primary" />
                <span>{t('ai_chat_title')}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  <div 
                    className="message-bubble"
                    dangerouslySetInnerHTML={{ 
                      __html: m.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>') 
                    }}
                  />
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input 
                type="text" 
                placeholder={t('ai_chat_placeholder')} 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="send-btn">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="chat-toggle btn-primary" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <MessageSquare />}
      </button>
    </div>
  )
}
