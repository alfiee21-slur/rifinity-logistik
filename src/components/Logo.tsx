'use client'

import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', layout = 'vertical', showText = true, className = '' }: LogoProps) {
  // Determine dimensions based on size parameter
  const sizes = {
    sm: { img: 32, fontPrimary: '14px', fontSecondary: '8px', gap: '8px' },
    md: { img: 48, fontPrimary: '20px', fontSecondary: '10px', gap: '12px' },
    lg: { img: 96, fontPrimary: '36px', fontSecondary: '14px', gap: '16px' }
  }[size]

  const isHorizontal = layout === 'horizontal'

  return (
    <div 
      className={`select-none ${className}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isHorizontal ? sizes.gap : '4px',
      }}
    >
      {/* Logo Mark with Premium Glow */}
      <div 
        style={{
          position: 'relative',
          width: `${sizes.img}px`,
          height: `${sizes.img}px`,
          flexShrink: 0
        }}
      >
        <img
          src="/logo.png"
          alt="Rifinity Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
            transition: 'transform 0.3s ease',
          }}
        />
      </div>

      {/* Premium Metallic Geometric Typography */}
      {showText && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isHorizontal ? 'flex-start' : 'center',
            textAlign: isHorizontal ? 'left' : 'center',
            lineHeight: 1.1,
            fontWeight: 'bold'
          }}
        >
          <span 
            className="logo-text-gradient"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: sizes.fontPrimary,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            Rifinity
          </span>
          <span 
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: sizes.fontSecondary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: '#06b6d4',
              marginTop: '2px',
              opacity: 0.95
            }}
          >
            Logistik
          </span>
        </div>
      )}
    </div>
  )
}
