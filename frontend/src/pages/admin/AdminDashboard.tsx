import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalScans: number
  totalClients: number
  totalRewards: number
  scansToday: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, tenantId, clearAuth } = useAuthStore()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Fidelix Admin</h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Scan Totali</h3>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">{stats.totalScans}</p>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Clienti</h3>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{stats.totalClients}</p>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Premi Dati</h3>
              <span className="text-3xl">🎁</span>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{stats.totalRewards}</p>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Scan Oggi</h3>
              <span className="text-3xl">⚡</span>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.scansToday}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200/50">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Azioni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/scan')}
              className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 text-white py-8 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 hover:scale-105 active:scale-95"
            >
              <span className="relative flex items-center justify-center gap-3 text-lg font-semibold">
                <span className="text-3xl">📷</span>
                Scansiona QR Code
              </span>
            </button>
            <button className="group bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-300 py-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-gray-700 group-hover:text-primary-600">
                <span className="text-3xl">📊</span>
                Visualizza Report
              </span>
            </button>
            <button className="group bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-green-300 py-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-gray-700 group-hover:text-green-600">
                <span className="text-3xl">🎁</span>
                Gestisci Premi
              </span>
            </button>
            <button className="group bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 py-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
              <span className="flex items-center justify-center gap-3 text-lg font-semibold text-gray-700 group-hover:text-purple-600">
                <span className="text-3xl">⚙️</span>
                Impostazioni
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200/50 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Attività Recente</h2>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <p className="text-gray-600 text-lg">Funzionalità in sviluppo</p>
            <p className="text-gray-400 text-sm mt-2">Presto disponibile: log in tempo reale, grafici e analytics</p>
          </div>
        </div>
      </div>
    </div>
  )
}
