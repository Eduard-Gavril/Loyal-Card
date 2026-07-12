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
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

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
  const colors = useTheme()
  const s = themedStyles(colors)
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
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{a.products}</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAddProduct}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="cube-outline" size={48} color={colors.inkFaint} />
              <Text style={s.emptyText}>{a.noProductsMsg}</Text>
            </View>
          }
          renderItem={({ item: p }) => (
            <View style={s.productCard}>
              <View style={s.productTop}>
                <View style={s.productLeft}>
                  <View style={s.productEmojiWrap}>
                    <Text style={s.productEmoji}>{p.metadata?.emoji ?? '🛍️'}</Text>
                  </View>
                  <View>
                    <Text style={s.productName}>{p.name}</Text>
                    {p.metadata?.category && <Text style={s.productCat}>{p.metadata.category}</Text>}
                    {p.price != null && <Text style={s.productPrice}>{p.price.toFixed(2)} lei</Text>}
                  </View>
                </View>
                <Switch
                  value={p.active}
                  onValueChange={() => toggleProductActive(p)}
                  trackColor={{ false: colors.borderStrong, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Rules list */}
              {productRules(p.id).length > 0 && (
                <View style={s.rulesList}>
                  {productRules(p.id).map((r) => (
                    <View key={r.id} style={s.ruleChip}>
                      <Ionicons
                        name={r.active ? 'checkmark-circle' : 'pause-circle-outline'}
                        size={13}
                        color={r.active ? colors.primary : colors.inkFaint}
                      />
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
                  <Ionicons name="trophy-outline" size={15} color={colors.primary} />
                  <Text style={s.actionText}>Regole</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEditProduct(p)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                  <Text style={s.actionText}>Modifica</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleDeleteProduct(p)}>
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  <Text style={[s.actionText, { color: colors.danger }]}>Elimina</Text>
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
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>{editingProduct ? 'Modifica prodotto' : 'Nuovo prodotto'}</Text>
            <TouchableOpacity onPress={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? <ActivityIndicator color={colors.primary} /> : <Text style={s.modalSave}>{a.save}</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            <Text style={s.fieldLabel}>Nome *</Text>
            <TextInput
              style={s.input}
              placeholder="Nome prodotto"
              placeholderTextColor={colors.inkFaint}
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
              placeholderTextColor={colors.inkFaint}
              value={productForm.category}
              onChangeText={(v) => setProductForm((f) => ({ ...f, category: v }))}
            />

            <Text style={s.fieldLabel}>Prezzo in lei (opzionale)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00 lei"
              placeholderTextColor={colors.inkFaint}
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
                  placeholderTextColor={colors.inkFaint}
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
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
            <Text style={s.modalTitle} numberOfLines={1}>Regole — {selectedProduct?.name}</Text>
            <TouchableOpacity onPress={openAddRule}>
              <Ionicons name="add-circle" size={26} color={colors.primary} />
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
                    trackColor={{ false: colors.borderStrong, true: colors.primary }}
                    thumbColor="#fff"
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                </View>
                <View style={s.ruleActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => openEditRule(r)}>
                    <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                    <Text style={s.actionText}>Modifica</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleDeleteRule(r)}>
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[s.actionText, { color: colors.danger }]}>Elimina</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Rule form */}
            {ruleFormVisible && (
              <View style={s.ruleFormBox}>
                <Text style={s.ruleFormTitle}>{editingRule ? 'Modifica regola' : 'Nuova regola'}</Text>

                <Text style={s.fieldLabel}>Nome regola *</Text>
                <TextInput style={s.input} placeholder="es. Caffè gratuito" placeholderTextColor={colors.inkFaint}
                  value={ruleForm.name} onChangeText={(v) => setRuleForm((f) => ({ ...f, name: v }))} />

                <Text style={s.fieldLabel}>Descrizione</Text>
                <TextInput style={s.input} placeholder="Descrizione opzionale" placeholderTextColor={colors.inkFaint}
                  value={ruleForm.description} onChangeText={(v) => setRuleForm((f) => ({ ...f, description: v }))} />

                <Text style={s.fieldLabel}>Scansioni necessarie</Text>
                <TextInput style={s.input} placeholder="5" placeholderTextColor={colors.inkFaint}
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
                    <TextInput style={s.input} placeholder="1" placeholderTextColor={colors.inkFaint}
                      value={ruleForm.reward_count} onChangeText={(v) => setRuleForm((f) => ({ ...f, reward_count: v }))}
                      keyboardType="number-pad" />
                  </>
                ) : (
                  <>
                    <Text style={s.fieldLabel}>Percentuale sconto (1-100)</Text>
                    <TextInput style={s.input} placeholder="10" placeholderTextColor={colors.inkFaint}
                      value={ruleForm.discount_percent} onChangeText={(v) => setRuleForm((f) => ({ ...f, discount_percent: v }))}
                      keyboardType="number-pad" />
                  </>
                )}

                <Text style={s.fieldLabel}>Priorità</Text>
                <TextInput style={s.input} placeholder="1" placeholderTextColor={colors.inkFaint}
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

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  addBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center' },

  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 12,
    ...shadows.card,
  },
  productTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  productEmojiWrap: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  productEmoji: { fontSize: 26 },
  productName: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  productCat: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  productPrice: { color: colors.primary, fontSize: 13, marginTop: 2, fontWeight: '600' },

  rulesList: { gap: 6 },
  ruleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primarySoft, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  ruleChipText: { color: colors.inkMid, fontSize: 12, flex: 1 },

  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  actionBtnDanger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 12 },

  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  modalTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  modalSave: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 40 },

  fieldLabel: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 12, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong,
    color: colors.ink, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
  },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  emojiBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft, borderWidth: 1.5 },
  emojiChar: { fontSize: 22 },

  ruleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 10, gap: 10,
    ...shadows.card,
  },
  ruleCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  ruleSub: { color: colors.primary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  ruleDesc: { color: colors.inkSoft, fontSize: 12, marginTop: 4 },
  ruleActions: { flexDirection: 'row', gap: 8 },
  ruleFormBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primaryBorder,
    padding: 14, marginTop: 8, gap: 4,
    ...shadows.card,
  },
  ruleFormTitle: { color: colors.primary, fontWeight: '700', fontSize: 14, marginBottom: 4 },

  rewardTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  rewardTypeBtn: {
    flex: 1, padding: 10, borderRadius: radius.sm,
    backgroundColor: colors.bgDeep,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  rewardTypeBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  rewardTypeText: { color: colors.inkSoft, fontWeight: '600', fontSize: 13 },
  rewardTypeTextActive: { color: colors.primary },

  ruleFormActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.bgDeep, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { color: colors.inkSoft, fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    ...shadows.primaryBtn,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
}))
