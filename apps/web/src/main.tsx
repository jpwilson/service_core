import { StrictMode } from 'react'
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
            <Route path="/costs" element={<CostsSecurityPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
