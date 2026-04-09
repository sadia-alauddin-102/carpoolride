import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/UI'
import { ProtectedLayout, AdminLayout } from '@/components/Layout'
import AuthPage    from '@/pages/AuthPage'
import FindRidePage from '@/pages/FindRidePage'
import OfferRidePage from '@/pages/OfferRidePage'
import MyRidesPage  from '@/pages/MyRidesPage'
import ChatPage     from '@/pages/ChatPage'
import ProfilePage  from '@/pages/ProfilePage'
import AdminPage    from '@/pages/AdminPage'
import '@/styles/globals.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<FindRidePage />} />
            <Route path="offer"    element={<OfferRidePage />} />
            <Route path="my-rides" element={<MyRidesPage />} />
            <Route path="chat"     element={<ChatPage />} />
            <Route path="profile"  element={<ProfilePage />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
