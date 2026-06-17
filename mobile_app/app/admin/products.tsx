import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Switch, Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

const EMOJIS = ['☕', '🍕', '🍔', '🍰', '🥗', '🍜', '🛍️', '💄', '💪', '🎁', '🥤', '🍦', '🌮', '🥩', '🍺', '✂️']

interface Product {
  id: string
  name: string
  price: number | null
  active: boolean
  metadata: { emoji?: string; category?: string }
}

interface Rule {
  id: string
  name: string
  description: string | null
  buy_count: number
  reward_count: number
  discount_percent: number | null
  priority: number
  active: boolean
  product_id: string | null
}

const emptyProduct = { name: '', emoji: '🛍️', category: '', price: '', scansRequired: '5' }
const emptyRule = { name: '', description: '', buy_count: '5', reward_count: '1', discount_percent: '', priority: '1', reward_type: 'free_product' as 'free_product' | 'percentage_discount' }

export default function AdminProductsScreen() {
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [products, setProducts] = useState<Product[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  // Product modal
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ ...emptyProduct })
  const [savingProduct, setSavingProduct] = useState(false)

  // Rules modal
  const [rulesModal, setRulesModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [ruleForm, setRuleForm] = useState({ ...emptyRule })
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [savingRule, setSavingRule] = useState(false)
  const [ruleFormVisible, setRuleFormVisible] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [prodRes, rulesRes] = await Promise.all([
        supabase.from('products').select('*').eq('tenant_id', tenantId!).order('created_at', { ascending: false }),
        supabase.from('reward_rules').select('*').eq('tenant_id', tenantId!).order('priority'),
      ])
      setProducts(prodRes.data ?? [])
      setRules(rulesRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  // ── PRODUCT CRUD ───────────────────────────────────────────────
  function openAddProduct() {
    setEditingProduct(null)
    setProductForm({ ...emptyProduct })
    setProductModal(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductForm({
      name: p.name,
      emoji: p.metadata?.emoji ?? '🛍️',
      category: p.metadata?.category ?? '',
      price: p.price != null ? String(p.price) : '',
      scansRequired: '5',
    })
    setProductModal(true)
  }

  async function handleSaveProduct() {
    if (!productForm.name.trim()) { Alert.alert('Error', 'Enter product name'); return }
    setSavingProduct(true)
    try {
      const payload = {
        tenant_id: tenantId!,
        name: productForm.name.trim(),
        price: productForm.price ? parseFloat(productForm.price) : null,
        metadata: { emoji: productForm.emoji, category: productForm.category.trim() },
        active: true,
      }
      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id)
      } else {
        const { data: newProd } = await supabase.from('products').insert(payload).select().single()
        if (newProd) {
          // Create default rule
          await supabase.from('reward_rules').insert({
            tenant_id: tenantId!,
            product_id: newProd.id,
            name: `${productForm.name} gratuito`,
            buy_count: parseInt(productForm.scansRequired) || 5,
            reward_count: 1,
            discount_percent: null,
            active: true,
            priority: 1,
          })
        }
      }
      setProductModal(false)
      await loadData()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? a.errorSaveMsg)
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleDeleteProduct(p: Product) {
    Alert.alert(`${t.dashboard.deleteCard}`, `Delete "${p.name}"?`, [
      { text: t.dashboard.cancel, style: 'cancel' },
      {
        text: t.dashboard.delete, style: 'destructive',
        onPress: async () => {
          await supabase.from('reward_rules').delete().eq('product_id', p.id)
          await supabase.from('products').delete().eq('id', p.id)
          await loadData()
        },
      },
    ])
  }

  async function toggleProductActive(p: Product) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  // ── RULES CRUD ─────────────────────────────────────────────────
  function openRules(p: Product) {
    setSelectedProduct(p)
    setRuleFormVisible(false)
    setEditingRule(null)
    setRuleForm({ ...emptyRule })
    setRulesModal(true)
  }

  function openAddRule() {
    setEditingRule(null)
    setRuleForm({ ...emptyRule })
    setRuleFormVisible(true)
  }

  function openEditRule(r: Rule) {
    setEditingRule(r)
    setRuleForm({
      name: r.name,
      description: r.description ?? '',
      buy_count: String(r.buy_count),
      reward_count: String(r.reward_count),
      discount_percent: r.discount_percent != null ? String(r.discount_percent) : '',
      priority: String(r.priority),
      reward_type: r.discount_percent != null ? 'percentage_discount' : 'free_product',
    })
    setRuleFormVisible(true)
  }

  async function handleSaveRule() {
    if (!ruleForm.name.trim()) { Alert.alert('Error', 'Enter rule name'); return }
    setSavingRule(true)
    try {
      const payload = {
        tenant_id: tenantId!,
        product_id: selectedProduct?.id ?? null,
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || null,
        buy_count: parseInt(ruleForm.buy_count) || 5,
        reward_count: ruleForm.reward_type === 'free_product' ? parseInt(ruleForm.reward_count) || 1 : 0,
        discount_percent: ruleForm.reward_type === 'percentage_discount' ? parseInt(ruleForm.discount_percent) || null : null,
        priority: parseInt(ruleForm.priority) || 1,
        active: true,
      }
      if (editingRule) {
        await supabase.from('reward_rules').update(payload).eq('id', editingRule.id)
      } else {
        await supabase.from('reward_rules').insert(payload)
      }
      setRuleFormVisible(false)
      await loadData()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? a.errorSaveMsg)
    } finally {
      setSavingRule(false)
    }
  }

  async function handleDeleteRule(r: Rule) {
    Alert.alert(`Delete rule`, `Delete "${r.name}"?`, [
      { text: t.dashboard.cancel, style: 'cancel' },
      {
        text: t.dashboard.delete, style: 'destructive',
        onPress: async () => {
          await supabase.from('reward_rules').delete().eq('id', r.id)
          await loadData()
        },
      },
    ])
  }

  async function toggleRuleActive(r: Rule) {
    await supabase.from('reward_rules').update({ active: !r.active }).eq('id', r.id)
    setRules((prev) => prev.map((x) => x.id === r.id ? { ...x, active: !x.active } : x))
  }

  const productRules = (pid: string) => rules.filter((r) => r.product_id === pid)

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{a.products}</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAddProduct}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="cube-outline" size={48} color="#374151" />
              <Text style={s.emptyText}>{a.noProductsMsg}</Text>
            </View>
          }
          renderItem={({ item: p }) => (
            <View style={s.productCard}>
              <View style={s.productTop}>
                <View style={s.productLeft}>
                  <Text style={s.productEmoji}>{p.metadata?.emoji ?? '🛍️'}</Text>
                  <View>
                    <Text style={s.productName}>{p.name}</Text>
                    {p.metadata?.category && <Text style={s.productCat}>{p.metadata.category}</Text>}
                    {p.price != null && <Text style={s.productPrice}>{p.price.toFixed(2)} lei</Text>}
                  </View>
                </View>
                <Switch
                  value={p.active}
                  onValueChange={() => toggleProductActive(p)}
                  trackColor={{ false: '#374151', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Rules list */}
              {productRules(p.id).length > 0 && (
                <View style={s.rulesList}>
                  {productRules(p.id).map((r) => (
                    <View key={r.id} style={s.ruleChip}>
                      <Text style={s.ruleChipIcon}>{r.active ? '✅' : '⏸️'}</Text>
                      <Text style={s.ruleChipText} numberOfLines={1}>
                        {r.name} · {r.buy_count} → {r.reward_count > 0 ? `×${r.reward_count}` : `${r.discount_percent}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={s.productActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => openRules(p)}>
                  <Ionicons name="trophy-outline" size={15} color="#a78bfa" />
                  <Text style={s.actionText}>Regole</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEditProduct(p)}>
                  <Ionicons name="pencil-outline" size={15} color="#a78bfa" />
                  <Text style={s.actionText}>Modifica</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleDeleteProduct(p)}>
                  <Ionicons name="trash-outline" size={15} color="#f87171" />
                  <Text style={[s.actionText, { color: '#f87171' }]}>Elimina</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* ── PRODUCT MODAL ─────────────────────────────────────── */}
      <Modal visible={productModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setProductModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.modalTitle}>{editingProduct ? 'Edit product' : 'New product'}</Text>
            <TouchableOpacity onPress={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? <ActivityIndicator color="#7c3aed" /> : <Text style={s.modalSave}>{a.save}</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            <Text style={s.fieldLabel}>Nome *</Text>
            <TextInput
              style={s.input}
              placeholder="Nome prodotto"
              placeholderTextColor="#4b5563"
              value={productForm.name}
              onChangeText={(v) => setProductForm((f) => ({ ...f, name: v }))}
            />

            <Text style={s.fieldLabel}>Emoji</Text>
            <View style={s.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiBtn, productForm.emoji === e && s.emojiBtnActive]}
                  onPress={() => setProductForm((f) => ({ ...f, emoji: e }))}
                >
                  <Text style={s.emojiChar}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Categoria</Text>
            <TextInput
              style={s.input}
              placeholder="es. Bevande, Cibo, Servizi..."
              placeholderTextColor="#4b5563"
              value={productForm.category}
              onChangeText={(v) => setProductForm((f) => ({ ...f, category: v }))}
            />

            <Text style={s.fieldLabel}>Prezzo in lei (opzionale)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00 lei"
              placeholderTextColor="#4b5563"
              value={productForm.price}
              onChangeText={(v) => setProductForm((f) => ({ ...f, price: v }))}
              keyboardType="decimal-pad"
            />

            {!editingProduct && (
              <>
                <Text style={s.fieldLabel}>Scansioni per premio (regola default)</Text>
                <TextInput
                  style={s.input}
                  placeholder="5"
                  placeholderTextColor="#4b5563"
                  value={productForm.scansRequired}
                  onChangeText={(v) => setProductForm((f) => ({ ...f, scansRequired: v }))}
                  keyboardType="number-pad"
                />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── RULES MODAL ───────────────────────────────────────── */}
      <Modal visible={rulesModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setRulesModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Regole — {selectedProduct?.name}</Text>
            <TouchableOpacity onPress={openAddRule}>
              <Ionicons name="add-circle" size={26} color="#7c3aed" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            {/* Existing rules */}
            {productRules(selectedProduct?.id ?? '').map((r) => (
              <View key={r.id} style={s.ruleCard}>
                <View style={s.ruleCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ruleName}>{r.name}</Text>
                    <Text style={s.ruleSub}>
                      {r.buy_count} scansioni →{' '}
                      {r.reward_count > 0 ? `×${r.reward_count} gratis` : `${r.discount_percent}% sconto`}
                      {' '}· priorità {r.priority}
                    </Text>
                    {r.description && <Text style={s.ruleDesc}>{r.description}</Text>}
                  </View>
                  <Switch
                    value={r.active}
                    onValueChange={() => toggleRuleActive(r)}
                    trackColor={{ false: '#374151', true: '#7c3aed' }}
                    thumbColor="#fff"
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                </View>
                <View style={s.ruleActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => openEditRule(r)}>
                    <Ionicons name="pencil-outline" size={14} color="#a78bfa" />
                    <Text style={s.actionText}>Modifica</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleDeleteRule(r)}>
                    <Ionicons name="trash-outline" size={14} color="#f87171" />
                    <Text style={[s.actionText, { color: '#f87171' }]}>Elimina</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Rule form */}
            {ruleFormVisible && (
              <View style={s.ruleFormBox}>
                <Text style={s.ruleFormTitle}>{editingRule ? 'Modifica regola' : 'Nuova regola'}</Text>

                <Text style={s.fieldLabel}>Nome regola *</Text>
                <TextInput style={s.input} placeholder="es. Caffè gratuito" placeholderTextColor="#4b5563"
                  value={ruleForm.name} onChangeText={(v) => setRuleForm((f) => ({ ...f, name: v }))} />

                <Text style={s.fieldLabel}>Descrizione</Text>
                <TextInput style={s.input} placeholder="Descrizione opzionale" placeholderTextColor="#4b5563"
                  value={ruleForm.description} onChangeText={(v) => setRuleForm((f) => ({ ...f, description: v }))} />

                <Text style={s.fieldLabel}>Scansioni necessarie</Text>
                <TextInput style={s.input} placeholder="5" placeholderTextColor="#4b5563"
                  value={ruleForm.buy_count} onChangeText={(v) => setRuleForm((f) => ({ ...f, buy_count: v }))}
                  keyboardType="number-pad" />

                <Text style={s.fieldLabel}>Tipo di premio</Text>
                <View style={s.rewardTypeRow}>
                  {(['free_product', 'percentage_discount'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[s.rewardTypeBtn, ruleForm.reward_type === type && s.rewardTypeBtnActive]}
                      onPress={() => setRuleForm((f) => ({ ...f, reward_type: type }))}
                    >
                      <Text style={[s.rewardTypeText, ruleForm.reward_type === type && s.rewardTypeTextActive]}>
                        {type === 'free_product' ? '🎁 Prodotto gratis' : '% Sconto'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ruleForm.reward_type === 'free_product' ? (
                  <>
                    <Text style={s.fieldLabel}>Quantità gratuita</Text>
                    <TextInput style={s.input} placeholder="1" placeholderTextColor="#4b5563"
                      value={ruleForm.reward_count} onChangeText={(v) => setRuleForm((f) => ({ ...f, reward_count: v }))}
                      keyboardType="number-pad" />
                  </>
                ) : (
                  <>
                    <Text style={s.fieldLabel}>Percentuale sconto (1-100)</Text>
                    <TextInput style={s.input} placeholder="10" placeholderTextColor="#4b5563"
                      value={ruleForm.discount_percent} onChangeText={(v) => setRuleForm((f) => ({ ...f, discount_percent: v }))}
                      keyboardType="number-pad" />
                  </>
                )}

                <Text style={s.fieldLabel}>Priorità</Text>
                <TextInput style={s.input} placeholder="1" placeholderTextColor="#4b5563"
                  value={ruleForm.priority} onChangeText={(v) => setRuleForm((f) => ({ ...f, priority: v }))}
                  keyboardType="number-pad" />

                <View style={s.ruleFormActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setRuleFormVisible(false)}>
                    <Text style={s.cancelBtnText}>Annulla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.saveBtn, savingRule && s.btnDisabled]} onPress={handleSaveRule} disabled={savingRule}>
                    {savingRule ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Salva regola</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  backText: { color: '#fff', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },

  productCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 12 },
  productTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  productEmoji: { fontSize: 32 },
  productName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  productCat: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  productPrice: { color: '#a78bfa', fontSize: 13, marginTop: 2 },

  rulesList: { gap: 6 },
  ruleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ruleChipIcon: { fontSize: 12 },
  ruleChipText: { color: '#c4b5fd', fontSize: 12, flex: 1 },

  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  actionBtnDanger: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)' },
  actionText: { color: '#a78bfa', fontWeight: '600', fontSize: 12 },

  modal: { flex: 1, backgroundColor: '#0f0d2e' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalSave: { color: '#7c3aed', fontWeight: '700', fontSize: 16 },
  modalBody: { padding: 16, gap: 4, paddingBottom: 40 },

  fieldLabel: { color: '#7c6faa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emojiBtnActive: { borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.25)' },
  emojiChar: { fontSize: 22 },

  ruleCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, marginBottom: 10, gap: 10 },
  ruleCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ruleSub: { color: '#a78bfa', fontSize: 12, marginTop: 2 },
  ruleDesc: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  ruleActions: { flexDirection: 'row', gap: 8 },
  ruleFormBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)', padding: 14, marginTop: 8, gap: 4 },
  ruleFormTitle: { color: '#a78bfa', fontWeight: '700', fontSize: 14, marginBottom: 4 },

  rewardTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  rewardTypeBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  rewardTypeBtnActive: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
  rewardTypeText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  rewardTypeTextActive: { color: '#fff' },

  ruleFormActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 2, padding: 12, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
})
