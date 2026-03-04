import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase, Product, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

export default function AdminRewards() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const [products, setProducts] = useState<Product[]>([])
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name')

      // Load reward rules
      const { data: rulesData } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at')

      setProducts(productsData || [])
      setRewardRules(rulesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRewardRule = async (ruleId: string, buyCount: number) => {
    try {
      await supabase
        .from('reward_rules')
        .update({ buy_count: buyCount })
        .eq('id', ruleId)

      setRewardRules(rules => 
        rules.map(r => r.id === ruleId ? { ...r, buy_count: buyCount } : r)
      )
      setEditingRule(null)
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

  const toggleRuleActive = async (ruleId: string, active: boolean) => {
    try {
      await supabase
        .from('reward_rules')
        .update({ active })
        .eq('id', ruleId)

      setRewardRules(rules => 
        rules.map(r => r.id === ruleId ? { ...r, active } : r)
      )
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const getProductName = (productId?: string) => {
    if (!productId) return 'All Products'
    const product = products.find(p => p.id === productId)
    return product?.name || 'Unknown'
  }

  const getProductEmoji = (productId?: string) => {
    if (!productId) return '🏷️'
    const product = products.find(p => p.id === productId)
    return product?.metadata?.emoji || '🎁'
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
              🎁 {language === 'ro' ? 'Gestionare Premii' : 'Manage Rewards'}
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-10">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : 'Loading...'}</p>
            </div>
          ) : (
            <>
              {/* Reward Rules */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Reguli Premii' : 'Reward Rules'}
                </h2>
                
                {rewardRules.length > 0 ? (
                  <div className="space-y-4">
                    {rewardRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`bg-white/5 rounded-xl p-6 border transition-all duration-300 ${
                          rule.active ? 'border-primary-400/50' : 'border-white/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{getProductEmoji(rule.product_id)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {rule.name || getProductName(rule.product_id)}
                              </h3>
                              <p className="text-gray-300 text-sm">
                                {rule.description || (language === 'ro' ? 'Premiu gratis' : 'Free reward')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Scans required */}
                            <div className="text-center">
                              {editingRule === rule.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 bg-white/10 border border-white/30 rounded-lg text-white text-center"
                                    min={1}
                                    max={50}
                                  />
                                  <button
                                    onClick={() => updateRewardRule(rule.id, editValue)}
                                    className="p-1 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setEditingRule(null)}
                                    className="p-1 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                  <span className="text-3xl font-bold text-white group-hover:text-primary-400 transition-colors">
                                    {rule.buy_count}
                                  </span>
                                  <p className="text-xs text-gray-400">
                                    {language === 'ro' ? 'achiziții necesare' : 'purchases required'}
                                  </p>
                                </button>
                              )}
                            </div>

                            {/* Toggle active */}
                            <button
                              onClick={() => toggleRuleActive(rule.id, !rule.active)}
                              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                                rule.active ? 'bg-green-500' : 'bg-gray-600'
                              }`}
                            >
                              <div
                                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                                  rule.active ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              ></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-300 text-lg">
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
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {language === 'ro' ? 'Produse Active' : 'Active Products'}
                </h2>
                
                {products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 text-center hover:bg-white/10 transition-colors"
                      >
                        <span className="text-3xl">{product.metadata?.emoji || '☕'}</span>
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
