import { useState, useEffect, useRef } from 'react'
import { getConversations, getMessages, sendMessage, markMessagesRead } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, PageSpinner, EmptyState } from '@/components/UI'
import { useRealtimeMessages } from '@/hooks/useRealtime'
import { format, isToday, isYesterday } from 'date-fns'

export default function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConvos] = useState([])
  const [active, setActive] = useState(null) // other user's profile
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)

  async function loadConvos() {
    const { data } = await getConversations(user.id)
    setConvos(data || [])
    setLoading(false)
  }

  async function openChat(other) {
    setActive(other)
    setMsgLoading(true)
    const { data } = await getMessages(user.id, other.id)
    setMessages(data || [])
    setMsgLoading(false)
    await markMessagesRead(user.id, other.id)
  }

  useEffect(() => { loadConvos() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Real-time incoming messages
  useRealtimeMessages(user.id, async (newMsg) => {
    if (active && (newMsg.sender_id === active.id || newMsg.receiver_id === active.id)) {
      const { data } = await getMessages(user.id, active.id)
      setMessages(data || [])
      await markMessagesRead(user.id, active.id)
    }
    loadConvos()
  })

  async function handleSend() {
    if (!text.trim() || !active) return
    const content = text.trim()
    setText('')

    // Optimistically add to UI
    setMessages(m => [...m, { id: Date.now(), sender_id: user.id, receiver_id: active.id, content, created_at: new Date().toISOString(), sender: { id: user.id } }])

    await sendMessage({ senderId: user.id, receiverId: active.id, content })
    loadConvos()
  }

  function formatMsgTime(ts) {
    const d = new Date(ts)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'd MMM')
  }

  if (loading) return <PageSpinner />

  if (active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 106px)' }}>
        {/* Chat header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', background: 'var(--white)' }}>
          <button onClick={() => { setActive(null); loadConvos() }} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--gray-200)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
          <Avatar name={active.full_name} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{active.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{active.department || active.email}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgLoading ? <PageSpinner /> : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)', fontSize: 14 }}>Say hi to {active.full_name}!</div>
          ) : messages.map(msg => {
            const isOwn = msg.sender_id === user.id
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isOwn ? 'var(--green)' : 'var(--white)', color: isOwn ? 'white' : 'var(--gray-900)', border: isOwn ? 'none' : '1px solid var(--gray-200)', fontSize: 13, lineHeight: 1.5 }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{formatMsgTime(msg.created_at)}</div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--gray-200)', background: 'var(--white)' }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type a message…" style={{ flex: 1, borderRadius: 20, background: 'var(--gray-50)', padding: '10px 16px' }} />
          <button onClick={handleSend} disabled={!text.trim()} style={{ width: 38, height: 38, borderRadius: '50%', background: text.trim() ? 'var(--green)' : 'var(--gray-200)', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Messages</div>
      {conversations.length === 0 ? (
        <EmptyState icon="💬" message="No conversations yet. Request a ride to start chatting!" />
      ) : (
        <div>
          {conversations.map(({ other, lastMessage }) => {
            const unread = lastMessage.receiver_id === user.id && !lastMessage.is_read
            return (
              <div key={other.id} onClick={() => openChat(other)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: unread ? 'var(--green-light)' : 'transparent', marginBottom: 2, transition: 'background 0.15s' }}
                onMouseEnter={e => !unread && (e.currentTarget.style.background = 'var(--gray-50)')}
                onMouseLeave={e => !unread && (e.currentTarget.style.background = 'transparent')}>
                <Avatar name={other.full_name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: unread ? 600 : 500 }}>{other.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                    {lastMessage.sender_id === user.id ? 'You: ' : ''}{lastMessage.content}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{formatMsgTime(lastMessage.created_at)}</div>
                  {unread && <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', marginLeft: 'auto', marginTop: 4 }} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
