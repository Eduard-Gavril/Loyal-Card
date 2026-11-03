import { useEffect, useState } from 'react'
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api, supabase, ProductCategory } from '@/lib/supabase'
import { isPlanError, planErrorText } from '@/lib/plan'
import { colors, continuous } from '@/theme'
import { resolveCategoryIcon, CURATED_CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '@/lib/categoryIcons'
import ProductIcon from '@/components/ProductIcon'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Sheet from '@/ui/Sheet'
import Field from '@/ui/Field'
import Button from '@/ui/Button'
import Segmented from '@/ui/Segmented'
import PressableScale from '@/ui/PressableScale'
import Empty from '@/ui/Empty'
import Txt from '@/ui/Txt'

interface Product {
  id: string
  name: string
  price: number | null
  active: boolean
  category_id: string | null
  metadata: { emoji?: string }
  product_categories?: { id: string; name: string; icon: string | null } | null
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

const emptyProduct = { name: '', emoji: DEFAULT_CATEGORY_ICON, category_id: '', price: '', scansRequired: '5' }
const emptyRule = { name: '', description: '', buy_count: '5', reward_count: '1', discount_percent: '', priority: '1', reward_type: 'free_product' as 'free_product' | 'percentage_discount' }

/** One selectable chip (category / icon): 44pt target, tinted when selected. */
function Chip({ selected, onPress, icon, label }: { selected: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; label?: string }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      haptic="selection"
      onPress={onPress}
      style={[s.chip, selected && s.chipSelected, !label && s.chipIcon]}
    >
      {icon ? <Ionicons name={icon} size={18} color={selected ? colors.onPrimary : colors.labelSecondary} /> : null}
      {label ? (
        <Txt v="subhead" tone={selected ? 'onTint' : 'secondary'} style={{ fontWeight: selected ? '600' : '400' }}>
          {label}
        </Txt>
      ) : null}
    </PressableScale>
  )
}

export default function AdminProductsScreen() {
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [products, setProducts] = useState<Product[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesModal, setCategoriesModal] = useState(false)

  // Product modal
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ ...emptyProduct })
  const [savingProduct, setSavingProduct] = useState(false)

  // Category inline form (inside the product modal) — used for both creating
  // a new category and editing an existing one; editingCategoryId tells the
  // save handler which.
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState(DEFAULT_CATEGORY_ICON)
  const [savingCategory, setSavingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

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
      const [prodRes, rulesRes, cats] = await Promise.all([
        supabase.from('products').select('*, product_categories(id, name, icon)').eq('tenant_id', tenantId!).order('created_at', { ascending: false }),
        supabase.from('reward_rules').select('*').eq('tenant_id', tenantId!).order('priority'),
        api.getProductCategories(tenantId!),
      ])
      setProducts(prodRes.data ?? [])
      setRules(rulesRes.data ?? [])
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  function closeCategoryForm() {
    setNewCategoryOpen(false)
    setEditingCategoryId(null)
    setNewCategoryName('')
    setNewCategoryIcon(DEFAULT_CATEGORY_ICON)
  }

  function startAddCategory() {
    if (newCategoryOpen && !editingCategoryId) { closeCategoryForm(); return }
    setEditingCategoryId(null)
    setNewCategoryName('')
    setNewCategoryIcon(DEFAULT_CATEGORY_ICON)
    setNewCategoryOpen(true)
  }

  function startEditCategory(cat: ProductCategory) {
    setEditingCategoryId(cat.id)
    setNewCategoryName(cat.name)
    setNewCategoryIcon(cat.icon || DEFAULT_CATEGORY_ICON)
    setNewCategoryOpen(true)
  }

  async function handleSaveCategory() {
    if (!tenantId || !newCategoryName.trim()) return
    setSavingCategory(true)
    try {
      if (editingCategoryId) {
        await api.updateProductCategory(editingCategoryId, { name: newCategoryName.trim(), icon: newCategoryIcon })
        setCategories((prev) => prev
          .map((c) => c.id === editingCategoryId ? { ...c, name: newCategoryName.trim(), icon: newCategoryIcon } : c)
          .sort((a, b) => a.name.localeCompare(b.name)))
        await loadData()
      } else {
        const created = await api.createProductCategory(tenantId, newCategoryName.trim(), newCategoryIcon)
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        setProductForm((f) => ({ ...f, category_id: created.id }))
      }
      closeCategoryForm()
    } catch (e: any) {
      Alert.alert(a.errorTitle, e?.message ?? a.errorSavingCategory)
    } finally {
      setSavingCategory(false)
    }
  }

  function handleDeleteCategory(cat: ProductCategory) {
    Alert.alert(a.confirmDeleteCategory, cat.name, [
      { text: t.dashboard.cancel, style: 'cancel' },
      {
        text: t.dashboard.delete, style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProductCategory(cat.id)
            setCategories((prev) => prev.filter((c) => c.id !== cat.id))
            if (productForm.category_id === cat.id) {
              setProductForm((f) => ({ ...f, category_id: '' }))
            }
            if (editingCategoryId === cat.id) closeCategoryForm()
            await loadData()
          } catch (e: any) {
            Alert.alert(a.errorTitle, e?.message ?? a.errorDeletingCategory)
          }
        },
      },
    ])
  }

  function onCategoryLongPress(cat: ProductCategory) {
    Alert.alert(cat.name, undefined, [
      { text: t.dashboard.cancel, style: 'cancel' },
      { text: a.edit, onPress: () => startEditCategory(cat) },
      { text: t.dashboard.delete, style: 'destructive', onPress: () => handleDeleteCategory(cat) },
    ])
  }

  // ── PRODUCT CRUD ───────────────────────────────────────────────
  function openAddProduct() {
    setEditingProduct(null)
    setProductForm({ ...emptyProduct })
    closeCategoryForm()
    setProductModal(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductForm({
      name: p.name,
      emoji: p.metadata?.emoji ?? DEFAULT_CATEGORY_ICON,
      category_id: p.category_id ?? '',
      price: p.price != null ? String(p.price) : '',
      scansRequired: '5',
    })
    closeCategoryForm()
    setProductModal(true)
  }

  async function handleSaveProduct() {
    if (!productForm.name.trim()) { Alert.alert(a.errorTitle, a.enterProductNameMsg); return }
    setSavingProduct(true)
    try {
      const payload = {
        tenant_id: tenantId!,
        name: productForm.name.trim(),
        price: productForm.price ? parseFloat(productForm.price) : null,
        category_id: productForm.category_id || null,
        metadata: { emoji: productForm.emoji },
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
      Alert.alert(a.errorTitle, e?.message ?? a.errorSaveMsg)
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleDeleteProduct(p: Product) {
    Alert.alert(a.deleteProductTitle, a.confirmDeleteMsg(p.name), [
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
    if (!ruleForm.name.trim()) { Alert.alert(a.errorTitle, a.enterRuleNameMsg); return }
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
      // supabase-js returns the error instead of throwing it: without this check a refused save looked successful
      const { error } = editingRule
        ? await supabase.from('reward_rules').update(payload).eq('id', editingRule.id)
        : await supabase.from('reward_rules').insert(payload)
      if (error) throw error
      setRuleFormVisible(false)
      await loadData()
    } catch (e: any) {
      Alert.alert(a.errorTitle, isPlanError(e) ? planErrorText(e) : e?.message ?? a.errorSaveMsg)
    } finally {
      setSavingRule(false)
    }
  }

  async function handleDeleteRule(r: Rule) {
    Alert.alert(a.deleteRuleTitle, a.confirmDeleteMsg(r.name), [
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
    const { error } = await supabase.from('reward_rules').update({ active: !r.active }).eq('id', r.id)
    if (error) {
      Alert.alert(a.errorTitle, isPlanError(error) ? planErrorText(error) : error.message)
      return
    }
    setRules((prev) => prev.map((x) => x.id === r.id ? { ...x, active: !x.active } : x))
  }

  const productRules = (pid: string) => rules.filter((r) => r.product_id === pid)

  // ── RENDER ────────────────────────────────────────────────────
  const cancel = t.dashboard.cancel

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale accessibilityRole="button" accessibilityLabel={a.newProductTitle} onPress={openAddProduct} haptic="light" hitSlop={6} style={s.headerBtn}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </PressableScale>
          ),
        }}
      />

      <ScreenScroll title={a.products} bottomPad={40}>
        <ListGroup>
          <ListRow icon="pricetag-outline" title={a.manageCategoriesBtn} value={String(categories.length)} onPress={() => setCategoriesModal(true)} />
        </ListGroup>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : products.length === 0 ? (
          <Empty icon="cube-outline" title={a.noProductsMsg} actionLabel={a.newProductTitle} onAction={openAddProduct} />
        ) : (
          products.map((p) => {
            const pr = productRules(p.id)
            return (
              <ListGroup key={p.id}>
                <ListRow
                  leading={
                    <View style={s.productIcon}>
                      <ProductIcon emoji={p.metadata?.emoji} size={24} color={colors.label} />
                    </View>
                  }
                  title={p.name}
                  subtitle={[p.product_categories?.name, p.price != null ? `${p.price.toFixed(2)} lei` : null].filter(Boolean).join(' · ') || undefined}
                  switchValue={p.active}
                  onSwitchChange={() => toggleProductActive(p)}
                />
                <ListRow icon="trophy-outline" title={a.rulesBtn} value={String(pr.length)} onPress={() => openRules(p)} />
                <ListRow icon="pencil-outline" title={a.edit} onPress={() => openEditProduct(p)} />
              </ListGroup>
            )
          })
        )}
      </ScreenScroll>

      {/* ── PRODUCT SHEET ─────────────────────────────────────── */}
      <Sheet
        visible={productModal}
        title={editingProduct ? a.editProductTitle : a.newProductTitle}
        cancelLabel={cancel}
        onClose={() => setProductModal(false)}
        onDone={handleSaveProduct}
        doneLabel={a.save}
        doneDisabled={savingProduct}
      >
        <View style={{ gap: 18 }}>
          <Field label={a.productNameLabel} placeholder={a.productNamePlaceholder} value={productForm.name} onChangeText={(v) => setProductForm((f) => ({ ...f, name: v }))} />

          <View style={{ gap: 8 }}>
            <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
              {a.iconLabel}
            </Txt>
            <View style={s.chips}>
              {CURATED_CATEGORY_ICONS.map((iconName) => (
                <Chip key={iconName} selected={productForm.emoji === iconName} icon={resolveCategoryIcon(iconName)} onPress={() => setProductForm((f) => ({ ...f, emoji: iconName }))} />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
              {a.categoryLabel}
            </Txt>
            <View style={s.chips}>
              <Chip selected={!productForm.category_id} label={a.noCategoryLabel} onPress={() => setProductForm((f) => ({ ...f, category_id: '' }))} />
              {categories.map((cat) => (
                <Chip key={cat.id} selected={productForm.category_id === cat.id} icon={resolveCategoryIcon(cat.icon)} label={cat.name} onPress={() => setProductForm((f) => ({ ...f, category_id: cat.id }))} />
              ))}
            </View>
            {categories.length === 0 && (
              <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
                {a.noCategoriesYetHint}
              </Txt>
            )}
          </View>

          <Field label={a.priceLabel} placeholder="0.00 lei" value={productForm.price} onChangeText={(v) => setProductForm((f) => ({ ...f, price: v }))} keyboardType="decimal-pad" />

          {!editingProduct && (
            <Field label={a.scansForRewardLabel} placeholder="5" value={productForm.scansRequired} onChangeText={(v) => setProductForm((f) => ({ ...f, scansRequired: v }))} keyboardType="number-pad" />
          )}

          {editingProduct && (
            <Button
              variant="destructive"
              icon="trash-outline"
              title={t.dashboard.delete}
              onPress={() => {
                const p = editingProduct
                setProductModal(false)
                setTimeout(() => handleDeleteProduct(p), 350)
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </Sheet>

      {/* ── CATEGORIES SHEET ──────────────────────────────────── */}
      <Sheet
        visible={categoriesModal}
        title={a.manageCategoriesBtn}
        cancelLabel={cancel}
        onClose={() => {
          setCategoriesModal(false)
          closeCategoryForm()
        }}
      >
        <View style={{ gap: 16 }}>
          {categories.length === 0 ? (
            <Txt v="subhead" tone="secondary">
              {a.noCategoriesYetHint}
            </Txt>
          ) : (
            <ListGroup>
              {categories.map((cat) => (
                <ListRow
                  key={cat.id}
                  icon={resolveCategoryIcon(cat.icon)}
                  title={cat.name}
                  right={
                    <View style={s.rowActions}>
                      <PressableScale accessibilityRole="button" accessibilityLabel={a.edit} onPress={() => startEditCategory(cat)} hitSlop={4} style={s.iconBtn}>
                        <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                      </PressableScale>
                      <PressableScale accessibilityRole="button" accessibilityLabel={t.dashboard.delete} onPress={() => handleDeleteCategory(cat)} hitSlop={4} style={s.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </PressableScale>
                    </View>
                  }
                />
              ))}
            </ListGroup>
          )}

          <View style={s.formCard}>
            <Txt v="headline">{editingCategoryId ? a.editCategoryTitle : a.newCategoryNamePlaceholder}</Txt>
            <Field placeholder={a.newCategoryNamePlaceholder} value={newCategoryName} onChangeText={setNewCategoryName} accessibilityLabel={a.newCategoryNamePlaceholder} />
            <View style={s.chips}>
              {CURATED_CATEGORY_ICONS.map((iconName) => (
                <Chip key={iconName} selected={newCategoryIcon === iconName} icon={resolveCategoryIcon(iconName)} onPress={() => setNewCategoryIcon(iconName)} />
              ))}
            </View>
            <Button
              title={editingCategoryId ? a.save : a.createCategoryBtn}
              loading={savingCategory}
              disabled={!newCategoryName.trim()}
              onPress={handleSaveCategory}
            />
            {editingCategoryId ? <Button variant="plain" title={cancel} onPress={closeCategoryForm} /> : null}
          </View>
        </View>
      </Sheet>

      {/* ── RULES SHEET ───────────────────────────────────────── */}
      <Sheet
        visible={rulesModal}
        title={`${a.rulesBtn} — ${selectedProduct?.name ?? ''}`}
        cancelLabel={cancel}
        onClose={() => setRulesModal(false)}
        onDone={openAddRule}
        doneLabel="+"
      >
        <View style={{ gap: 16 }}>
          {productRules(selectedProduct?.id ?? '').length > 0 && (
            <ListGroup>
              {productRules(selectedProduct?.id ?? '').map((r) => (
                <ListRow
                  key={r.id}
                  title={r.name}
                  subtitle={`${a.ruleSummaryLine(r.buy_count, r.reward_count > 0 ? a.freeRewardLabel(r.reward_count) : a.discountRewardLabel(r.discount_percent ?? 0), r.priority)}${r.description ? '\n' + r.description : ''}`}
                  switchValue={r.active}
                  onSwitchChange={() => toggleRuleActive(r)}
                />
              ))}
            </ListGroup>
          )}

          {productRules(selectedProduct?.id ?? '').length > 0 && (
            <ListGroup>
              {productRules(selectedProduct?.id ?? '').map((r) => (
                <ListRow key={r.id} icon="pencil-outline" title={`${a.edit}: ${r.name}`} onPress={() => openEditRule(r)} />
              ))}
              {productRules(selectedProduct?.id ?? '').map((r) => (
                <ListRow key={'d' + r.id} icon="trash-outline" destructive title={`${t.dashboard.delete}: ${r.name}`} onPress={() => handleDeleteRule(r)} chevron={false} />
              ))}
            </ListGroup>
          )}

          {ruleFormVisible ? (
            <View style={s.formCard}>
              <Txt v="headline">{editingRule ? a.ruleFormEditTitle : a.ruleFormNewTitle}</Txt>
              <Field label={a.ruleNameLabel} placeholder={a.ruleNamePlaceholder} value={ruleForm.name} onChangeText={(v) => setRuleForm((f) => ({ ...f, name: v }))} />
              <Field label={a.descriptionLabel} placeholder={a.descriptionPlaceholder} value={ruleForm.description} onChangeText={(v) => setRuleForm((f) => ({ ...f, description: v }))} />
              <Field label={a.scansNeededLabel} placeholder="5" value={ruleForm.buy_count} onChangeText={(v) => setRuleForm((f) => ({ ...f, buy_count: v }))} keyboardType="number-pad" />
              <View style={{ gap: 6 }}>
                <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
                  {a.rewardTypeLabel}
                </Txt>
                <Segmented
                  options={[
                    { value: 'free_product', label: a.freeProductOption },
                    { value: 'percentage_discount', label: a.discountOption },
                  ]}
                  value={ruleForm.reward_type}
                  onChange={(v) => setRuleForm((f) => ({ ...f, reward_type: v as 'free_product' | 'percentage_discount' }))}
                />
              </View>
              {ruleForm.reward_type === 'free_product' ? (
                <Field label={a.freeQuantityLabel} placeholder="1" value={ruleForm.reward_count} onChangeText={(v) => setRuleForm((f) => ({ ...f, reward_count: v }))} keyboardType="number-pad" />
              ) : (
                <Field label={a.discountPercentLabel} placeholder="10" value={ruleForm.discount_percent} onChangeText={(v) => setRuleForm((f) => ({ ...f, discount_percent: v }))} keyboardType="number-pad" />
              )}
              <Field label={a.priorityLabel} placeholder="1" value={ruleForm.priority} onChangeText={(v) => setRuleForm((f) => ({ ...f, priority: v }))} keyboardType="number-pad" />
              <Button title={a.saveRuleBtn} loading={savingRule} onPress={handleSaveRule} />
              <Button variant="plain" title={cancel} onPress={() => setRuleFormVisible(false)} />
            </View>
          ) : (
            <Button variant="tinted" icon="add-circle-outline" title={a.ruleFormNewTitle} onPress={openAddRule} />
          )}
        </View>
      </Sheet>
    </>
  )
}

const s = StyleSheet.create({
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', paddingVertical: 48 },
  productIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', ...continuous },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.fill, ...continuous },
  chipIcon: { width: 44, paddingHorizontal: 0, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  formCard: { gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...continuous },
})
