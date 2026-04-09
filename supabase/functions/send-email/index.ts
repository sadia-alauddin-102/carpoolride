// supabase/functions/send-email/index.ts
// Deploy with: supabase functions deploy send-email
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_NAME = 'PoolRide'
const FROM_EMAIL = 'notifications@poolride.app' // change to your verified domain

const templates = {
  ride_request: (data: any) => ({
    subject: `New seat request for your ride`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1a9e6e;margin-bottom:4px;">🚗 New Ride Request</h2>
        <p style="color:#5c5b57;font-size:14px;">Hi ${data.driver_name},</p>
        <p><strong>${data.rider_name}</strong> has requested a seat on your ride:</p>
        <div style="background:#f8f8f6;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Route:</strong> ${data.from} → ${data.to}</p>
          <p style="margin:4px 0;"><strong>Date:</strong> ${data.ride_date} at ${data.departure_time}</p>
          ${data.pickup_stop ? `<p style="margin:4px 0;"><strong>Pickup stop:</strong> ${data.pickup_stop}</p>` : ''}
        </div>
        <a href="${data.app_url}/my-rides" style="display:inline-block;background:#1a9e6e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Request</a>
        <p style="color:#9b9a95;font-size:12px;margin-top:24px;">PoolRide · Colleague Carpooling</p>
      </div>`
  }),

  ride_confirmed: (data: any) => ({
    subject: `Your seat is confirmed! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1a9e6e;margin-bottom:4px;">✅ Seat Confirmed</h2>
        <p style="color:#5c5b57;font-size:14px;">Hi ${data.rider_name},</p>
        <p>Great news! <strong>${data.driver_name}</strong> confirmed your seat:</p>
        <div style="background:#f8f8f6;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Route:</strong> ${data.from} → ${data.to}</p>
          <p style="margin:4px 0;"><strong>Date:</strong> ${data.ride_date} at ${data.departure_time}</p>
          <p style="margin:4px 0;"><strong>Vehicle:</strong> ${data.vehicle || 'TBC'}</p>
          ${data.price ? `<p style="margin:4px 0;"><strong>Cost:</strong> AED ${data.price}</p>` : '<p style="margin:4px 0;"><strong>Cost:</strong> Free</p>'}
        </div>
        <a href="${data.app_url}/my-rides" style="display:inline-block;background:#1a9e6e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View My Rides</a>
        <p style="color:#9b9a95;font-size:12px;margin-top:24px;">PoolRide · Colleague Carpooling</p>
      </div>`
  }),

  ride_cancelled: (data: any) => ({
    subject: `Ride update: ${data.from} → ${data.to}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#d94040;margin-bottom:4px;">❌ Ride Cancelled</h2>
        <p>Hi ${data.recipient_name},</p>
        <p>Unfortunately the ride on <strong>${data.ride_date}</strong> from <strong>${data.from}</strong> to <strong>${data.to}</strong> has been cancelled.</p>
        <a href="${data.app_url}/find" style="display:inline-block;background:#1a9e6e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Find Another Ride</a>
        <p style="color:#9b9a95;font-size:12px;margin-top:24px;">PoolRide · Colleague Carpooling</p>
      </div>`
  }),

  new_message: (data: any) => ({
    subject: `New message from ${data.sender_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1a9e6e;margin-bottom:4px;">💬 New Message</h2>
        <p>Hi ${data.recipient_name},</p>
        <p><strong>${data.sender_name}</strong> sent you a message:</p>
        <div style="background:#f8f8f6;border-radius:12px;padding:16px;margin:16px 0;border-left:3px solid #1a9e6e;">
          <p style="margin:0;font-style:italic;">"${data.message_preview}"</p>
        </div>
        <a href="${data.app_url}/chat" style="display:inline-block;background:#1a9e6e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reply</a>
        <p style="color:#9b9a95;font-size:12px;margin-top:24px;">PoolRide · Colleague Carpooling</p>
      </div>`
  })
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { type, to, data } = await req.json()
    const template = templates[type]?.(data)
    if (!template) return new Response('Unknown email type', { status: 400 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${APP_NAME} <${FROM_EMAIL}>`, to, ...template })
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
