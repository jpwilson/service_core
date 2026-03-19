import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import './index.css'
import App from './App'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { CostsSecurityPage } from './pages/CostsSecurityPage'
import { MarketingPage } from './pages/MarketingPage'
import { RequireAuth } from './auth/RequireAuth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<RequireAuth><App /></RequireAuth>} />
          <Route path="/costs" element={<RequireAuth><CostsSecurityPage /></RequireAuth>} />
          <Route path="/marketing" element={<RequireAuth><MarketingPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
