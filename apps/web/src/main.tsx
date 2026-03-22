import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import './index.css'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { CostsSecurityPage } from './pages/CostsSecurityPage'
import { MarketingPage } from './pages/MarketingPage'
import { RequireAuth } from './auth/RequireAuth'
import { HelpAgent } from './components/agent/HelpAgent'
import { initPostHog } from './lib/posthog'
import { initSentry } from './lib/sentry'

// Initialize observability (no-op without env vars)
initSentry()
initPostHog()

const DataGraphPage = lazy(() => import('./pages/DataGraphPage').then(m => ({ default: m.DataGraphPage })))

function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <Outlet />
      <HelpAgent />
    </RequireAuth>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/app" element={<App />} />
            <Route path="/project-details" element={<CostsSecurityPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/graphs" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-lg text-gray-500">Loading graph...</div></div>}><DataGraphPage /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
