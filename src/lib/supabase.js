import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})

export const COMPANY_DOMAIN = import.meta.env.VITE_COMPANY_DOMAIN || 'company.com'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PoolRide'

// ─── Auth helpers ──────────────────────────────────────────────
export async function signUp({ email, password, fullName }) {
  if (!email.endsWith(`@${COMPANY_DOMAIN}`)) {
    return { error: { message: `Only @${COMPANY_DOMAIN} email addresses are allowed.` } }
  }
  return supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  })
}

export async function signIn({ email, password }) {
  if (!email.endsWith(`@${COMPANY_DOMAIN}`)) {
    return { error: { message: `Only @${COMPANY_DOMAIN} email addresses are allowed.` } }
  }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function updateProfile(userId, updates) {
  return supabase.from('profiles').update(updates).eq('id', userId)
}

// ─── Rides helpers ─────────────────────────────────────────────
export async function getRides({ date, type } = {}) {
  let q = supabase
    .from('rides_with_details')
    .select('*')
    .eq('is_active', true)
    .gte('available_seats', 1)
    .order('departure_time')
  if (date) q = q.eq('ride_date', date)
  if (type && type !== 'all') q = q.eq('ride_type', type)
  return q
}

export async function getRideById(id) {
  return supabase.from('rides_with_details').select('*').eq('id', id).single()
}

export async function createRide(ride) {
  return supabase.from('rides').insert(ride).select().single()
}

export async function updateRide(id, updates, driverId) {
  return supabase.from('rides').update(updates).eq('id', id).eq('driver_id', driverId)
}

export async function deleteRide(id, driverId) {
  return supabase.from('rides').update({ is_active: false }).eq('id', id).eq('driver_id', driverId)
}

// ─── Bookings helpers ──────────────────────────────────────────
export async function requestBooking({ rideId, riderId, pickupStop }) {
  return supabase.from('bookings').insert({ ride_id: rideId, rider_id: riderId, pickup_stop: pickupStop }).select().single()
}

export async function updateBookingStatus(bookingId, status) {
  return supabase.from('bookings').update({ status }).eq('id', bookingId).select().single()
}

export async function getMyBookings(userId) {
  return supabase
    .from('bookings')
    .select(`*, rides(*, profiles!rides_driver_id_fkey(*))`)
    .eq('rider_id', userId)
    .order('created_at', { ascending: false })
}

export async function getRideBookings(rideId) {
  return supabase
    .from('bookings')
    .select(`*, profiles!bookings_rider_id_fkey(*)`)
    .eq('ride_id', rideId)
    .order('created_at')
}

export async function getMyOfferedRides(driverId) {
  return supabase
    .from('rides')
    .select(`*, bookings(*, profiles!bookings_rider_id_fkey(*))`)
    .eq('driver_id', driverId)
    .eq('is_active', true)
    .order('ride_date')
    .order('departure_time')
}

// ─── Messaging helpers ─────────────────────────────────────────
export async function getConversations(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)`)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error }

  // Group into conversations (deduplicate by the other person)
  const seen = new Set()
  const conversations = []
  for (const msg of data || []) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const other = msg.sender_id === userId ? msg.receiver : msg.sender
    if (!seen.has(otherId)) {
      seen.add(otherId)
      conversations.push({ other, lastMessage: msg })
    }
  }
  return { data: conversations, error: null }
}

export async function getMessages(userId, otherId) {
  return supabase
    .from('messages')
    .select(`*, sender:profiles!messages_sender_id_fkey(*)`)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
    .order('created_at')
}

export async function sendMessage({ senderId, receiverId, content }) {
  return supabase.from('messages').insert({ sender_id: senderId, receiver_id: receiverId, content }).select().single()
}

export async function markMessagesRead(userId, senderId) {
  return supabase.from('messages').update({ is_read: true }).eq('receiver_id', userId).eq('sender_id', senderId)
}

export async function getUnreadCount(userId) {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false)
  return count || 0
}

// ─── Notifications helpers ─────────────────────────────────────
export async function getNotifications(userId) {
  return supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
}

export async function markNotificationRead(id) {
  return supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function createNotification({ userId, type, title, body, data }) {
  return supabase.from('notifications').insert({ user_id: userId, type, title, body, data })
}

// ─── Send email via Edge Function ─────────────────────────────
export async function sendEmailNotification({ type, to, data }) {
  try {
    await supabase.functions.invoke('send-email', { body: { type, to, data } })
  } catch (e) {
    console.warn('Email notification failed (non-critical):', e)
  }
}

// ─── Admin helpers ─────────────────────────────────────────────
export async function adminGetAllUsers() {
  return supabase.from('profiles').select('*').order('created_at', { ascending: false })
}

export async function adminGetAllRides() {
  return supabase.from('rides_with_details').select('*').order('created_at', { ascending: false })
}

export async function adminToggleUser(userId, isActive) {
  return supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
}
