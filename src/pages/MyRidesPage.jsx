import { useState, useEffect } from 'react'
import { getMyOfferedRides, getMyBookings, updateBookingStatus, deleteRide, createNotification, sendEmailNotification, getProfile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, RouteDisplay, EmptyState, PageSpinner, StatTile, toast, Modal } from '@/components/UI'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function MyRidesPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('offering')
  const [offeredRides, setOffered] = useState([])
  const [myBookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    const [{ data: offered }, { data: bookings }] = await Promise.all([
      getMyOfferedRides(user.id),
      getMyBookings(user.id)
    ])
    setOffered(offered || [])
    setBookings(bookings || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleBookingAction(booking, status) {
    await updateBookingStatus(booking.id, status)

    const isConfirm = status === 'confirmed'
    const riderProfile = booking.profiles
    if (riderProfile?.email) {
      await sendEmailNotification({
        type: isConfirm ? 'ride_confirmed' : 'ride_cancelled',
        to: riderProfile.email,
        data: {
          rider_name: riderProfile.full_name,
          driver_name: profile?.full_name,
          from: booking.rides?.from_location,
          to: booking.rides?.to_location,
          ride_date: booking.rides?.ride_date,
          departure_time: booking.rides?.departure_time?.slice(0,5),
          vehicle: profile?.vehicle,
          price: booking.rides?.price_per_seat,
          app_url: window.location.origin
        }
      })
    }
    await createNotification({
      userId: booking.rider_id,
      type: isConfirm ? 'ride_confirmed' : 'ride_cancelled',
      title: isConfirm ? 'Seat confirmed!' : 'Booking declined',
      body: isConfirm ? `${profile?.full_name} confirmed your seat` : `${profile?.full_name} could not accommodate your request`,
    })

    toast(isConfirm ? 'Booking confirmed' : 'Booking declined')
    load()
  }

  async function handleCancelRide(ride) {
    await deleteRide(ride.id, user.id)
    // Notify all confirmed passengers
    for (const b of ride.bookings?.filter(b => b.status === 'confirmed') || []) {
      await createNotification({ userId: b.rider_id, type: 'ride_cancelled', title: 'Ride cancelled', body: `${profile?.full_name} cancelled the ride to ${ride.to_location}` })
    }
    toast('Ride cancelled')
    setConfirmModal(null)
    load()
  }

  const totalRides = offeredRides.length + myBookings.filter(b => b.status === 'confirmed').length
  const costSaved = myBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.rides?.price_per_seat > 0 ? 0 : 15), 0)

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatTile value={totalRides} label="Total rides" />
        <StatTile value={`AED ${Math.round(costSaved * 0.4)}`} label="Est. cost saved" />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['offering','joined'].map(t => (
          <button key={t} className="btn btn-sm" onClick={() => setTab(t)} style={{ background: tab === t ? 'var(--green)' : 'var(--gray-100)', color: tab === t ? 'white' : 'var(--gray-600)', border: 'none', borderRadius: 20, textTransform: 'capitalize' }}>
            {t === 'offering' ? 'Rides I offer' : 'Rides I joined'}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : tab === 'offering' ? (
        <>
          {offeredRides.length === 0 ? (
            <EmptyState icon="🚗" message="You haven't offered any rides yet" action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/offer')}>Offer a ride</button>} />
          ) : offeredRides.map(ride => (
            <div key={ride.id} className="card card-pad" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{ride.from_location} → {ride.to_location}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {format(new Date(ride.ride_date), 'EEE d MMM')} · {ride.departure_time?.slice(0,5)} · {ride.recurrence !== 'once' ? ride.recurrence : 'one time'}
                  </div>
                </div>
                <span className={`badge ${ride.is_active ? 'badge-green' : 'badge-gray'}`}>{ride.is_active ? 'Active' : 'Ended'}</span>
              </div>

              {(ride.waypoints || []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Stops:</span>
                  {ride.waypoints.map(w => <span key={w} style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 10, color: 'var(--gray-600)' }}>{w}</span>)}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                {ride.bookings?.filter(b => b.status === 'confirmed').length || 0} of {ride.total_seats} seats taken
              </div>

              {/* Pending requests */}
              {ride.bookings?.filter(b => b.status === 'pending').map(b => (
                <div key={b.id} style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={b.profiles?.full_name} size={28} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{b.profiles?.full_name}</div>
                        {b.pickup_stop && <div style={{ fontSize: 11, color: 'var(--amber)' }}>Boarding at: {b.pickup_stop}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white', border: 'none', padding: '5px 12px' }} onClick={() => handleBookingAction(b, 'confirmed')}>✓</button>
                      <button className="btn btn-sm btn-danger" style={{ padding: '5px 12px' }} onClick={() => handleBookingAction(b, 'cancelled')}>✕</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Confirmed passengers */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {ride.bookings?.filter(b => b.status === 'confirmed').map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>
                    <Avatar name={b.profiles?.full_name} size={20} />
                    {b.profiles?.full_name}
                  </div>
                ))}
              </div>

              <button className="btn btn-danger btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setConfirmModal(ride)}>Cancel this ride</button>
            </div>
          ))}
        </>
      ) : (
        <>
          {myBookings.length === 0 ? (
            <EmptyState icon="🎫" message="You haven't joined any rides yet" action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Find a ride</button>} />
          ) : myBookings.map(b => (
            <div key={b.id} className="card card-pad" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{b.rides?.from_location} → {b.rides?.to_location}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {b.rides?.ride_date ? format(new Date(b.rides.ride_date), 'EEE d MMM') : ''} · {b.rides?.departure_time?.slice(0,5)}
                  </div>
                </div>
                <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : b.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                  {b.status === 'confirmed' ? 'Confirmed' : b.status === 'pending' ? 'Pending' : 'Declined'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={b.rides?.profiles?.full_name} size={28} />
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>With {b.rides?.profiles?.full_name}</div>
              </div>
              {b.rides?.price_per_seat > 0 && (
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>Cost: AED {b.rides.price_per_seat}</div>
              )}
            </div>
          ))}
        </>
      )}

      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)}>
        {confirmModal && <>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>Cancel ride?</h3>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20 }}>All confirmed passengers will be notified. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-full" onClick={() => setConfirmModal(null)}>Keep ride</button>
            <button className="btn btn-danger btn-full" onClick={() => handleCancelRide(confirmModal)}>Yes, cancel</button>
          </div>
        </>}
      </Modal>
    </div>
  )
}
