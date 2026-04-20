// src/App.jsx
// Demonstrates: React.lazy + Suspense, Protected routes, nested routing
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { GroupProvider } from './context/GroupContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { Loader } from './components/ui/Loader'

// React.lazy — pages are loaded on demand (code splitting)
const Login       = lazy(() => import('./pages/Login'))
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const GroupDetail = lazy(() => import('./pages/GroupDetail'))
const Groups      = lazy(() => import('./pages/Groups'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          {/* Suspense wraps lazy-loaded pages — shows loader while chunk downloads */}
          <Suspense fallback={<Loader fullscreen />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — all inside AppLayout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard"         element={<Dashboard />}   />
                <Route path="/groups"            element={<Groups />}      />
                <Route path="/groups/:groupId"   element={<GroupDetail />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#161b27',
                color: '#e2e8f0',
                border: '1px solid #1e2535',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#161b27' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#161b27' } },
            }}
          />
        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
