import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useClientStore } from '@/store'
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
      // Clear any existing corrupted session before login
      await supabase.auth.signOut().catch(() => {})
      
      // Sign in with Supabase Auth with timeout
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      const authResult = await Promise.race([
        loginPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 10000)
        )
      ]) as any
      
      const { data: authData, error: authError } = authResult

      if (authError) throw authError

      // Get admin info with timeout
      const adminPromise = supabase
        .from('admins')
        .select('tenant_id, role')
        .eq('user_id', authData.user.id)
        .eq('active', true)
        .single()
      
      const adminResult = await Promise.race([
        adminPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 10000)
        )
      ]) as any
      
      const { data: admin, error: adminError } = adminResult

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
    <ClientShell back={{ label: t.admin.login.backHome, to: '/' }} profile={false} narrow>
      <header className="cs-head">
        <span className="cs-hero-ico"><IosIcon name="store" /></span>
        <h1>{t.admin.login.title}</h1>
        <p>{t.admin.login.subtitle}</p>
      </header>

      <div className="cs-glass cs-formcard">
        <form onSubmit={handleLogin} className="cs-form">
          <div className="cs-field">
            <label htmlFor="email" className="cs-label">{t.admin.login.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cs-input"
              placeholder="admin@example.com"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="cs-field">
            <label htmlFor="password" className="cs-label">{t.admin.login.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cs-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="cs-alert err" style={{ margin: 0 }}>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="cs-btn main">
            {loading ? (
              <>
                <svg className="cs-spin" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t.admin.login.loggingIn}
              </>
            ) : t.admin.login.loginButton}
          </button>
        </form>
      </div>
    </ClientShell>
  )
}
