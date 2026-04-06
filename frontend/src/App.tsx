import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { useEffect, useState, lazy, Suspense } from 'react'
import { AutoUpdateToast } from './components/AutoUpdateToast'
import CookieBanner from './components/CookieBanner'
import { supabase } from './lib/supabase'

// Critical pages - loaded immediately (small, first-screen)
import LandingPage from './pages/LandingPage'
import TenantSelector from './pages/TenantSelector'
import AdminLogin from './pages/admin/AdminLogin'

// Lazy-loaded pages - loaded on demand (reduces initial bundle)
const ClientCard = lazy(() => import('./pages/client/ClientCard'))
const ClientWallet = lazy(() => import('./pages/client/ClientWallet'))
const UserDashboard = lazy(() => import('./pages/client/UserDashboard'))
const RecoveryPage = lazy(() => import('./pages/client/RecoveryPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminRewards = lazy(() => import('./pages/admin/AdminRewards'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-lg font-semibold">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const { session, setAuth, clearAuth } = useAuthStore()
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    const url = import.meta.env.VITE_SUPABASE_URL || ''
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    setIsConfigured(!!(url && key && !url.includes('placeholder')))
  }, [])

  // Auto-refresh session management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('🔄 Initial session loaded')
      }
    })

    // Listen for auth changes (including automatic token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, session ? 'Session active' : 'No session')

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          // Get admin info to update store
          const { data: admin } = await supabase
            .from('admins')
            .select('tenant_id, role')
            .eq('user_id', session.user.id)
            .eq('active', true)
            .single()

          if (admin) {
            setAuth(session.user, session, admin.tenant_id, admin.role)
            console.log('✅ Session updated in store')
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
        console.log('🚪 Session cleared')
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [setAuth, clearAuth])

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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pricing" element={<PricingPage />} />

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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
