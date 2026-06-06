import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { supabase } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import { 
  Building2, Users, Activity, Gift, TrendingUp, Calendar,
  Search, Download, RefreshCw, Power, PowerOff,
  Award, Zap, BarChart3, Clock, CheckCircle, XCircle,
  Settings, Bell, Plus, Eye
} from 'lucide-react'

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

interface ActivityLog {
  id: string
  action: string
  tenant_name: string
  timestamp: string
  type: 'scan' | 'reward' | 'client' | 'tenant'
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
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'scans' | 'clients' | 'created'>('scans')
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

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
      loadRecentActivity()
    }
  }, [role])

  const loadRecentActivity = async () => {
    try {
      // Get recent scan events with tenant info
      const { data: recentScans } = await supabase
        .from('scan_events')
        .select('id, scanned_at, reward_applied, tenant_id, tenants(name)')
        .order('scanned_at', { ascending: false })
        .limit(10)

      if (recentScans) {
        const activities: ActivityLog[] = recentScans.map((scan: any) => ({
          id: scan.id,
          action: scan.reward_applied ? 'Reward redeemed' : 'Scan registered',
          tenant_name: scan.tenants?.name || 'Unknown',
          timestamp: scan.scanned_at,
          type: scan.reward_applied ? 'reward' : 'scan'
        }))
        setRecentActivity(activities)
      }
    } catch (err) {
      console.error('Failed to load activity log:', err)
    }
  }

  const loadGlobalStats = async () => {
    const timeout = (p: any) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))])
    try {
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)

      const [
        { count: totalTenants },
        { count: activeTenants },
        { count: totalClients },
        { count: totalScans },
        { count: totalRewards },
        { count: scansToday },
        { count: scansThisMonth }
      ] = await Promise.all([
        timeout(supabase.from('tenants').select('*', { count: 'exact', head: true })),
        timeout(supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('active', true)),
        timeout(supabase.from('cards').select('*', { count: 'exact', head: true })),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true })),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('reward_applied', true)),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).gte('scanned_at', today)),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).gte('scanned_at', firstDayOfMonth.toISOString()))
      ]) as any[]

      setGlobalStats({
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalClients: totalClients || 0,
        totalScans: totalScans || 0,
        totalRewards: totalRewards || 0,
        scansToday: scansToday || 0,
        scansThisMonth: scansThisMonth || 0
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to load global stats')
    }
  }

  const loadTenants = async () => {
    setLoading(true)
    const timeout = (p: any) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))])
    try {
      // Get all tenants
      const { data: tenantsData } = await timeout(supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })) as any

      if (!tenantsData) {
        setTenants([])
        return
      }

      // Load stats for each tenant (4 queries in parallel per tenant)
      const today = new Date().toISOString().split('T')[0]
      const tenantsWithStats = await Promise.all(
        tenantsData.map(async (tenant: any) => {
          const [
            { count: totalClients },
            { count: totalScans },
            { count: totalRewards },
            { count: scansToday }
          ] = await Promise.all([
            timeout(supabase.from('cards').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id)),
            timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id)),
            timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('reward_applied', true)),
            timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).gte('scanned_at', today))
          ]) as any[]

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
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const { error } = await Promise.race([
        supabase.from('tenants').update({ active: !currentStatus }).eq('id', tenantId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))
      ]) as any

      if (error) throw error

      // Reload tenants
      await loadTenants()
      await loadGlobalStats()
      
      alert(currentStatus ? 'Tenant deactivated' : 'Tenant activated')
    } catch (err: any) {
      setError(err?.message || 'Failed to update tenant status')
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      loadGlobalStats(),
      loadTenants(),
      loadRecentActivity()
    ])
    setLoading(false)
  }

  const exportData = () => {
    const csv = [
      ['Store Name', 'Email', 'Status', 'Clients', 'Total Scans', 'Rewards', 'Scans Today', 'Created'].join(','),
      ...filteredAndSortedTenants.map(t => 
        [t.name, t.contact_email || '', t.active ? 'Active' : 'Inactive', 
         t.total_clients, t.total_scans, t.total_rewards, t.scans_today,
         new Date(t.created_at).toLocaleDateString()].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loyalcard-stores-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  // Filter and sort tenants
  const filteredAndSortedTenants = tenants
    .filter(tenant => {
      // Status filter
      if (filterStatus === 'active' && !tenant.active) return false
      if (filterStatus === 'inactive' && tenant.active) return false
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return tenant.name.toLowerCase().includes(search) ||
               (tenant.contact_email && tenant.contact_email.toLowerCase().includes(search))
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'scans':
          return b.total_scans - a.total_scans
        case 'clients':
          return b.total_clients - a.total_clients
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })


  if (role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <StaticBackground />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Modern Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Super Admin Control Panel
                  </h1>
                  <p className="text-sm text-gray-300 mt-0.5 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    LoyalCard Platform Management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all border border-blue-400/30"
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">Activity</span>
                </button>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl transition-all border border-purple-400/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold flex items-center gap-2"
                >
                  <PowerOff className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-sm text-red-300 px-5 py-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Global Stats - Redesigned */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="col-span-2 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {globalStats.totalTenants}
                  </div>
                  <div className="text-xs text-purple-300 font-medium mt-1">Total Stores</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-300">Active</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-bold text-green-400">{globalStats.activeTenants}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {globalStats.totalClients}
              </div>
              <div className="text-xs text-blue-300 font-medium">Total Clients</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {globalStats.totalScans}
              </div>
              <div className="text-xs text-indigo-300 font-medium">Total Scans</div>
            </div>

            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {globalStats.totalRewards}
              </div>
              <div className="text-xs text-pink-300 font-medium">Rewards Given</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {globalStats.scansToday}
              </div>
              <div className="text-xs text-orange-300 font-medium">Today</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 group hover:scale-105">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {globalStats.scansThisMonth}
              </div>
              <div className="text-xs text-emerald-300 font-medium">This Month</div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stores by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all shadow-lg"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-xl text-white focus:ring-2 focus:ring-purple-500 transition-all shadow-lg"
              >
                <option value="all">All Stores</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-xl text-white focus:ring-2 focus:ring-purple-500 transition-all shadow-lg"
              >
                <option value="scans">Sort by Scans</option>
                <option value="name">Sort by Name</option>
                <option value="clients">Sort by Clients</option>
                <option value="created">Sort by Date</option>
              </select>

              <button
                onClick={exportData}
                className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl transition-all border border-green-400/30 shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl transition-all border border-purple-400/30 shadow-lg flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{viewMode === 'cards' ? 'Table' : 'Cards'}</span>
              </button>
            </div>
          </div>

          {/* Activity Log Sidebar */}
          {showActivityLog && (
            <div className="mb-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Recent Activity
                </h3>
                <button
                  onClick={() => setShowActivityLog(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-sm">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'reward' 
                          ? 'bg-pink-500/20 text-pink-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {activity.type === 'reward' ? (
                          <Gift className="w-4 h-4" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-400 truncate">{activity.tenant_name}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tenants Section */}
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-purple-400" />
                  Stores Management
                  <span className="text-sm font-normal text-gray-400">({filteredAndSortedTenants.length})</span>
                </h2>
                <button
                  onClick={() => navigate('/super-admin/create-tenant')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center gap-2 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Store</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading stores...</p>
              </div>
            ) : filteredAndSortedTenants.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchTerm || filterStatus !== 'all' ? 'No stores found' : 'No stores yet'}
                </p>
                {(searchTerm || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('all')
                    }}
                    className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {filteredAndSortedTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-white truncate mb-1">{tenant.name}</h3>
                          {tenant.contact_email && (
                            <p className="text-sm text-gray-400 truncate">{tenant.contact_email}</p>
                          )}
                          <div className="mt-2">
                            {tenant.active ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Clients</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{tenant.total_clients}</div>
                      </div>

                      <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs text-gray-400">Scans</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-400">{tenant.total_scans}</div>
                      </div>

                      <div className="bg-pink-500/10 rounded-xl p-3 border border-pink-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4 text-pink-400" />
                          <span className="text-xs text-gray-400">Rewards</span>
                        </div>
                        <div className="text-2xl font-bold text-pink-400">{tenant.total_rewards}</div>
                      </div>

                      <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-xs text-gray-400">Today</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-400">
                          {tenant.scans_today > 0 ? tenant.scans_today : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg hover:scale-105 flex items-center gap-2 ${
                          tenant.active
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                        }`}
                      >
                        {tenant.active ? (
                          <>
                            <PowerOff className="w-3 h-3" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-3 h-3" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Store</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Clients</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Scans</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Rewards</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Today</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAndSortedTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-purple-500/10 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{tenant.name}</div>
                              {tenant.contact_email && (
                                <div className="text-sm text-gray-400 truncate">{tenant.contact_email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tenant.active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-semibold">{tenant.total_clients}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            <span className="text-white font-semibold">{tenant.total_scans}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-pink-400" />
                            <span className="text-white font-semibold">{tenant.total_rewards}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tenant.scans_today > 0 ? (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-400 font-semibold">{tenant.scans_today}</span>
                            </div>
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
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg hover:scale-105 flex items-center gap-2 ${
                              tenant.active
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                            }`}
                          >
                            {tenant.active ? (
                              <>
                                <PowerOff className="w-3 h-3" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3" />
                                Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Performance Insights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-400/30 group hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-amber-300 text-lg">Top Performer</h3>
              </div>
              {tenants.length > 0 ? (
                (() => {
                  const topStore = [...tenants].sort((a, b) => b.total_scans - a.total_scans)[0]
                  return (
                    <div>
                      <div className="font-semibold text-white text-lg mb-2 truncate">{topStore.name}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                          {topStore.total_scans}
                        </span>
                        <span className="text-sm text-amber-300 font-medium">total scans</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-amber-400/30 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Clients</span>
                        <span className="text-sm font-bold text-white">{topStore.total_clients}</span>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-amber-400/50">No data yet</div>
              )}
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-green-400/30 group hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-green-300 text-lg">Most Active Today</h3>
              </div>
              {tenants.length > 0 ? (
                (() => {
                  const mostActive = [...tenants].sort((a, b) => b.scans_today - a.scans_today)[0]
                  return mostActive.scans_today > 0 ? (
                    <div>
                      <div className="font-semibold text-white text-lg mb-2 truncate">{mostActive.name}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {mostActive.scans_today}
                        </span>
                        <span className="text-sm text-green-300 font-medium">scans today</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-400/30 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Total all-time</span>
                        <span className="text-sm font-bold text-white">{mostActive.total_scans}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-green-400/50">No activity today</div>
                  )
                })()
              ) : (
                <div className="text-green-400/50">No data yet</div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-400/30 group hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-blue-300 text-lg">Best Engagement</h3>
              </div>
              {tenants.length > 0 ? (
                (() => {
                  const withEngagement = tenants
                    .filter(t => t.total_clients > 0)
                    .map(t => ({ ...t, engagement: t.total_scans / t.total_clients }))
                    .sort((a, b) => b.engagement - a.engagement)[0]
                  
                  return withEngagement ? (
                    <div>
                      <div className="font-semibold text-white text-lg mb-2 truncate">{withEngagement.name}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          {withEngagement.engagement.toFixed(1)}
                        </span>
                        <span className="text-sm text-blue-300 font-medium">scans/client</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-400/30 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Rewards given</span>
                        <span className="text-sm font-bold text-white">{withEngagement.total_rewards}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-blue-400/50">No data yet</div>
                  )
                })()
              ) : (
                <div className="text-blue-400/50">No data yet</div>
              )}
            </div>
          </div>

          {/* Platform Health Summary */}
          <div className="mt-8 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Platform Health Status</h3>
                  <p className="text-sm text-gray-300 mt-1">Real-time system overview</p>
                </div>
              </div>
              {globalStats.activeTenants > 0 && globalStats.scansToday > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl border border-green-400/30">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">Healthy & Active</span>
                </div>
              ) : globalStats.activeTenants > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-semibold">Needs Activity</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">Getting Started</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Avg. Scans/Store</div>
                <div className="text-2xl font-bold text-white">
                  {globalStats.activeTenants > 0 
                    ? Math.round(globalStats.scansThisMonth / globalStats.activeTenants) 
                    : 0}
                </div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Reward Rate</div>
                <div className="text-2xl font-bold text-white">
                  {globalStats.totalScans > 0 
                    ? ((globalStats.totalRewards / globalStats.totalScans) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Active Rate</div>
                <div className="text-2xl font-bold text-white">
                  {globalStats.totalTenants > 0 
                    ? ((globalStats.activeTenants / globalStats.totalTenants) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Avg. Clients/Store</div>
                <div className="text-2xl font-bold text-white">
                  {globalStats.activeTenants > 0 
                    ? Math.round(globalStats.totalClients / globalStats.activeTenants) 
                    : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
