import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'
import { getProductEmoji } from '@/lib/emojiUtils'

interface Stats {
  totalScans: number
  totalClients: number
  totalRewards: number
  scansToday: number
}

interface RecentScan {
  id: string
  scanned_at: string
  reward_applied: boolean
  product_name: string
  product_emoji: string
  client_id: string
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
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  useEffect(() => {
    loadStats()
    loadRecentActivity()
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

  const loadRecentActivity = async () => {
    if (!tenantId) return
    setLoadingActivity(true)

    try {
      const { data } = await supabase
        .from('scan_events')
        .select(`
          id,
          scanned_at,
          reward_applied,
          products (name, metadata),
          cards (client_id)
        `)
        .eq('tenant_id', tenantId)
        .order('scanned_at', { ascending: false })
        .limit(10)

      if (data) {
        const scans: RecentScan[] = data.map((scan: any) => ({
          id: scan.id,
          scanned_at: scan.scanned_at,
          reward_applied: scan.reward_applied,
          product_name: scan.products?.name || 'Unknown',
          product_emoji: getProductEmoji(scan.products?.name || 'Unknown', scan.products?.metadata),
          client_id: scan.cards?.client_id?.substring(0, 8) || '???'
        }))
        setRecentScans(scans)
      }
    } catch (error) {
      console.error('Error loading recent activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return language === 'ro' ? 'Acum' : 'Just now'
    if (diffMins < 60) return language === 'ro' ? `${diffMins} min în urmă` : `${diffMins}m ago`
    if (diffHours < 24) return language === 'ro' ? `${diffHours}h în urmă` : `${diffHours}h ago`
    return language === 'ro' ? `${diffDays}z în urmă` : `${diffDays}d ago`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil hueShift={280} speed={0.3} warpAmount={0.1} />
      </div>

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{t.admin.dashboard.title}</h1>
              <p className="text-xs sm:text-sm text-gray-200 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="truncate max-w-[200px] sm:max-w-none">{user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm sm:text-base font-medium rounded-xl transition-all duration-300 hover:shadow-lg border border-white/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">{t.admin.dashboard.logout}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsTotal}</h3>
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalScans}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsClients}</h3>
                <span className="text-2xl sm:text-3xl">👥</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalClients}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsRewards}</h3>
                <span className="text-2xl sm:text-3xl">🎁</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalRewards}</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide">{t.admin.dashboard.statsToday}</h3>
                <span className="text-2xl sm:text-3xl">⚡</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stats.scansToday}</p>
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
            <button
              onClick={() => navigate('/admin/reports')}
              className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">📊</span>
                {t.admin.dashboard.viewReports}
              </span>
            </button>
            <button
              onClick={() => navigate('/admin/rewards')}
              className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">🎁</span>
                {t.admin.dashboard.manageRewards}
              </span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-white">
                <span className="text-3xl">⚙️</span>
                {t.admin.dashboard.settings}
              </span>
            </button>
          </div>
        </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">{t.admin.dashboard.recentActivity}</h2>
              <button
                onClick={loadRecentActivity}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={language === 'ro' ? 'Reîmprospătează' : 'Refresh'}
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {loadingActivity ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              </div>
            ) : recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                  >
                    {/* Product emoji */}
                    <div className="text-3xl">{scan.product_emoji}</div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{scan.product_name}</span>
                        {scan.reward_applied && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full flex items-center gap-1">
                            🎁 {language === 'ro' ? 'Premiu' : 'Reward'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {language === 'ro' ? 'Client' : 'Client'} #{scan.client_id}
                      </p>
                    </div>
                    
                    {/* Time */}
                    <div className="text-right">
                      <span className="text-gray-300 text-sm">{formatTimeAgo(scan.scanned_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-300 text-lg">
                  {language === 'ro' ? 'Nicio activitate recentă' : 'No recent activity'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {language === 'ro' ? 'Scanările vor apărea aici' : 'Scans will appear here'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
