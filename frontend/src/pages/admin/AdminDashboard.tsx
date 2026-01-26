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
  const { user, tenantId, role, clearAuth } = useAuthStore()
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    totalClients: 0,
    totalRewards: 0,
    scansToday: 0
  })
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Fidelix Admin</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Scan Totali</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.totalScans}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Clienti</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.totalClients}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Premi Dati</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalRewards}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Scan Oggi</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.scansToday}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Azioni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/scan')}
              className="btn-primary py-6 text-lg flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📷</span>
              Scansiona QR Code
            </button>
            <button className="btn-secondary py-6 text-lg flex items-center justify-center gap-2">
              <span className="text-2xl">📊</span>
              Visualizza Report
            </button>
            <button className="btn-secondary py-6 text-lg flex items-center justify-center gap-2">
              <span className="text-2xl">🎁</span>
              Gestisci Premi
            </button>
            <button className="btn-secondary py-6 text-lg flex items-center justify-center gap-2">
              <span className="text-2xl">⚙️</span>
              Impostazioni
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-8">
          <h2 className="text-xl font-bold mb-4">Attività Recente</h2>
          <p className="text-gray-600">Funzionalità in sviluppo...</p>
        </div>
      </div>
    </div>
  )
}
