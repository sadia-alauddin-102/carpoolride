import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeMessages(userId, onNewMessage) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      }, (payload) => {
        onNewMessage?.(payload.new)
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [userId])
}

export function useRealtimeBookings(rideId, onUpdate) {
  useEffect(() => {
    if (!rideId) return
    const channel = supabase
      .channel(`bookings:${rideId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `ride_id=eq.${rideId}`
      }, (payload) => onUpdate?.(payload))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [rideId])
}

export function useRealtimeNotifications(userId, onNew) {
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => onNew?.(payload.new))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])
}
