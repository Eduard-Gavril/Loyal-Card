import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { supabase } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

interface GlobalStats {
  totalTenants: number
  activeTenants: number
  totalClients: number
  totalScans: number
  totalRewards: number
  scansToday: number
  scansThisMonth: number
}

interface TenantInfo {
  id: string
  name: string
  contact_email: string | null
  logo_url: string | null
  active: boolean
  created_at: string
  total_clients: number
  total_scans: number
  total_rewards: number
  scans_today: number
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { user, role, clearAuth } = useAuthStore()
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalClients: 0,
    totalScans: 0,
    totalRewards: 0,
    scansToday: 0,
    scansThisMonth: 0
  })
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Redirect if not super admin
  useEffect(() => {
    if (!user || role !== 'super_admin') {
      navigate('/admin/login')
    }
  }, [user, role, navigate])

  useEffect(() => {
    if (role === 'super_admin') {
      loadGlobalStats()
      loadTenants()
    }
  }, [role])

  const loadGlobalStats = async () => {
    try {
      // Get all tenants count
      const { count: totalTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })

      const { count: activeTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      // Get total clients across all tenants
      const { count: totalClients } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })

      // Get total scans
      const { count: totalScans } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })

      // Get total rewards
      const { count: totalRewards } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .eq('reward_applied', true)

      // Get scans today
      const today = new Date().toISOString().split('T')[0]
      const { count: scansToday } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', today)

      // Get scans this month
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      const { count: scansThisMonth } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', firstDayOfMonth.toISOString())

      setGlobalStats({
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalClients: totalClients || 0,
        totalScans: totalScans || 0,
        totalRewards: totalRewards || 0,
        scansToday: scansToday || 0,
        scansThisMonth: scansThisMonth || 0
      })
    } catch (error) {
      console.error('Error loading global stats:', error)
    }
  }

  const loadTenants = async () => {
    setLoading(true)
    try {
      // Get all tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (!tenantsData) {
        setTenants([])
        return
      }

      // Load stats for each tenant
      const tenantsWithStats = await Promise.all(
        tenantsData.map(async (tenant) => {
          // Get clients count
          const { count: totalClients } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Get scans count
          const { count: totalScans } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Get rewards count
          const { count: totalRewards } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('reward_applied', true)

          // Get scans today
          const today = new Date().toISOString().split('T')[0]
          const { count: scansToday } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .gte('scanned_at', today)

          return {
            ...tenant,
            total_clients: totalClients || 0,
            total_scans: totalScans || 0,
            total_rewards: totalRewards || 0,
            scans_today: scansToday || 0
          }
        })
      )

      setTenants(tenantsWithStats)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ active: !currentStatus })
        .eq('id', tenantId)

      if (error) throw error

      // Reload tenants
      await loadTenants()
      await loadGlobalStats()
      
      alert(currentStatus ? '❌ Tenant disattivato' : '✅ Tenant attivato')
    } catch (error) {
      console.error('Error toggling tenant status:', error)
      alert('Errore durante la modifica dello stato')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.contact_email && tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* All content */}
      <div className="relative">
        {/* Header */}
        <header className="bg-gray-800/95 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-purple-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  🎛️ Super Admin Dashboard
                </h1>
                <p className="text-sm text-gray-300 mt-1">LoyalCard Platform Management</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Global Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-500/30">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              {globalStats.totalTenants}
            </div>
            <div className="text-sm font-medium text-purple-300 mt-1">Total Stores</div>
            <div className="text-xs text-green-400 mt-2 font-semibold">
              ✅ {globalStats.activeTenants} active
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-500/30">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
              {globalStats.totalClients}
            </div>
            <div className="text-sm font-medium text-blue-300 mt-1">Total Clients</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-500/30">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">
              {globalStats.totalScans}
            </div>
            <div className="text-sm font-medium text-indigo-300 mt-1">Total Scans</div>
            <div className="text-xs text-orange-400 mt-2 font-semibold">
              🔥 {globalStats.scansToday} today
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/40 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-500/30">
            <div className="text-4xl mb-3">🎁</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">
              {globalStats.totalRewards}
            </div>
            <div className="text-sm font-medium text-pink-300 mt-1">Total Rewards</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-500/30 col-span-2">
            <div className="text-4xl mb-3">📈</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {globalStats.scansThisMonth}
            </div>
            <div className="text-sm font-medium text-green-300 mt-1">Scans This Month</div>
            <div className="text-xs text-gray-400 mt-2 font-medium">
              Average: {globalStats.activeTenants > 0 
                ? Math.round(globalStats.scansThisMonth / globalStats.activeTenants) 
                : 0} per store
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white col-span-2">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-2xl font-bold">Platform Health</div>
            <div className="text-sm mt-3 font-semibold">
              {globalStats.activeTenants > 0 && globalStats.scansToday > 0 ? (
                <span>✅ Active & Growing</span>
              ) : globalStats.activeTenants > 0 ? (
                <span>⚠️ Needs Activity</span>
              ) : (
                <span>⏳ Starting Up</span>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search stores by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-xl border-2 border-purple-500/30 bg-gray-800/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-md"
          />
        </div>

        {/* Tenants Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-purple-500/30">
          <div className="px-4 sm:px-6 py-5 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Stores Management ({filteredTenants.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading stores...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchTerm ? 'No stores found' : 'No stores yet'}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-purple-500/20">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 hover:bg-purple-900/30 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{tenant.name}</div>
                          {tenant.active ? (
                            <span className="inline-flex px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              ✅ Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              ❌ Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-900/30 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Clients</div>
                        <div className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                          {tenant.total_clients} <span className="text-gray-500">👥</span>
                        </div>
                      </div>
                      <div className="bg-gray-900/30 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Total Scans</div>
                        <div className="text-sm font-semibold text-indigo-400 flex items-center gap-1">
                          {tenant.total_scans} <span className="text-gray-500">📊</span>
                        </div>
                      </div>
                      <div className="bg-gray-900/30 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Rewards</div>
                        <div className="text-sm font-semibold text-pink-400 flex items-center gap-1">
                          {tenant.total_rewards} <span className="text-gray-500">🎁</span>
                        </div>
                      </div>
                      <div className="bg-gray-900/30 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">Today</div>
                        <div className="text-sm font-semibold">
                          {tenant.scans_today > 0 ? (
                            <span className="text-green-400 flex items-center gap-1">
                              🔥 {tenant.scans_today}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md ${
                        tenant.active
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      }`}
                    >
                      {tenant.active ? '🔴 Deactivate Store' : '✅ Activate Store'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Store</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Clients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Total Scans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Rewards</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Today</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-purple-900/30 transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white text-base truncate">{tenant.name}</div>
                              {tenant.contact_email && (
                                <div className="text-sm text-gray-400 truncate">{tenant.contact_email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tenant.active ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                              ✅ Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                              ❌ Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <div className="flex items-center gap-1">
                            <span className="text-blue-400 font-semibold">{tenant.total_clients}</span>
                            <span className="text-gray-500">👥</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <div className="flex items-center gap-1">
                            <span className="text-indigo-400 font-semibold">{tenant.total_scans}</span>
                            <span className="text-gray-500">📊</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <div className="flex items-center gap-1">
                            <span className="text-pink-400 font-semibold">{tenant.total_rewards}</span>
                            <span className="text-gray-500">🎁</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {tenant.scans_today > 0 ? (
                            <span className="inline-flex px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30 whitespace-nowrap">
                              🔥 {tenant.scans_today}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(tenant.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap ${
                              tenant.active
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                            }`}
                          >
                            {tenant.active ? '🔴 Deactivate' : '✅ Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Quick Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-500/30">
            <h3 className="font-bold text-amber-300 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span> Top Performing Store
            </h3>
            {tenants.length > 0 ? (
              (() => {
                const topStore = [...tenants].sort((a, b) => b.total_scans - a.total_scans)[0]
                return (
                  <div>
                    <div className="font-medium text-purple-300 mb-2">{topStore.name}</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                      {topStore.total_scans}
                    </div>
                    <div className="text-sm text-amber-400 font-medium mt-1">total scans</div>
                  </div>
                )
              })()
            ) : (
              <div className="text-amber-500">No data yet</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-500/30">
            <h3 className="font-bold text-green-300 mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span> Most Active Today
            </h3>
            {tenants.length > 0 ? (
              (() => {
                const mostActive = [...tenants].sort((a, b) => b.scans_today - a.scans_today)[0]
                return mostActive.scans_today > 0 ? (
                  <div>
                    <div className="font-medium text-green-300 mb-2">{mostActive.name}</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {mostActive.scans_today}
                    </div>
                    <div className="text-sm text-green-400 font-medium mt-1">scans today</div>
                  </div>
                ) : (
                  <div className="text-green-500">No activity today</div>
                )
              })()
            ) : (
              <div className="text-green-500">No data yet</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-500/30">
            <h3 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
              <span className="text-2xl">💎</span> Highest Engagement
            </h3>
            {tenants.length > 0 ? (
              (() => {
                const withEngagement = tenants
                  .filter(t => t.total_clients > 0)
                  .map(t => ({ ...t, engagement: t.total_scans / t.total_clients }))
                  .sort((a, b) => b.engagement - a.engagement)[0]
                
                return withEngagement ? (
                  <div>
                    <div className="font-medium text-blue-300 mb-2">{withEngagement.name}</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {withEngagement.engagement.toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-400 font-medium mt-1">scans per client</div>
                  </div>
                ) : (
                  <div className="text-blue-500">No data yet</div>
                )
              })()
            ) : (
              <div className="text-blue-500">No data yet</div>
            )}
          </div>
        </div>
      </div>
      </div> {/* Close z-10 wrapper */}
    </div>
  )
}
