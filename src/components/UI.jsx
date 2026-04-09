import { useState, useEffect, useCallback } from 'react'

// ─── Toast ─────────────────────────────────────────────────────
let toastFn = null
export function setToastFn(fn) { toastFn = fn }
export function toast(msg, duration = 3000) { toastFn?.(msg, duration) }

export function ToastProvider() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    setToastFn((msg, duration) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
    })
  }, [])
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  )
}

// ─── Spinner ───────────────────────────────────────────────────
export function Spinner({ large }) {
  return <div className={large ? 'spinner spinner-lg' : 'spinner'} />
}

export function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Spinner large />
    </div>
  )
}

// ─── Avatar ────────────────────────────────────────────────────
const COLORS = ['#e6f7f1','#e6f0fa','#fef3e2','#fbeaf0','#f0f0ff']
const TEXT_COLORS = ['#0d7a54','#1a6eb5','#c97a10','#993556','#5040cc']

export function Avatar({ name = '', size = 38, color }) {
  const idx = name.charCodeAt(0) % COLORS.length
  const bg = color || COLORS[idx]
  const tc = TEXT_COLORS[idx]
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: tc,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.35), fontWeight: 600, flexShrink: 0
    }}>
      {initials || '?'}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        {children}
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, message, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{icon || '🔍'}</div>
      <p>{message}</p>
      {action}
    </div>
  )
}

// ─── Route Display ─────────────────────────────────────────────
export function RouteDisplay({ from, stops = [], to }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
        {stops.map((_, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{ width: 1.5, flex: 1, background: 'var(--gray-200)', margin: '3px 0', minHeight: 8 }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gray-400)', flexShrink: 0 }} />
          </div>
        ))}
        <div style={{ width: 1.5, flex: 1, background: 'var(--gray-200)', margin: '3px 0', minHeight: 10 }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--gray-900)', padding: '2px 0' }}>{from}</div>
        {stops.map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic', padding: '4px 0' }}>{s}</div>
        ))}
        <div style={{ fontSize: 13, color: 'var(--gray-900)', padding: '2px 0', marginTop: stops.length ? 0 : 8 }}>{to}</div>
      </div>
    </div>
  )
}

// ─── Seats Visual ──────────────────────────────────────────────
export function SeatsVisual({ total, taken }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: 3,
          background: i < taken ? 'var(--green)' : 'var(--green-light)',
          border: i < taken ? 'none' : '1px solid var(--green)'
        }} />
      ))}
    </div>
  )
}

// ─── Stat Tile ─────────────────────────────────────────────────
export function StatTile({ value, label }) {
  return (
    <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
