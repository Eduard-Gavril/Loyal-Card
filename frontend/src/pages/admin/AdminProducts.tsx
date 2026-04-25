import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { translations } from '@/lib/i18n'
import DarkVeil from '@/components/DarkVeil'

interface Product {
  id: string
  name: string
  price?: number
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
  name: string
  description?: string
  buy_count: number
  reward_count: number
  discount_percent?: number
  reward_type: string
  active: boolean
  priority: number
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
  const [showAddRuleForm, setShowAddRuleForm] = useState(false)
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '📦',
    category: '',
    price: '',
    scans_required: 3
  })

  // Rule form state
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    priority: 1,
    buy_count: 3,
    reward_count: 1,
    reward_type: 'free_product',
    description: '',
    discount_percent: 10
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
        .from('reward_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true })

      if (rulesData) {
        const rulesMap = new Map<string, ProductRule[]>()
        rulesData.forEach((rule: any) => {
          // Calculate reward_type based on discount_percent
          const ruleWithType = {
            ...rule,
            reward_type: rule.discount_percent !== null && rule.discount_percent !== undefined 
              ? 'percentage_discount' 
              : 'free_product'
          }
          const existing = rulesMap.get(rule.product_id) || []
          rulesMap.set(rule.product_id, [...existing, ruleWithType])
        })
        setRules(rulesMap)
      }

    } catch (error) {
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
        price: formData.price ? parseFloat(formData.price) : null,
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
          .from('reward_rules')
          .insert([{
            tenant_id: tenantId,
            product_id: productId,
            name: language === 'ro' 
              ? `${formData.name} gratuit` 
              : `Free ${formData.name}`,
            description: language === 'ro' 
              ? `Primești 1 ${formData.name} gratuit` 
              : `Get 1 free ${formData.name}`,
            buy_count: formData.scans_required,
            reward_count: 1,
            discount_percent: null,
            active: true,
            priority: 1
          }])
      }

      // Reset form
      setFormData({ name: '', emoji: '📦', category: '', price: '', scans_required: 3 })
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
        .from('reward_rules')
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
      alert(t.errorStatus)
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      emoji: product.metadata?.emoji || '📦',
      category: product.metadata?.category || '',
      price: product.price ? product.price.toString() : '',
      scans_required: 3 // Default, will be shown in rules
    })
    setShowAddModal(true)
  }

  // Rules Management Functions
  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !showRulesModal) return

    try {
      const ruleData = {
        tenant_id: tenantId,
        product_id: showRulesModal,
        name: ruleFormData.name,
        description: ruleFormData.description,
        buy_count: ruleFormData.buy_count,
        reward_count: ruleFormData.reward_type === 'free_product' ? ruleFormData.reward_count : 0,
        discount_percent: ruleFormData.reward_type === 'percentage_discount' ? ruleFormData.discount_percent : null,
        active: true,
        priority: ruleFormData.priority
      }

      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('reward_rules')
          .update(ruleData)
          .eq('id', editingRule.id)
          .eq('tenant_id', tenantId)

        if (error) throw error
      } else {
        // Insert new rule
        const { error } = await supabase
          .from('reward_rules')
          .insert([ruleData])

        if (error) throw error
      }

      // Reset form and reload
      setRuleFormData({
        name: '',
        priority: 1,
        buy_count: 3,
        reward_count: 1,
        reward_type: 'free_product',
        description: '',
        discount_percent: 10
      })
      setShowAddRuleForm(false)
      setEditingRule(null)
      loadProducts()

      alert(editingRule ? t.ruleUpdated : t.ruleAdded)

    } catch (error) {
      alert(language === 'ro' ? 'Eroare la salvarea regulii' : 'Error saving rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t.confirmDeleteRule)) return

    try {
      const { error } = await supabase
        .from('reward_rules')
        .delete()
        .eq('id', ruleId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      loadProducts()
      alert(t.ruleDeleted)

    } catch (error) {
      alert(language === 'ro' ? 'Eroare la ștergerea regulii' : 'Error deleting rule')
    }
  }

  const openAddRuleForm = () => {
    setEditingRule(null)
    setRuleFormData({
      name: '',
      priority: (rules.get(showRulesModal || '') || []).length + 1,
      buy_count: 3,
      reward_count: 1,
      reward_type: 'free_product',
      description: '',
      discount_percent: 10
    })
    setShowAddRuleForm(true)
  }

  const openEditRuleForm = (rule: ProductRule) => {
    setEditingRule(rule)
    setRuleFormData({
      name: rule.name,
      priority: rule.priority,
      buy_count: rule.buy_count,
      reward_count: rule.reward_count || 1,
      reward_type: rule.reward_type || 'free_product',
      description: rule.description || '',
      discount_percent: rule.discount_percent || 10
    })
    setShowAddRuleForm(true)
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
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
                setFormData({ name: '', emoji: '📦', category: '', price: '', scans_required: 3 })
                setShowAddModal(true)
              }}
              className="px-3 py-2 sm:px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-xs sm:text-sm font-semibold"
            >
              + {t.newProduct}
            </button>
          </div>
        </header>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {loading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-12 h-12 mx-auto border-3 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛍️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {t.noProducts}
              </h3>
              <p className="text-gray-400">
                {t.noProductsDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => {
                const productRules = rules.get(product.id) || []
                console.log(`Product ${product.name} (${product.id}):`, productRules.length, 'rules')
                return (
                  <div
                    key={product.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all"
                  >
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-3xl sm:text-4xl">{product.metadata?.emoji || '📦'}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product.metadata?.category && (
                              <span className="text-xs text-gray-400">{product.metadata.category}</span>
                            )}
                            {product.price && (
                              <>
                                {product.metadata?.category && <span className="text-xs text-gray-500">•</span>}
                                <span className="text-xs font-semibold text-green-400">{product.price.toFixed(2)} RON</span>
                              </>
                            )}
                          </div>
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
                              <span className="text-sm text-gray-300 font-medium">
                                {rule.name}
                              </span>
                              <span className="text-xs text-purple-400">
                                {rule.reward_type === 'free_product' ? '🎁' : '💰'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {language === 'ro' ? 'Cumpără' : 'Buy'} {rule.buy_count} → {language === 'ro' ? 'Primești' : 'Get'} {rule.reward_count || rule.discount_percent + '%'}
                            </p>
                            {rule.description && (
                              <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                            )}
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t.price}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t.pricePlaceholder}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t.priceDesc}
                </p>
              </div>

              {/* Scans Required - Only show when creating new product */}
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

              {/* Info when editing - rules are managed separately */}
              {editingProduct && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    ℹ️ {language === 'ro' 
                      ? 'Pentru a modifica regulile de loialitate, folosește butonul "⚙️ Reguli" de pe card-ul produsului.' 
                      : 'To modify loyalty rules, use the "⚙️ Rules" button on the product card.'}
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

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-3xl p-6 my-8">
            <h2 className="text-xl font-bold text-white mb-2">
              {t.manageRules}
            </h2>
            <p className="text-gray-400 text-sm mb-3">
              {t.rulesDesc}
            </p>
            
            {/* Info and Example */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-sm mb-1">💡 {t.rulesInfo}</p>
              <p className="text-blue-200 text-xs">{t.rulesExample}</p>
            </div>
            
            {/* Current Rules List */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {(rules.get(showRulesModal) || []).length > 0 ? (
                (rules.get(showRulesModal) || []).map((rule) => (
                  <div key={rule.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-400 font-bold text-sm">
                          {rule.name}
                        </span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          rule.active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {rule.active ? (language === 'ro' ? 'Activă' : 'Active') : (language === 'ro' ? 'Inactivă' : 'Inactive')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-300 text-xs">
                          {t.priority}: {rule.priority}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-300 text-xs">
                          {language === 'ro' ? 'Cumpără' : 'Buy'} {rule.buy_count} → {language === 'ro' ? 'Primești' : 'Get'} {rule.reward_count || rule.discount_percent + '%'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{rule.description}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                        rule.reward_type === 'free_product' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {rule.reward_type === 'free_product' ? t.freeProduct : t.percentageDiscount}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditRuleForm(rule)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">{t.noRules}</p>
              )}
            </div>

            {/* Add/Edit Rule Form */}
            {showAddRuleForm ? (
              <form onSubmit={handleSubmitRule} className="bg-white/5 rounded-lg p-4 mb-4 space-y-3">
                <h3 className="text-white font-semibold text-sm mb-2">
                  {editingRule ? t.editRule : t.newRule}
                </h3>
                
                {/* Rule Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    {language === 'ro' ? 'Nume Regulă' : 'Rule Name'}
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.name}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={language === 'ro' ? 'Ex: Cafea gratuită' : 'Ex: Free Coffee'}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {t.priority || (language === 'ro' ? 'Prioritate' : 'Priority')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleFormData.priority}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, priority: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{language === 'ro' ? 'Ordine aplicare' : 'Execution order'}</p>
                  </div>

                  {/* Buy Count */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {language === 'ro' ? 'Scanări Necesare' : 'Scans Required'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleFormData.buy_count}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, buy_count: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{language === 'ro' ? 'Câte scanări pentru premiu' : 'Scans for reward'}</p>
                  </div>
                </div>

                {/* Reward Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    {t.rewardType}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRuleFormData({ ...ruleFormData, reward_type: 'free_product' })}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        ruleFormData.reward_type === 'free_product'
                          ? 'bg-green-500/30 text-green-400 border-2 border-green-500'
                          : 'bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      🎁 {t.freeProduct}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRuleFormData({ ...ruleFormData, reward_type: 'percentage_discount' })}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        ruleFormData.reward_type === 'percentage_discount'
                          ? 'bg-orange-500/30 text-orange-400 border-2 border-orange-500'
                          : 'bg-white/10 text-gray-400 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      💰 {t.percentageDiscount}
                    </button>
                  </div>
                </div>

                {/* Reward Value */}
                {ruleFormData.reward_type === 'free_product' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {language === 'ro' ? 'Cantitate Gratuită' : 'Free Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleFormData.reward_count}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, reward_count: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{language === 'ro' ? 'Câte produse gratuite' : 'How many free products'}</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {t.discountValue || (language === 'ro' ? 'Valoare Discount (%)' : 'Discount Value (%)')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={ruleFormData.discount_percent}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, discount_percent: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{language === 'ro' ? 'Procent de discount (1-100)' : 'Discount percentage (1-100)'}</p>
                  </div>
                )}

                {/* Description (optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    {language === 'ro' ? 'Descriere (opțional)' : 'Description (optional)'}
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.description}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={language === 'ro' ? 'Detalii suplimentare...' : 'Additional details...'}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRuleForm(false)
                      setEditingRule(null)
                    }}
                    className="flex-1 px-3 py-1.5 bg-white/10 text-white rounded hover:bg-white/20 text-sm"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 text-sm font-semibold"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={openAddRuleForm}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-sm font-semibold mb-4"
              >
                + {t.addRule}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setShowRulesModal(null)
                setShowAddRuleForm(false)
                setEditingRule(null)
              }}
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
