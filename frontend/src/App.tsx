import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { useEffect, useState } from 'react'
import { AutoUpdateToast } from './components/AutoUpdateToast'
import CookieBanner from './components/CookieBanner'

// Pages
import LandingPage from './pages/LandingPage'
import TenantSelector from './pages/TenantSelector'
import ClientCard from './pages/client/ClientCard'
import ClientWallet from './pages/client/ClientWallet'
import UserDashboard from './pages/client/UserDashboard'
import RecoveryPage from './pages/client/RecoveryPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminScanner from './pages/admin/AdminScanner'
import AdminReports from './pages/admin/AdminReports'
import AdminRewards from './pages/admin/AdminRewards'
import AdminSettings from './pages/admin/AdminSettings'
import AdminProducts from './pages/admin/AdminProducts'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import PrivacyPolicy from './pages/PrivacyPolicy'
import CookiePolicy from './pages/CookiePolicy'

function App() {
  const { session } = useAuthStore()
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    const url = import.meta.env.VITE_SUPABASE_URL || ''
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    setIsConfigured(!!(url && key && !url.includes('placeholder')))
  }, [])

  // Show setup instructions if not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 LoyalCard</h1>
            <p className="text-gray-600">Piattaforma Loyalty Digitale</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-3">⚙️ Configurazione Richiesta</h2>
            <p className="text-yellow-800 mb-4">
              Prima di utilizzare LoyalCard, devi configurare Supabase.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">📝 Step 1: Crea progetto Supabase</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-2">
                <li>Vai su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a></li>
                <li>Crea un nuovo progetto (gratuito)</li>
                <li>Copia URL e Anon Key dal dashboard</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">🗄️ Step 2: Setup Database</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-2">
                <li>Nel Supabase Dashboard → SQL Editor</li>
                <li>Copia il contenuto di <code className="bg-gray-200 px-1 rounded">supabase/migrations/20260126_initial_schema.sql</code></li>
                <li>Esegui la query</li>
                <li>(Opzionale) Esegui anche <code className="bg-gray-200 px-1 rounded">supabase/seed.sql</code> per dati demo</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">🔧 Step 3: Configura Frontend</h3>
              <p className="text-sm text-gray-700 mb-2">
                Modifica il file <code className="bg-gray-200 px-1 rounded">frontend/.env</code>:
              </p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://[tuo-project].supabase.co
VITE_SUPABASE_ANON_KEY=[tua-anon-key]`}
              </pre>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ Dopo aver configurato, ricarica questa pagina
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="https://github.com/yourusername/loyalcard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              📖 Documentazione completa su GitHub
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AutoUpdateToast />
      <CookieBanner />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Tenant selection */}
        <Route path="/select-tenant" element={<TenantSelector />} />
        
        {/* Client routes (public) */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/wallet" element={<ClientWallet />} />
        <Route path="/card" element={<ClientCard />} />
        <Route path="/card/:qrCode" element={<ClientCard />} />
        <Route path="/card/new" element={<ClientCard />} />
        <Route path="/recovery" element={<RecoveryPage />} />

        {/* Legal pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />

        {/* Admin routes (protected) */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={session ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/scan"
          element={session ? <AdminScanner /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/reports"
          element={session ? <AdminReports /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/rewards"
          element={session ? <AdminRewards /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/products"
          element={session ? <AdminProducts /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/settings"
          element={session ? <AdminSettings /> : <Navigate to="/admin/login" />}
        />

        {/* Super Admin routes (protected) */}
        <Route
          path="/super-admin/dashboard"
          element={session ? <SuperAdminDashboard /> : <Navigate to="/admin/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
