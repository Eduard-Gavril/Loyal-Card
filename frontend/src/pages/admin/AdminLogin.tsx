import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useClientStore } from '@/store'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // Get admin info
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('tenant_id, role')
        .eq('user_id', authData.user.id)
        .eq('active', true)
        .single()

      if (adminError || !admin) {
        await supabase.auth.signOut()
        throw new Error('Admin not found or inactive')
      }

      // Store auth data
      setAuth(authData.user, authData.session, admin.tenant_id, admin.role)

      // Redirect based on role
      if (admin.role === 'super_admin') {
        navigate('/super-admin/dashboard')
      } else {
        navigate('/admin/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil
          hueShift={280}
          noiseIntensity={0.02}
          scanlineIntensity={0}
          speed={0.3}
          scanlineFrequency={0}
          warpAmount={0.1}
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-blue-900/40 z-10"></div>

      <div className="relative z-20 max-w-md w-full px-4">
        <div className="text-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.admin.login.backHome}
          </button>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-3">{t.admin.login.title}</h1>
          <p className="text-gray-300 text-base sm:text-lg">{t.admin.login.subtitle}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                {t.admin.login.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                {t.admin.login.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-100 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.admin.login.loggingIn}
                </span>
              ) : t.admin.login.loginButton}
            </button>
          </form>
        </div>

        {/* Language selector bottom right */}
        <div className="flex justify-end mt-4">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}
