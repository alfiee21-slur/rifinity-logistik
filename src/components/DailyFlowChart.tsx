'use client'

import React, { useRef, useState, useCallback } from 'react'

interface DayData {
  date: string
  fullDate: string
  inbound: number
  outbound: number
}

interface Props {
  data: DayData[]
}

// Catmull-Rom → Cubic Bezier for smooth curves
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const d: string[] = [`M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`)
  }
  return d.join(' ')
}

export default function DailyFlowChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    idx: number
  }>({ visible: false, x: 0, y: 0, idx: 0 })

  const W = 800
  const H = 200
  const PAD_L = 52
  const PAD_R = 16
  const PAD_T = 16
  const PAD_B = 32

  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const maxVal = Math.max(...data.flatMap(d => [d.inbound, d.outbound]), 1)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxVal))

  const xOf = (i: number) => PAD_L + (i / (data.length - 1)) * chartW
  const yOf = (v: number) => PAD_T + chartH - (v / (maxVal * 1.1)) * chartH

  const inPts: [number, number][] = data.map((d, i) => [xOf(i), yOf(d.inbound)])
  const outPts: [number, number][] = data.map((d, i) => [xOf(i), yOf(d.outbound)])

  const inLine = smoothPath(inPts)
  const outLine = smoothPath(outPts)

  const inArea = inLine + ` L${xOf(data.length - 1).toFixed(2)},${(PAD_T + chartH).toFixed(2)} L${PAD_L.toFixed(2)},${(PAD_T + chartH).toFixed(2)} Z`
  const outArea = outLine + ` L${xOf(data.length - 1).toFixed(2)},${(PAD_T + chartH).toFixed(2)} L${PAD_L.toFixed(2)},${(PAD_T + chartH).toFixed(2)} Z`

  // Show every 5th date label
  const xLabels = data.filter((_, i) => i === 0 || i === data.length - 1 || i % 5 === 0)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const mx = (e.clientX - rect.left) * scaleX
    // Find nearest index
    const idx = Math.round(((mx - PAD_L) / chartW) * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    setTooltip({ visible: true, x: xOf(clamped), y: 0, idx: clamped })
  }, [data.length, chartW])

  const handleMouseLeave = () => setTooltip(t => ({ ...t, visible: false }))

  const activeDay = data[tooltip.idx]
  const cursorX = tooltip.visible ? xOf(tooltip.idx) : -1

  const totalIn = data.reduce((s, d) => s + d.inbound, 0)
  const totalOut = data.reduce((s, d) => s + d.outbound, 0)
  const peakDay = data.reduce((p, c) => (c.inbound + c.outbound > p.inbound + p.outbound ? c : p), data[0])

  return (
    <div style={{ width: '100%' }}>
      {/* Summary pills row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: '📥 Masuk (30 hari)', value: totalIn.toLocaleString('id-ID') + ' unit', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: '#60a5fa' },
          { label: '📤 Keluar (30 hari)', value: totalOut.toLocaleString('id-ID') + ' unit', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)', color: '#f472b6' },
          ...(peakDay.inbound + peakDay.outbound > 0 ? [{
            label: '🔥 Hari Tersibuk', value: `${peakDay.date} · ${(peakDay.inbound + peakDay.outbound).toLocaleString('id-ID')} unit`,
            bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24',
          }] : []),
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 100, padding: '5px 16px', fontSize: 12, color: p.color, fontWeight: 600, display: 'flex', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{p.label}:</span>
            {p.value}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Tooltip */}
        {tooltip.visible && activeDay && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: `calc(${((xOf(tooltip.idx) - PAD_L) / (W - PAD_L - PAD_R)) * 100}% * ${(W - PAD_L - PAD_R) / W} + ${(PAD_L / W) * 100}%)`,
            transform: tooltip.idx > data.length * 0.7 ? 'translateX(-110%)' : 'translateX(12px)',
            background: 'rgba(10, 15, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginBottom: 8 }}>{activeDay.date}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, boxShadow: '0 0 6px #3b82f6' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Inbound</span>
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{activeDay.inbound.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', flexShrink: 0, boxShadow: '0 0 6px #ec4899' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Outbound</span>
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#f472b6' }}>{activeDay.outbound.toLocaleString('id-ID')}</span>
              </div>
              {(activeDay.inbound + activeDay.outbound) > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  <span>Total</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{(activeDay.inbound + activeDay.outbound).toLocaleString('id-ID')} unit</span>
                </div>
              )}
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: 220, display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="dfc-gradIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="dfc-gradOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#ec4899" stopOpacity="0.01" />
            </linearGradient>
            <filter id="glow-in">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-out">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="chart-clip">
              <rect x={PAD_L} y={PAD_T} width={chartW} height={chartH + 2} />
            </clipPath>
          </defs>

          {/* Y-axis grid lines + labels */}
          {yTicks.map((tick, i) => {
            const y = yOf(tick)
            return (
              <g key={i}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={i === 0 ? 'none' : '4,4'} />
                <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="Inter, sans-serif">
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            )
          })}

          {/* Baseline */}
          <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Filled areas */}
          <g clipPath="url(#chart-clip)">
            <path d={inArea} fill="url(#dfc-gradIn)" />
            <path d={outArea} fill="url(#dfc-gradOut)" />

            {/* Smooth lines with glow */}
            <path d={inLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow-in)" opacity="0.5" />
            <path d={inLine} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

            <path d={outLine} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow-out)" opacity="0.5" />
            <path d={outLine} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>

          {/* Cursor vertical line + active dots */}
          {tooltip.visible && (
            <g>
              <line
                x1={cursorX} y1={PAD_T} x2={cursorX} y2={PAD_T + chartH}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,3"
              />
              {activeDay.inbound > 0 && (
                <>
                  <circle cx={cursorX} cy={yOf(activeDay.inbound)} r="5" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5" />
                  <circle cx={cursorX} cy={yOf(activeDay.inbound)} r="2.5" fill="#60a5fa" />
                </>
              )}
              {activeDay.outbound > 0 && (
                <>
                  <circle cx={cursorX} cy={yOf(activeDay.outbound)} r="5" fill="#3d1a2e" stroke="#f472b6" strokeWidth="1.5" />
                  <circle cx={cursorX} cy={yOf(activeDay.outbound)} r="2.5" fill="#f472b6" />
                </>
              )}
            </g>
          )}

          {/* X-axis date labels */}
          {data.map((d, i) => {
            if (i !== 0 && i !== data.length - 1 && i % 5 !== 0) return null
            return (
              <text
                key={i}
                x={xOf(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.3)"
                fontFamily="Inter, sans-serif"
              >
                {d.date}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 500 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ width: 24, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', display: 'inline-block' }} />
          Inbound (Masuk)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ width: 24, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #ec4899, #f472b6)', display: 'inline-block' }} />
          Outbound (Keluar)
        </span>
      </div>
    </div>
  )
}
