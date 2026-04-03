import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { translations } from '@/lib/i18n'
import DarkVeil from '@/components/DarkVeil'

interface Product {
  id: string
  name: string
  metadata: {
    emoji?: string
    icon?: string
    category?: string
  }
  active: boolean
  created_at: string
}

interface ProductRule {
  id: string
  product_id: string
  scans_required: number
  level_number: number
  reward_type: string
  reward_description: string
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const t = translations[language].admin.products
  const [products, setProducts] = useState<Product[]>([])
  const [rules, setRules] = useState<Map<string, ProductRule[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showRulesModal, setShowRulesModal] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '📦',
    category: '',
    scans_required: 3
  })

  useEffect(() => {
    if (!tenantId) {
      navigate('/admin/login')
      return
    }
    loadProducts()
  }, [tenantId, navigate])

  const loadProducts = async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      // Get products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      setProducts(productsData || [])

      // Get rules for each product
      const { data: rulesData } = await supabase
        .from('rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('level_number', { ascending: true })

      if (rulesData) {
        const rulesMap = new Map<string, ProductRule[]>()
        rulesData.forEach((rule: any) => {
          const existing = rulesMap.get(rule.product_id) || []
          rulesMap.set(rule.product_id, [...existing, rule])
        })
        setRules(rulesMap)
      }

    } catch (error) {
      console.error('Error loading products:', error)
      alert(t.errorLoading)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return

    try {
      const productData = {
        tenant_id: tenantId,
        name: formData.name,
        metadata: {
          emoji: formData.emoji,
          category: formData.category
        },
        active: true
      }

      let productId: string

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('tenant_id', tenantId)

        if (error) throw error
        productId = editingProduct.id
      } else {
        // Insert new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()

        if (error) throw error
        productId = data.id

        // Create default rule for new product
        await supabase
          .from('rules')
          .insert([{
            tenant_id: tenantId,
            product_id: productId,
            level_number: 1,
            scans_required: formData.scans_required,
            reward_type: 'free_product',
            reward_description: language === 'ro' 
              ? `Premiu: ${formData.name} gratuit` 
              : `Reward: Free ${formData.name}`
          }])
      }

      // Reset form
      setFormData({ name: '', emoji: '📦', category: '', scans_required: 3 })
      setShowAddModal(false)
      setEditingProduct(null)
      loadProducts()

      alert(editingProduct ? t.productUpdated : t.productAdded)

    } catch (error) {
      console.error('Error saving product:', error)
      alert(t.errorSaving)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t.confirmDelete)) {
      return
    }

    try {
      // Delete rules first
      await supabase
        .from('rules')
        .delete()
        .eq('product_id', productId)
        .eq('tenant_id', tenantId)

      // Delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      loadProducts()
      alert(t.productDeleted)

    } catch (error) {
      console.error('Error deleting product:', error)
      alert(t.errorDeleting)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', productId)
        .eq('tenant_id', tenantId)

      if (error) throw error
      
      // Update local state without reloading to preserve scroll position
      setProducts(products.map(p => 
        p.id === productId ? { ...p, active: !currentStatus } : p
      ))
    } catch (error) {
      console.error('Error toggling product status:', error)
      alert(t.errorStatus)
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      emoji: product.metadata?.emoji || '📦',
      category: product.metadata?.category || '',
      scans_required: 3 // Default, will be shown in rules
    })
    setShowAddModal(true)
  }

  const emojiOptions = ['📦', '☕', '🍕', '🍔', '🥗', '🍰', '🎁', '💪', '🏋️', '🧘', '🚴', '🏃', '⚽', '🏀', '🎾', '🏊']

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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  🛍️ {t.title}
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  {t.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null)
                setFormData({ name: '', emoji: '📦', category: '', scans_required: 3 })
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-sm font-semibold"
            >
              + {t.newProduct}
            </button>
          </div>
        </header>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 mx-auto border-3 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t.noProducts}
              </h3>
              <p className="text-gray-400">
                {t.noProductsDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const productRules = rules.get(product.id) || []
                return (
                  <div
                    key={product.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 hover:bg-white/15 transition-all"
                  >
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{product.metadata?.emoji || '📦'}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{product.name}</h3>
                          {product.metadata?.category && (
                            <span className="text-xs text-gray-400">{product.metadata.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.active)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            product.active
                              ? 'bg-green-500 focus:ring-green-500'
                              : 'bg-gray-600 focus:ring-gray-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              product.active ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${
                          product.active ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {product.active ? t.active : t.inactive}
                        </span>
                      </div>
                    </div>

                    {/* Rules Info */}
                    <div className="mb-4 space-y-2">
                      {productRules.length > 0 ? (
                        productRules.map((rule) => (
                          <div key={rule.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">
                                {t.level} {rule.level_number}: {rule.scans_required} {t.scans}
                              </span>
                              <span className="text-xs text-purple-400">🎁</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{rule.reward_description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          {t.noRules}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30 text-xs font-semibold"
                      >
                        ✏️ {t.edit}
                      </button>
                      <button
                        onClick={() => setShowRulesModal(product.id)}
                        className="flex-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 text-xs font-semibold"
                      >
                        ⚙️ {t.rules}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-xs font-semibold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingProduct ? t.editTitle : t.addTitle}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t.productName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t.productNamePlaceholder}
                  required
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t.icon}
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        formData.emoji === emoji
                          ? 'bg-purple-500/30 ring-2 ring-purple-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t.category}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t.categoryPlaceholder}
                />
              </div>

              {/* Scans Required (only for new products) */}
              {!editingProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {t.scansRequired}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.scans_required}
                    onChange={(e) => setFormData({ ...formData, scans_required: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t.scansRequiredDesc}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingProduct(null)
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-sm font-semibold"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal (placeholder for future implementation) */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              {t.manageRules}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {t.rulesDesc}
            </p>
            
            {/* Show current rules */}
            <div className="space-y-3 mb-4">
              {(rules.get(showRulesModal) || []).map((rule) => (
                <div key={rule.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-semibold text-sm">{t.level} {rule.level_number}</h4>
                      <p className="text-xs text-gray-400 mt-1">{rule.reward_description}</p>
                    </div>
                    <span className="text-purple-400 font-bold text-sm">{rule.scans_required} {t.scans}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRulesModal(null)}
              className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-semibold"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
