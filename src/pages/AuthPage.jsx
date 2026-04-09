import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signIn, signUp, COMPANY_DOMAIN, APP_NAME } from '@/lib/supabase'
import { toast } from '@/components/UI'

export default function AuthPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })

  if (user) return <Navigate to="/" replace />

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'login') {
      const { error } = await signIn({ email: form.email, password: form.password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      if (!form.fullName.trim()) { setError('Please enter your full name'); setLoading(false); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
      const { error } = await signUp({ email: form.email, password: form.password, fullName: form.fullName })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account, then come back to sign in.')
    } else {
      // forgot
      const { error } = await import('@/lib/supabase').then(m => m.supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` }))
      if (error) setError(error.message)
      else setSuccess('Password reset link sent to your email.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)' }} />
            {APP_NAME}
          </div>
          <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>Colleague carpooling</p>
        </div>

        <div className="card card-pad" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 24 }}>
            {mode === 'signup' ? `Only @${COMPANY_DOMAIN} emails allowed` : 'Sign in to your account'}
          </p>

          {success ? (
            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14, color: 'var(--green-dark)', marginBottom: 16 }}>
              {success}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input type="text" placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} required autoFocus />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Work email</label>
                <input type="email" placeholder={`you@${COMPANY_DOMAIN}`} value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              {mode !== 'forgot' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" placeholder={mode === 'signup' ? 'Min 8 characters' : 'Your password'} value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
              )}
              {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><div className="spinner" /> Processing…</> : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
            {mode === 'login' && <>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setMode('signup'); setError('') }}>No account? Sign up</button>
              <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--gray-400)' }} onClick={() => { setMode('forgot'); setError('') }}>Forgot password?</button>
            </>}
            {mode !== 'login' && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
