import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getUnreadCount } from '@/lib/supabase'
import { useRealtimeNotifications } from '@/hooks/useRealtime'
import { APP_NAME } from '@/lib/supabase'

export function ProtectedLayout() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner spinner-lg" /></div>
  if (!user) return <Navigate to="/auth" replace />
  if (profile && !profile.is_active) return <div style={{ padding: 40, textAlign: 'center' }}><h2>Account suspended</h2><p>Please contact your administrator.</p></div>
  return <AppLayout />
}

export function AdminLayout() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!profile?.is_admin) return <Navigate to="/" replace />
  return <Outlet />
}

function AppLayout() {
  const location = useLocation()
  const { user, profile } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (user) getUnreadCount(user.id).then(setUnread)
  }, [user])

  useRealtimeNotifications(user?.id, () => {
    if (user) getUnreadCount(user.id).then(setUnread)
  })

  const tabs = [
    { path: '/',         label: 'Find',     icon: <IconSearch /> },
    { path: '/offer',    label: 'Offer',    icon: <IconPlus /> },
    { path: '/my-rides', label: 'My Rides', icon: <IconCalendar /> },
    { path: '/chat',     label: 'Chat',     icon: <IconChat />, badge: unread },
    { path: '/profile',  label: 'Profile',  icon: <IconUser /> },
  ]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--white)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '16px 20px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
            {APP_NAME}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {profile?.is_admin && (
              <Link to="/admin" style={{ fontSize: 11, background: 'var(--amber-light)', color: 'var(--amber)', padding: '3px 9px', borderRadius: 20, fontWeight: 600, textDecoration: 'none' }}>Admin</Link>
            )}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--green-mid)', cursor: 'pointer' }}>
                {profile?.full_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '??'}
              </div>
            </Link>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex' }}>
          {tabs.map(tab => {
            const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path)
            return (
              <Link key={tab.path} to={tab.path} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderBottom: `2.5px solid ${active ? 'var(--green)' : 'transparent'}`, color: active ? 'var(--green)' : 'var(--gray-400)', textDecoration: 'none', fontSize: 11, fontWeight: active ? 500 : 400, gap: 3, position: 'relative', transition: 'color 0.15s' }}>
                {tab.icon}
                {tab.label}
                {tab.badge > 0 && (
                  <div style={{ position: 'absolute', top: 4, right: '50%', marginRight: -18, width: 16, height: 16, background: 'var(--red)', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Page Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

function IconSearch() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> }
function IconPlus()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> }
function IconCalendar(){ return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconChat()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconUser()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
