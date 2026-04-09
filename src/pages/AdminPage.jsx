import { useState, useEffect } from 'react'
import { adminGetAllUsers, adminGetAllRides, adminToggleUser } from '@/lib/supabase'
import { Avatar, PageSpinner, toast } from '@/components/UI'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function AdminPage() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: u }, { data: r }] = await Promise.all([adminGetAllUsers(), adminGetAllRides()])
    setUsers(u || [])
    setRides(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleUser(userId, current) {
    await adminToggleUser(userId, !current)
    toast(!current ? 'User activated' : 'User suspended')
    load()
  }

  const stats = [
    { label: 'Total users', value: users.length },
    { label: 'Active rides', value: rides.filter(r => r.is_active).length },
    { label: 'Free rides', value: rides.filter(r => r.ride_type === 'free').length },
    { label: 'Paid rides', value: rides.filter(r => r.ride_type === 'paid').length },
  ]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--white)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ background: 'var(--gray-900)', padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} />
            Admin Panel
          </div>
          <Link to="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 20 }}>← App</Link>
        </div>
        <div style={{ display: 'flex' }}>
          {['users', 'rides'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === t ? 'var(--green)' : 'transparent'}`, color: tab === t ? 'var(--green)' : 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize', transition: 'color 0.15s' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? <PageSpinner /> : tab === 'users' ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>{users.length} registered users</div>
            {users.map(u => (
              <div key={u.id} className="card card-pad" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={u.full_name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{u.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                    {u.department || 'No dept'} · Joined {format(new Date(u.created_at), 'd MMM yyyy')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {u.is_admin && <span style={{ fontSize: 10, background: 'var(--amber-light)', color: 'var(--amber)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>Admin</span>}
                  <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleUser(u.id, u.is_active)}>
                    {u.is_active ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>{rides.length} total rides</div>
            {rides.map(r => (
              <div key={r.id} className="card card-pad" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.from_location} → {r.to_location}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>by {r.driver_name} · {r.ride_date ? format(new Date(r.ride_date), 'EEE d MMM') : '—'} {r.departure_time?.slice(0,5)}</div>
                  </div>
                  <span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>{r.is_active ? 'Active' : 'Ended'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                  <span className={`badge ${r.ride_type === 'free' ? 'badge-green' : 'badge-blue'}`}>{r.ride_type === 'free' ? 'Free' : `AED ${r.price_per_seat}`}</span>
                  <span className="badge badge-gray">{r.available_seats}/{r.total_seats} seats free</span>
                  {(r.waypoints || []).length > 0 && <span className="badge badge-gray">{r.waypoints.length} stop{r.waypoints.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
