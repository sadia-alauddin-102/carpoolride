import { useState, useEffect } from 'react'
import { updateProfile, signOut } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, toast } from '@/components/UI'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', department: '', floor: '', vehicle: '', preference: 'no_preference' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', department: profile.department || '', floor: profile.floor || '', vehicle: profile.vehicle || '', preference: profile.preference || 'no_preference' })
  }, [profile])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await updateProfile(user.id, form)
    if (error) toast(error.message)
    else { await refreshProfile(); toast('Profile saved!') }
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Profile hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
        <Avatar name={profile?.full_name} size={58} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>{profile?.full_name}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, background: 'var(--green-light)', color: 'var(--green-mid)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>Verified colleague</span>
            {profile?.is_admin && <span style={{ fontSize: 11, background: 'var(--amber-light)', color: 'var(--amber)', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>Admin</span>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>Personal details</div>

        <div className="form-group">
          <label className="form-label">Full name</label>
          <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input type="text" placeholder="e.g. Engineering" value={form.department} onChange={e => set('department', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Floor / Team</label>
            <input type="text" placeholder="e.g. Floor 4" value={form.floor} onChange={e => set('floor', e.target.value)} />
          </div>
        </div>

        <div className="divider" />
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>Vehicle</div>

        <div className="form-group">
          <label className="form-label">Car details</label>
          <input type="text" placeholder="Make, model, colour, plate number" value={form.vehicle} onChange={e => set('vehicle', e.target.value)} />
          <div className="form-hint">This will be shown to passengers on your offered rides</div>
        </div>

        <div className="divider" />
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>Ride preferences</div>

        <div className="form-group">
          <label className="form-label">Your preference</label>
          <select value={form.preference} onChange={e => set('preference', e.target.value)}>
            <option value="no_preference">No preference</option>
            <option value="no_smoking">No smoking</option>
            <option value="quiet">Quiet ride preferred</option>
            <option value="music_ok">Music is fine</option>
            <option value="ladies_only">Ladies only</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><div className="spinner" /> Saving…</> : 'Save changes'}
        </button>
      </form>

      <div className="divider" style={{ margin: '24px 0' }} />

      <button className="btn btn-secondary btn-full" onClick={handleSignOut}>Sign out</button>
    </div>
  )
}
