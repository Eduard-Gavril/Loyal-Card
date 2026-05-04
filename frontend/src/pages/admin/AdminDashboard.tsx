import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'
import { getProductEmoji } from '@/lib/emojiUtils'
import * as XLSX from 'xlsx'

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
    const timeout = (p: any) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))])

    try {
      const today = new Date().toISOString().split('T')[0]
      const [r1, r2, r3, r4] = await Promise.all([
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)),
        timeout(supabase.from('cards').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('scanned_at', today)),
        timeout(supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('reward_applied', true)),
      ]) as any[]

      setStats({
        totalScans: r1.count || 0,
        totalClients: r2.count || 0,
        scansToday: r3.count || 0,
        totalRewards: r4.count || 0,
      })
    } catch {
      // Stats failed to load - leave defaults as 0
    }
  }

  const loadRecentActivity = async () => {
    if (!tenantId) return
    setLoadingActivity(true)

    try {
      const { data } = await Promise.race([
        supabase
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
          .limit(10),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
        )
      ]) as any

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
    } catch {
      // Activity failed to load - spinner stops
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

    if (diffMins < 1) return language === 'ro' ? 'Acum' : language === 'it' ? 'Adesso' : 'Just now'
    if (diffMins < 60) return language === 'ro' ? `${diffMins} min în urmă` : language === 'it' ? `${diffMins} min fa` : `${diffMins}m ago`
    if (diffHours < 24) return language === 'ro' ? `${diffHours}h în urmă` : language === 'it' ? `${diffHours}h fa` : `${diffHours}h ago`
    return language === 'ro' ? `${diffDays}z în urmă` : language === 'it' ? `${diffDays}g fa` : `${diffDays}d ago`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/admin/login')
  }

  const downloadClientsExcel = async () => {
    if (!tenantId) return

    try {
      // Get all cards for this tenant with client details using JOIN
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select(`
          id,
          qr_code,
          created_at,
          last_scan_at,
          loyalty_state,
          client_id,
          clients (
            phone,
            created_at
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (cardsError) {
        alert(language === 'ro' ? `Eroare: ${cardsError.message}` : language === 'it' ? `Errore: ${cardsError.message}` : `Error: ${cardsError.message}`)
        return
      }

      if (!cards || cards.length === 0) {
        alert(language === 'ro' ? 'Nu există clienți de exportat' : language === 'it' ? 'Nessun cliente da esportare' : 'No clients to export')
        return
      }

      // Get scan events count for each card
      const clientsData = await Promise.all(
        cards.map(async (card: any) => {
          // Count total scans for this card
          const { count: totalScans } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('client_id', card.client_id)

          // Count rewards received
          const { count: rewardsCount } = await supabase
            .from('scan_events')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('client_id', card.client_id)
            .eq('reward_applied', true)

          // Calculate total stamps from loyalty_state jsonb
          let totalStamps = 0
          if (card.loyalty_state && typeof card.loyalty_state === 'object') {
            Object.values(card.loyalty_state).forEach((val: any) => {
              if (val && typeof val === 'object' && val.count) {
                totalStamps += val.count
              }
            })
          }

          return {
            'QR Code': card.qr_code || 'N/A',
            'Phone': card.clients?.phone || 'N/A',
            'Card Registration': card.created_at ? new Date(card.created_at).toLocaleDateString() : 'N/A',
            'Client Registration': card.clients?.created_at ? new Date(card.clients.created_at).toLocaleDateString() : 'N/A',
            'Last Scan': card.last_scan_at ? new Date(card.last_scan_at).toLocaleDateString() : 'Never',
            'Total Stamps': totalStamps,
            'Total Scans': totalScans || 0,
            'Rewards Received': rewardsCount || 0
          }
        })
      )

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(clientsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Clients')

      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // QR Code
        { wch: 15 }, // Phone
        { wch: 18 }, // Card Registration
        { wch: 18 }, // Client Registration
        { wch: 15 }, // Last Scan
        { wch: 15 }, // Total Stamps
        { wch: 12 }, // Total Scans
        { wch: 18 }  // Rewards Received
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `LoyalCard_Clients_${date}.xlsx`

      // Download
      XLSX.writeFile(wb, filename)

    } catch (error: any) {
      alert(language === 'ro' ? 'Eroare la exportul datelor' : language === 'it' ? 'Errore durante l\'esportazione' : 'Error exporting data')
    }
  }

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
                onClick={() => navigate('/admin/settings')}
                className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg transition-all duration-300 hover:shadow-lg border border-white/20"
                title={t.admin.dashboard.settings}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
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
          {/* Quick Actions - Moved to top for better mobile UX */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 border border-white/20 mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">{t.admin.dashboard.quickActions}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/admin/scan')}
              className="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 text-white py-6 sm:py-8 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 hover:scale-105 active:scale-95"
            >
              <span className="relative flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {t.admin.dashboard.scanQR}
              </span>
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-6 sm:py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-white">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                {t.admin.dashboard.viewReports}
              </span>
            </button>
            <button
              onClick={() => navigate('/admin/products')}
              className="group bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/40 py-6 sm:py-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-white">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </span>
                {t.admin.dashboard.manageRewards}
              </span>
            </button>
            <button
              onClick={downloadClientsExcel}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-2 border-green-400/40 py-6 sm:py-8 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-600/40 hover:scale-105 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-white">
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                {language === 'ro' ? 'Download Report Excel' : language === 'it' ? 'Scarica Report Excel' : 'Download Excel Report'}
              </span>
            </button>
          </div>
        </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">{t.admin.dashboard.statsTotal}</h3>
                <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalScans}</p>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">{t.admin.dashboard.statsClients}</h3>
                <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalClients}</p>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">{t.admin.dashboard.statsRewards}</h3>
                <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalRewards}</p>
              </div>
            </div>
            <div className="group bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-gray-200 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">{t.admin.dashboard.statsToday}</h3>
                <p className="text-3xl sm:text-4xl font-bold text-white">{stats.scansToday}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">{t.admin.dashboard.recentActivity}</h2>
              <button
                onClick={loadRecentActivity}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={language === 'ro' ? 'Reîmprospătează' : language === 'it' ? 'Aggiorna' : 'Refresh'}
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
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            {language === 'ro' ? 'Premiu' : language === 'it' ? 'Premio' : 'Reward'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {language === 'ro' ? 'Client' : language === 'it' ? 'Cliente' : 'Client'} #{scan.client_id}
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
                  {language === 'ro' ? 'Nicio activitate recentă' : language === 'it' ? 'Nessuna attività recente' : 'No recent activity'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {language === 'ro' ? 'Scanările vor apărea aici' : language === 'it' ? 'Le scansioni appariranno qui' : 'Scans will appear here'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
