import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { api, supabase } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import { getProductEmoji } from '@/lib/emojiUtils'
import { BarChart3, User } from 'lucide-react'

interface DailyStats {
  date: string
  scans: number
  rewards: number
}

interface TopProduct {
  name: string
  count: number
  emoji: string
}

interface StaffScanCount {
  label: string
  count: number
  active: boolean
}

interface RecentScanDetail {
  id: string
  scanned_at: string
  product_name: string
  product_emoji: string
  client_label: string
  staff_label: string
  reward_applied: boolean
}

export default function AdminReports() {
  const navigate = useNavigate()
  const { tenantId, user, role } = useAuthStore()
  const { language } = useClientStore()
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [staffScans, setStaffScans] = useState<StaffScanCount[]>([])
  const [recentScanDetails, setRecentScanDetails] = useState<RecentScanDetail[]>([])
  const [totalStats, setTotalStats] = useState({
    totalScans: 0,
    totalRewards: 0,
    avgScansPerDay: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    loadReports()
  }, [tenantId, timeRange])

  const loadReports = async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')

    const timeout = (p: any) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))])

    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all scans in the time range
      const { data: scans } = await timeout(supabase
        .from('scan_events')
        .select('id, scanned_at, reward_applied, product_id, admin_id, client_id, products (name, metadata), clients (name)')
        .eq('tenant_id', tenantId)
        .gte('scanned_at', startDate.toISOString())
        .order('scanned_at', { ascending: false })) as any

      // Get products for names
      const { data: products } = await timeout(supabase
        .from('products')
        .select('id, name, metadata')
        .eq('tenant_id', tenantId)) as any

      // Resolve staff labels: caller's own admin row (for "You"/owner label) + staff accounts
      const staffLabel = language === 'ro' ? 'Angajat' : language === 'it' ? 'Dipendente' : 'Staff'
      const youLabel = language === 'ro' ? 'Tu (Proprietar)' : language === 'it' ? 'Tu (Titolare)' : 'You (Owner)'
      const adminLabels = new Map<string, { label: string; active: boolean }>()

      try {
        const { data: ownAdmin } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', user?.id)
          .single()
        if (ownAdmin) {
          adminLabels.set(ownAdmin.id, { label: role === 'owner' ? youLabel : (user?.email || staffLabel), active: true })
        }
      } catch {
        // Own admin row lookup failed - staff labels will just fall back to a generic name
      }

      if (role === 'owner') {
        try {
          const staffResult: any = await api.listStaffAdmins()
          ;(staffResult?.staff || []).forEach((s: any) => {
            adminLabels.set(s.id, { label: s.email || `${staffLabel} ${s.id.substring(0, 6)}`, active: s.active })
          })
        } catch {
          // Staff list failed to load - per-staff scan breakdown will show generic labels
        }
      }

      const labelForAdmin = (adminId: string | null) => {
        if (!adminId) return staffLabel
        const found = adminLabels.get(adminId)
        if (!found) return `${staffLabel} ${adminId.substring(0, 6)}`
        return found.active ? found.label : `${found.label} (${language === 'ro' ? 'dezactivat' : language === 'it' ? 'disattivato' : 'removed'})`
      }

      // Process daily stats
      const dailyMap = new Map<string, { scans: number; rewards: number }>()
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dailyMap.set(dateStr, { scans: 0, rewards: 0 })
      }

      // Count scans per day
      scans?.forEach((scan: any) => {
        const dateStr = scan.scanned_at.split('T')[0]
        const existing = dailyMap.get(dateStr) || { scans: 0, rewards: 0 }
        existing.scans++
        if (scan.reward_applied) existing.rewards++
        dailyMap.set(dateStr, existing)
      })

      // Convert to array and sort
      const dailyArray = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setDailyStats(dailyArray)

      // Calculate product stats
      const productCounts = new Map<string, number>()
      scans?.forEach((scan: any) => {
        if (scan.product_id) {
          const count = productCounts.get(scan.product_id) || 0
          productCounts.set(scan.product_id, count + 1)
        }
      })

      // Get top 5 products
      const topProductsArray = Array.from(productCounts.entries())
        .map(([id, count]) => {
          const product = products?.find((p: any) => p.id === id)
          return {
            name: product?.name || 'Unknown',
            count,
            emoji: getProductEmoji(product?.name || 'Unknown', product?.metadata)
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopProducts(topProductsArray)

      // Calculate scans per staff member
      const staffCounts = new Map<string, number>()
      scans?.forEach((scan: any) => {
        const key = scan.admin_id || 'unknown'
        staffCounts.set(key, (staffCounts.get(key) || 0) + 1)
      })
      const staffScansArray = Array.from(staffCounts.entries())
        .map(([adminId, count]) => ({
          label: labelForAdmin(adminId === 'unknown' ? null : adminId),
          count,
          active: adminId === 'unknown' ? true : (adminLabels.get(adminId)?.active ?? true)
        }))
        .sort((a, b) => b.count - a.count)
      setStaffScans(staffScansArray)

      // Recent scans with client name (falls back to short client id if no name saved)
      const clientLabel = (name: string | null | undefined, clientId: string | null | undefined) =>
        name?.trim() || (clientId ? `${language === 'ro' ? 'Client' : language === 'it' ? 'Cliente' : 'Client'} #${clientId.substring(0, 8)}` : '—')

      const recentDetails: RecentScanDetail[] = (scans || []).slice(0, 15).map((scan: any) => ({
        id: scan.id,
        scanned_at: scan.scanned_at,
        product_name: scan.products?.name || 'Unknown',
        product_emoji: getProductEmoji(scan.products?.name || 'Unknown', scan.products?.metadata),
        client_label: clientLabel(scan.clients?.name, scan.client_id),
        staff_label: labelForAdmin(scan.admin_id),
        reward_applied: scan.reward_applied
      }))
      setRecentScanDetails(recentDetails)

      // Calculate totals
      const totalScans = scans?.length || 0
      const totalRewards = scans?.filter((s: any) => s.reward_applied).length || 0
      const avgScansPerDay = totalScans / days
      const conversionRate = totalScans > 0 ? (totalRewards / totalScans) * 100 : 0

      setTotalStats({
        totalScans,
        totalRewards,
        avgScansPerDay: Math.round(avgScansPerDay * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      })

    } catch (err: any) {
      setError(err?.message || (language === 'ro' ? 'Eroare la încărcarea rapoartelor' : language === 'it' ? 'Errore nel caricamento dei report' : 'Failed to load reports'))
    } finally {
      setLoading(false)
    }
  }

  const maxScans = Math.max(...dailyStats.map(d => d.scans), 1)

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticBackground />
      </div>

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {language === 'ro' ? 'Înapoi' : language === 'it' ? 'Indietro' : 'Back'}
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex-1 flex items-center gap-2 sm:gap-3">
              <BarChart3 className="w-7 h-7 sm:w-9 sm:h-9" />
              {language === 'ro' ? 'Rapoarte' : language === 'it' ? 'Report' : 'Reports'}
            </h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Time Range Selector */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {range === '7d' ? (language === 'ro' ? '7 Zile' : language === 'it' ? '7 Giorni' : '7 Days') :
                 range === '30d' ? (language === 'ro' ? '30 Zile' : language === 'it' ? '30 Giorni' : '30 Days') :
                 (language === 'ro' ? '90 Zile' : language === 'it' ? '90 Giorni' : '90 Days')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : language === 'it' ? 'Caricamento...' : 'Loading...'}</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/40 border border-red-500/50 text-red-300 px-5 py-4 rounded-xl mb-6">
              {error}
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
                  <p className="text-gray-300 text-xs sm:text-sm mb-1">{language === 'ro' ? 'Total Scanări' : language === 'it' ? 'Scansioni Totali' : 'Total Scans'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{totalStats.totalScans}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
                  <p className="text-gray-300 text-xs sm:text-sm mb-1">{language === 'ro' ? 'Premii Date' : language === 'it' ? 'Premi Dati' : 'Rewards Given'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{totalStats.totalRewards}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
                  <p className="text-gray-300 text-xs sm:text-sm mb-1">{language === 'ro' ? 'Medie/Zi' : language === 'it' ? 'Media/Giorno' : 'Avg/Day'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{totalStats.avgScansPerDay}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20">
                  <p className="text-gray-300 text-xs sm:text-sm mb-1">{language === 'ro' ? 'Rata Conversie' : language === 'it' ? 'Tasso di Conversione' : 'Conversion Rate'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{totalStats.conversionRate}%</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Scanări pe Zi' : language === 'it' ? 'Scansioni al Giorno' : 'Scans per Day'}
                </h2>
                <div className="flex flex-col gap-2">
                  {/* Bars container */}
                  <div className="flex items-end gap-1 h-40">
                    {dailyStats.map((day) => (
                      <div
                        key={day.date}
                        className="flex-1 relative group"
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded whitespace-nowrap z-10">
                          {day.scans}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm transition-all duration-300 hover:from-primary-500 hover:to-primary-300"
                          style={{ height: `${(day.scans / maxScans) * 160}px`, minHeight: day.scans > 0 ? '4px' : '0' }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  {/* Ruler with ticks */}
                  <div className="relative h-2 border-t border-gray-400/50">
                    <div className="flex h-full">
                      {dailyStats.map((day) => (
                        <div key={day.date} className="flex-1 relative">
                          <div className="absolute left-0 top-0 w-px h-2 bg-gray-400/50"></div>
                        </div>
                      ))}
                      {/* Last tick */}
                      <div className="absolute right-0 top-0 w-px h-2 bg-gray-400/50"></div>
                    </div>
                  </div>
                  {/* Labels container */}
                  <div className="flex items-start gap-1 h-6">
                    {dailyStats.map((day, index) => (
                      <div key={day.date} className="flex-1 flex justify-center">
                        {index % Math.ceil(dailyStats.length / 7) === 0 && (
                          <span className="text-xs text-gray-400">
                            {new Date(day.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : language === 'it' ? 'it-IT' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Produse Populare' : language === 'it' ? 'Prodotti Popolari' : 'Top Products'}
                </h2>
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div key={product.name} className="flex items-center gap-4">
                        <span className="text-2xl w-10 text-center">{product.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-medium">{product.name}</span>
                            <span className="text-gray-300">{product.count} {language === 'ro' ? 'scanări' : language === 'it' ? 'scansioni' : 'scans'}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                              style={{ width: `${(product.count / (topProducts[0]?.count || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    {language === 'ro' ? 'Nicio dată disponibilă' : language === 'it' ? 'Nessun dato disponibile' : 'No data available'}
                  </p>
                )}
              </div>

              {/* Scans by Staff */}
              {role === 'owner' && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 mt-6 sm:mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    {language === 'ro' ? 'Scanări pe Angajat' : language === 'it' ? 'Scansioni per Dipendente' : 'Scans by Staff'}
                  </h2>
                  {staffScans.length > 0 ? (
                    <div className="space-y-4">
                      {staffScans.map((s) => (
                        <div key={s.label} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white font-medium truncate">{s.label}</span>
                              <span className="text-gray-300 flex-shrink-0 ml-2">
                                {s.count} {language === 'ro' ? 'scanări' : language === 'it' ? 'scansioni' : 'scans'}
                              </span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                                style={{ width: `${(s.count / (staffScans[0]?.count || 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      {language === 'ro' ? 'Nicio dată disponibilă' : language === 'it' ? 'Nessun dato disponibile' : 'No data available'}
                    </p>
                  )}
                </div>
              )}

              {/* Recent Scans */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 mt-6 sm:mt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Scanări Recente' : language === 'it' ? 'Scansioni Recenti' : 'Recent Scans'}
                </h2>
                {recentScanDetails.length > 0 ? (
                  <div className="space-y-3">
                    {recentScanDetails.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="text-2xl sm:text-3xl flex-shrink-0">{scan.product_emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium">{scan.product_name}</span>
                            <span className="text-gray-400 text-sm">·</span>
                            <span className="text-gray-300 text-sm truncate">{scan.client_label}</span>
                            {scan.reward_applied && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                                {language === 'ro' ? 'Premiu' : language === 'it' ? 'Premio' : 'Reward'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-1">{scan.staff_label}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-gray-300 text-xs sm:text-sm">
                            {new Date(scan.scanned_at).toLocaleString(language === 'ro' ? 'ro-RO' : language === 'it' ? 'it-IT' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    {language === 'ro' ? 'Nicio dată disponibilă' : language === 'it' ? 'Nessun dato disponibile' : 'No data available'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
