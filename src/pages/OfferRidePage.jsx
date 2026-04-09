import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRide } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/UI'
import { format } from 'date-fns'

export default function OfferRidePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [waypoints, setWaypoints] = useState([])
  const [form, setForm] = useState({
    from_location: '', to_location: '', departure_time: '08:30',
    ride_date: format(new Date(), 'yyyy-MM-dd'),
    ride_type: 'free', price_per_seat: '', total_seats: 2,
    recurrence: 'once', notes: '', vehicle: ''
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addWaypoint() { setWaypoints(w => [...w, '']) }
  function updateWaypoint(i, v) { setWaypoints(w => w.map((x, j) => j === i ? v : x)) }
  function removeWaypoint(i) { setWaypoints(w => w.filter((_, j) => j !== i)) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.from_location.trim() || !form.to_location.trim()) { toast('Please fill in pickup and destination'); return }
    setLoading(true)

    const { error } = await createRide({
      driver_id: user.id,
      from_location: form.from_location.trim(),
      to_location: form.to_location.trim(),
      waypoints: waypoints.filter(w => w.trim()),
      departure_time: form.departure_time,
      ride_date: form.ride_date,
      recurrence: form.recurrence,
      ride_type: form.ride_type,
      price_per_seat: form.ride_type === 'paid' ? parseFloat(form.price_per_seat) || 0 : 0,
      total_seats: form.total_seats,
      notes: form.notes.trim()
    })

    setLoading(false)
    if (error) { toast(error.message); return }
    toast('Ride posted! Colleagues can now find you.')
    navigate('/my-rides')
  }

  const ToggleBtn = ({ value, label, active, onClick }) => (
    <button type="button" onClick={onClick} style={{ flex: 1, padding: '10px', border: `1px solid ${active ? 'var(--green)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-md)', background: active ? 'var(--green-light)' : 'none', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', color: active ? 'var(--green-mid)' : 'var(--gray-600)', fontWeight: active ? 500 : 400, transition: 'all 0.15s' }}>{label}</button>
  )

  const SeatBtn = ({ n }) => (
    <button type="button" onClick={() => set('total_seats', n)} style={{ width: 40, height: 40, border: `1px solid ${form.total_seats === n ? 'var(--green)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-sm)', background: form.total_seats === n ? 'var(--green)' : 'none', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', color: form.total_seats === n ? 'white' : 'var(--gray-600)', fontWeight: 500, transition: 'all 0.15s' }}>{n}</button>
  )

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Share your route</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Pickup location</label>
          <input type="text" placeholder="e.g. Al Barsha, Dubai" value={form.from_location} onChange={e => set('from_location', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Destination</label>
          <input type="text" placeholder="e.g. Downtown Dubai, DIFC" value={form.to_location} onChange={e => set('to_location', e.target.value)} required />
        </div>

        {/* Waypoints */}
        <div className="form-group">
          <label className="form-label">
            Stops along the way
            <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}> — pick-up / drop-off points (optional)</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {waypoints.map((wp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-400)', flexShrink: 0 }} />
                <input type="text" placeholder="e.g. Mall of Emirates, Sheikh Zayed Rd…" value={wp} onChange={e => updateWaypoint(i, e.target.value)} style={{ flex: 1 }} />
                <button type="button" onClick={() => removeWaypoint(i)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--gray-200)', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-light)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--gray-400)' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addWaypoint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--green)', background: 'none', border: '1px dashed var(--green)', borderRadius: 'var(--radius-md)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Add a stop
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Departure time</label>
            <input type="time" value={form.departure_time} onChange={e => set('departure_time', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" value={form.ride_date} onChange={e => set('ride_date', e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ride type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="Free pooling" active={form.ride_type === 'free'} onClick={() => set('ride_type', 'free')} />
            <ToggleBtn label="Cost sharing" active={form.ride_type === 'paid'} onClick={() => set('ride_type', 'paid')} />
          </div>
        </div>

        {form.ride_type === 'paid' && (
          <div className="form-group">
            <label className="form-label">Amount per rider (AED)</label>
            <input type="number" placeholder="e.g. 10" min="1" value={form.price_per_seat} onChange={e => set('price_per_seat', e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Available seats</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4].map(n => <SeatBtn key={n} n={n} />)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Schedule</label>
          <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
            <option value="once">One time only</option>
            <option value="weekdays">Weekdays (Mon–Fri)</option>
            <option value="daily">Every day</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Your vehicle</label>
          <input type="text" placeholder="Make, model, colour, plate number" value={form.vehicle} onChange={e => set('vehicle', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Notes for passengers <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" placeholder="e.g. No smoking, music OK, ladies only…" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <><div className="spinner" /> Posting…</> : 'Post ride offer'}
        </button>
      </form>
    </div>
  )
}
