import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase, Product, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import { getProductEmoji } from '@/lib/emojiUtils'

export default function AdminRewards() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const [products, setProducts] = useState<Product[]>([])
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')

    try {
      const timeout = (p: any) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000))])

      const [{ data: productsData }, { data: rulesData }] = await Promise.all([
        timeout(supabase.from('products').select('*').eq('tenant_id', tenantId).eq('active', true).order('name')),
        timeout(supabase.from('reward_rules').select('*').eq('tenant_id', tenantId).order('created_at')),
      ]) as any[]

      setProducts(productsData || [])
      setRewardRules(rulesData || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const updateRewardRule = async (ruleId: string, buyCount: number) => {
    const previousRules = rewardRules
    setError('')
    setRewardRules(rules => rules.map(r => r.id === ruleId ? { ...r, buy_count: buyCount } : r))
    setEditingRule(null)
    try {
      await Promise.race([
        supabase.from('reward_rules').update({ buy_count: buyCount }).eq('id', ruleId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000))
      ])
    } catch (err: any) {
      setRewardRules(previousRules)
      setError(err?.message || 'Failed to update rule. Please try again.')
    }
  }

  const toggleRuleActive = async (ruleId: string, active: boolean) => {
    const previousRules = rewardRules
    setError('')
    setRewardRules(rules => rules.map(r => r.id === ruleId ? { ...r, active } : r))
    try {
      await Promise.race([
        supabase.from('reward_rules').update({ active }).eq('id', ruleId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000))
      ])
    } catch (err: any) {
      setRewardRules(previousRules)
      setError(err?.message || 'Failed to update rule. Please try again.')
    }
  }

  const getProductName = (productId?: string) => {
    if (!productId) return 'All Products'
    const product = products.find(p => p.id === productId)
    return product?.name || 'Unknown'
  }

  const getProductEmojiById = (productId?: string) => {
    if (!productId) return '🏷️'
    const product = products.find(p => p.id === productId)
    return getProductEmoji(product?.name || 'Unknown', product?.metadata)
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
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{language === 'ro' ? 'Înapoi' : 'Back'}</span>
            </button>
            <h1 className="text-xl sm:text-4xl font-bold text-white tracking-tight flex-1">
              🎁 {language === 'ro' ? 'Gestionare Premii' : 'Manage Rewards'}
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : 'Loading...'}</p>
            </div>
          ) : (
            <>
              {/* Reward Rules */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Reguli Premii' : 'Reward Rules'}
                </h2>
                
                {rewardRules.length > 0 ? (
                  <div className="space-y-4">
                    {rewardRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`bg-white/5 rounded-xl p-4 sm:p-6 border transition-all duration-300 ${
                          rule.active ? 'border-primary-400/50' : 'border-white/10 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 flex-1">
                            <span className="text-3xl sm:text-4xl flex-shrink-0">{getProductEmojiById(rule.product_id)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-white break-words">
                                {rule.name || getProductName(rule.product_id)}
                                {rule.discount_percent && (
                                  <span className="ml-2 text-xs sm:text-sm bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md inline-block mt-1 sm:mt-0">
                                    {rule.discount_percent}% OFF
                                  </span>
                                )}
                              </h3>
                              <p className="text-gray-300 text-xs sm:text-sm mt-1">
                                {rule.description || (language === 'ro' ? 'Premiu gratis' : 'Free reward')}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {rule.priority !== undefined && (
                                  <span className="text-xs text-gray-400">
                                    Priority: {rule.priority}
                                  </span>
                                )}
                                {rule.reset_on_redeem === false && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                    {language === 'ro' ? 'Non resetta' : 'No reset'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                            {/* Scans required */}
                            <div className="text-center flex-shrink-0">
                              {editingRule === rule.id ? (
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                    className="w-14 sm:w-16 px-2 py-1 bg-white/10 border border-white/30 rounded-lg text-white text-center text-sm"
                                    min={1}
                                    max={50}
                                  />
                                  <button
                                    onClick={() => updateRewardRule(rule.id, editValue)}
                                    className="p-1 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setEditingRule(null)}
                                    className="p-1 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingRule(rule.id)
                                    setEditValue(rule.buy_count)
                                  }}
                                  className="group"
                                >
                                  <span className="text-2xl sm:text-3xl font-bold text-white group-hover:text-primary-400 transition-colors">
                                    {rule.buy_count}
                                  </span>
                                  <p className="text-xs text-gray-400 whitespace-nowrap">
                                    {language === 'ro' ? 'achiziții' : 'purchases'}
                                  </p>
                                </button>
                              )}
                            </div>

                            {/* Toggle active */}
                            <button
                              onClick={() => toggleRuleActive(rule.id, !rule.active)}
                              className={`relative w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
                                rule.active ? 'bg-green-500' : 'bg-gray-600'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 sm:top-1 w-6 h-6 sm:w-6 sm:h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                                  rule.active ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'
                                }`}
                              ></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📭</div>
                    <p className="text-gray-300 text-base sm:text-lg">
                      {language === 'ro' ? 'Nicio regulă de premii configurată' : 'No reward rules configured'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {language === 'ro' 
                        ? 'Contactează administratorul pentru a adăuga reguli de premii'
                        : 'Contact the administrator to add reward rules'}
                    </p>
                  </div>
                )}
              </div>

              {/* Products List */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Produse Active' : 'Active Products'}
                </h2>
                
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 text-center hover:bg-white/10 transition-colors"
                      >
                        <span className="text-2xl sm:text-3xl">{getProductEmoji(product.name, product.metadata)}</span>
                        <p className="text-white font-medium mt-2">{product.name}</p>
                        <p className="text-gray-400 text-sm">
                          {product.metadata?.type || 'product'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    {language === 'ro' ? 'Niciun produs configurat' : 'No products configured'}
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
