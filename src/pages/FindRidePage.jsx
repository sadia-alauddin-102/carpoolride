import { useState, useEffect } from 'react'
import { getRides, requestBooking, getProfile, createNotification, sendEmailNotification } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Modal, RouteDisplay, SeatsVisual, Avatar, EmptyState, PageSpinner, toast } from '@/components/UI'
import { format } from 'date-fns'

export default function FindRidePage() {
  const { user, profile } = useAuth()
  const [rides, setRides]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('all')
  const [dateFilter, setDate]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selected, setSelected] = useState(null)
  const [reqLoading, setReqLoading] = useState(false)
  const [pickupStop, setPickup] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await getRides({ date: dateFilter, type: typeFilter !== 'all' ? typeFilter : undefined })
    setRides(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [dateFilter, typeFilter])

  const filtered = rides.filter(r => {
    if (r.driver_id === user?.id) return false
    const q = search.toLowerCase()
    return !q || r.from_location.toLowerCase().includes(q) || r.to_location.toLowerCase().includes(q) ||
      r.driver_name?.toLowerCase().includes(q) || (r.waypoints || []).some(w => w.toLowerCase().includes(q))
  })

  async function handleRequest() {
    if (!selected) return
    setReqLoading(true)
    const { error } = await requestBooking({ rideId: selected.id, riderId: user.id, pickupStop })
    if (error) { toast(error.code === '23505' ? 'You already requested this ride' : error.message); setReqLoading(false); return }

    // Notify driver
    await createNotification({
      userId: selected.driver_id,
      type: 'ride_request',
      title: 'New seat request',
      body: `${profile?.full_name} wants to join your ride to ${selected.to_location}`,
      data: { ride_id: selected.id }
    })

    // Email driver
    const { data: driverProfile } = await getProfile(selected.driver_id)
    if (driverProfile?.email) {
      await sendEmailNotification({
        type: 'ride_request', to: driverProfile.email,
        data: { driver_name: driverProfile.full_name, rider_name: profile?.full_name, from: selected.from_location, to: selected.to_location, ride_date: selected.ride_date, departure_time: selected.departure_time, pickup_stop: pickupStop, app_url: window.location.origin }
      })
    }

    toast('Seat requested! Waiting for driver confirmation.')
    setSelected(null)
    load()
    setReqLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Search area or colleague…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <input type="date" value={dateFilter} onChange={e => setDate(e.target.value)} style={{ width: 'auto', flex: '0 0 auto', padding: '11px 10px' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','free','paid'].map(t => (
          <button key={t} className="btn btn-sm" style={{ background: typeFilter === t ? 'var(--green)' : 'var(--gray-100)', color: typeFilter === t ? 'white' : 'var(--gray-600)', border: 'none', borderRadius: 20, textTransform: 'capitalize' }} onClick={() => setType(t)}>{t === 'all' ? 'All rides' : t === 'free' ? 'Free' : 'Paid'}</button>
        ))}
      </div>

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon="🚗" message={search ? 'No rides match your search' : 'No rides available for this date'} action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setDate(format(new Date(),'yyyy-MM-dd')) }}>Reset filters</button>} />
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>{filtered.length} ride{filtered.length !== 1 ? 's' : ''} available</div>
          {filtered.map(ride => <RideCard key={ride.id} ride={ride} onSelect={setSelected} />)}
        </>
      )}

      {/* Ride Detail Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setPickup('') }}>
        {selected && <>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>Ride details</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <Avatar name={selected.driver_name} size={44} />
            <div>
              <div style={{ fontWeight: 500 }}>{selected.driver_name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{selected.driver_vehicle || 'Vehicle not specified'}</div>
            </div>
          </div>
          <RouteDisplay from={selected.from_location} stops={selected.waypoints || []} to={selected.to_location} />
          <div className="divider" />
          {[
            ['Date', format(new Date(selected.ride_date), 'EEE, d MMM yyyy')],
            ['Departure', selected.departure_time?.slice(0,5)],
            ['Cost', selected.ride_type === 'free' ? 'Free' : `AED ${selected.price_per_seat} per seat`],
            ['Seats available', `${selected.available_seats} of ${selected.total_seats}`],
            selected.notes && ['Notes', selected.notes],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
              <span style={{ color: 'var(--gray-400)' }}>{k}</span>
              <span style={{ fontWeight: 500, color: selected.available_seats === 0 && k === 'Seats available' ? 'var(--red)' : 'var(--gray-900)' }}>{v}</span>
            </div>
          ))}

          {selected.waypoints?.length > 0 && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Your boarding stop (optional)</label>
              <select value={pickupStop} onChange={e => setPickup(e.target.value)}>
                <option value="">From origin: {selected.from_location}</option>
                {selected.waypoints.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {selected.available_seats > 0 ? (
              <button className="btn btn-primary btn-full btn-lg" onClick={handleRequest} disabled={reqLoading}>
                {reqLoading ? <><div className="spinner" /> Requesting…</> : 'Request seat'}
              </button>
            ) : (
              <button className="btn btn-full btn-lg" disabled style={{ background: 'var(--gray-200)', color: 'var(--gray-400)', border: 'none' }}>Ride full</button>
            )}
          </div>
        </>}
      </Modal>
    </div>
  )
}

function RideCard({ ride, onSelect }) {
  const open = ride.available_seats
  return (
    <div className="card card-pad" style={{ marginBottom: 12, cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
      onClick={() => onSelect(ride)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--gray-400)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={ride.driver_name} size={38} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{ride.driver_name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{ride.driver_vehicle || 'Vehicle TBC'}</div>
          </div>
        </div>
        <span className={`badge ${ride.ride_type === 'free' ? 'badge-green' : open === 0 ? 'badge-gray' : 'badge-blue'}`}>
          {ride.ride_type === 'free' ? 'Free' : open === 0 ? 'Full' : `AED ${ride.price_per_seat}`}
        </span>
      </div>
      <RouteDisplay from={ride.from_location} stops={ride.waypoints || []} to={ride.to_location} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 12, color: 'var(--gray-400)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {ride.departure_time?.slice(0,5)}
        </span>
        <span style={{ color: open === 0 ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{open} seat{open !== 1 ? 's' : ''} left</span>
        <div style={{ marginLeft: 'auto' }}><SeatsVisual total={ride.total_seats} taken={ride.booked_seats} /></div>
      </div>
    </div>
  )
}
