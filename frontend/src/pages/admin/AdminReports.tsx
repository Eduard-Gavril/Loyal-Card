import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

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

export default function AdminReports() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [totalStats, setTotalStats] = useState({
    totalScans: 0,
    totalRewards: 0,
    avgScansPerDay: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    loadReports()
  }, [tenantId, timeRange])

  const loadReports = async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all scans in the time range
      const { data: scans } = await supabase
        .from('scan_events')
        .select('scanned_at, reward_applied, product_id')
        .eq('tenant_id', tenantId)
        .gte('scanned_at', startDate.toISOString())
        .order('scanned_at', { ascending: true })

      // Get products for names
      const { data: products } = await supabase
        .from('products')
        .select('id, name, metadata')
        .eq('tenant_id', tenantId)

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
      scans?.forEach(scan => {
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
      scans?.forEach(scan => {
        if (scan.product_id) {
          const count = productCounts.get(scan.product_id) || 0
          productCounts.set(scan.product_id, count + 1)
        }
      })

      // Get top 5 products
      const topProductsArray = Array.from(productCounts.entries())
        .map(([id, count]) => {
          const product = products?.find(p => p.id === id)
          return {
            name: product?.name || 'Unknown',
            count,
            emoji: product?.metadata?.emoji || '☕'
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopProducts(topProductsArray)

      // Calculate totals
      const totalScans = scans?.length || 0
      const totalRewards = scans?.filter(s => s.reward_applied).length || 0
      const avgScansPerDay = totalScans / days
      const conversionRate = totalScans > 0 ? (totalRewards / totalScans) * 100 : 0

      setTotalStats({
        totalScans,
        totalRewards,
        avgScansPerDay: Math.round(avgScansPerDay * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      })

    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxScans = Math.max(...dailyStats.map(d => d.scans), 1)

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
        <header className="pt-6 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {language === 'ro' ? 'Înapoi' : 'Back'}
            </button>
            <h1 className="text-4xl font-bold text-white tracking-tight flex-1">
              📊 {language === 'ro' ? 'Rapoarte' : 'Reports'}
            </h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Time Range Selector */}
          <div className="flex gap-2 mb-8">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {range === '7d' ? (language === 'ro' ? '7 Zile' : '7 Days') :
                 range === '30d' ? (language === 'ro' ? '30 Zile' : '30 Days') :
                 (language === 'ro' ? '90 Zile' : '90 Days')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : 'Loading...'}</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-gray-300 text-sm mb-1">{language === 'ro' ? 'Total Scanări' : 'Total Scans'}</p>
                  <p className="text-3xl font-bold text-white">{totalStats.totalScans}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-gray-300 text-sm mb-1">{language === 'ro' ? 'Premii Date' : 'Rewards Given'}</p>
                  <p className="text-3xl font-bold text-white">{totalStats.totalRewards}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-gray-300 text-sm mb-1">{language === 'ro' ? 'Medie/Zi' : 'Avg/Day'}</p>
                  <p className="text-3xl font-bold text-white">{totalStats.avgScansPerDay}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-gray-300 text-sm mb-1">{language === 'ro' ? 'Rata Conversie' : 'Conversion Rate'}</p>
                  <p className="text-3xl font-bold text-white">{totalStats.conversionRate}%</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Scanări pe Zi' : 'Scans per Day'}
                </h2>
                <div className="flex items-end gap-1 h-48">
                  {dailyStats.map((day, index) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full flex flex-col items-center">
                        <span className="absolute -top-6 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                          {day.scans}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm transition-all duration-300 hover:from-primary-500 hover:to-primary-300"
                          style={{ height: `${(day.scans / maxScans) * 160}px`, minHeight: day.scans > 0 ? '4px' : '0' }}
                        ></div>
                      </div>
                      {index % Math.ceil(dailyStats.length / 7) === 0 && (
                        <span className="text-xs text-gray-400 mt-2">
                          {new Date(day.date).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Produse Populare' : 'Top Products'}
                </h2>
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div key={product.name} className="flex items-center gap-4">
                        <span className="text-2xl w-10 text-center">{product.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-medium">{product.name}</span>
                            <span className="text-gray-300">{product.count} {language === 'ro' ? 'scanări' : 'scans'}</span>
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
                    {language === 'ro' ? 'Nicio dată disponibilă' : 'No data available'}
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
