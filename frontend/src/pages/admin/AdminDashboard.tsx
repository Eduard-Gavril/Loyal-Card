import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

interface Stats {
  totalScans: number
  totalClients: number
  totalRewards: number
  scansToday: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, tenantId, clearAuth } = useAuthStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    totalClients: 0,
    totalRewards: 0,
    scansToday: 0
  })

  useEffect(() => {
    loadStats()
  }, [tenantId])

  const loadStats = async () => {
    if (!tenantId) return

    try {
      // Get total scans
      const { count: totalScans } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      // Get total clients (via cards)
      const { count: totalClients } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      // Get scans today
      const today = new Date().toISOString().split('T')[0]
      const { count: scansToday } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('scanned_at', today)

      // Get total rewards given
      const { count: totalRewards } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('reward_applied', true)

      setStats({
        totalScans: totalScans || 0,
        totalClients: totalClients || 0,
        totalRewards: totalRewards || 0,
        scansToday: scansToday || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={280} speed={0.3} warpAmount={0.1} />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">{t.admin.dashboard.title}</h1>
              <p className="text-sm text-gray-200 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg border border-white/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t.admin.dashboard.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsTotal}</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalScans}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsClients}</h3>
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalClients}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsRewards}</h3>
                <span className="text-3xl">🎁</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalRewards}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsToday}</h3>
                <span className="text-3xl">⚡</span>
              </div>
              <p className="text-4xl font-bold text-white">{stats.scansToday}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold mb-6 text-white">{t.admin.dashboard.quickActions}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/scan')}
              className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 hover:scale-105 active:scale-95"
            >
              <span className="relative flex items-center justify-center gap-3 text-lg font-semibold">
                <span className="text-3xl">📷</span>
                {t.admin.dashboard.scanQR}
              </span>
            </button>
            <button className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">📊</span>
                {t.admin.dashboard.viewReports}
              </span>
            </button>
            <button className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">🎁</span>
                {t.admin.dashboard.manageRewards}
              </span>
            </button>
            <button className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">⚙️</span>
                {t.admin.dashboard.settings}
              </span>
            </button>
          </div>
        </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mt-10">
            <h2 className="text-3xl font-bold mb-6 text-white">{t.admin.dashboard.recentActivity}</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <p className="text-gray-200 text-lg">{t.admin.dashboard.inDevelopment}</p>
              <p className="text-gray-300 text-sm mt-2">{t.admin.dashboard.comingSoon}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
