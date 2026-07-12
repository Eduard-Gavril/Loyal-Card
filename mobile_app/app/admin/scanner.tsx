import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, Camera } from 'expo-camera'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

interface Product {
  id: string
  name: string
  price: number | null
  metadata: { emoji?: string; category?: string }
}

interface CardInfo {
  id: string
  client_id: string
  loyalty_state: Record<string, { count: number; rewards: number }>
  clients: { name: string | null; phone: string | null } | null
}

interface RewardRule {
  id: string
  name: string
  buy_count: number
  reward_count: number
  active: boolean
}

interface CartItem { product: Product; qty: number }

type Mode = 'idle' | 'scanning' | 'cart' | 'redeem'

export default function AdminScannerScreen() {
  const colors = useTheme()
  const s = themedStyles(colors)
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [mode, setMode] = useState<Mode>('idle')
  const [products, setProducts] = useState<Product[]>([])
  const [rules, setRules] = useState<RewardRule[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  const [scannedQr, setScannedQr] = useState('')
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
  const [cardLoading, setCardLoading] = useState(false)

  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ rewarded: string[]; message: string } | null>(null)

  const [redeemLoading, setRedeemLoading] = useState(false)

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setProductsLoading(true)
    try {
      const [prodRes, rulesRes] = await Promise.all([
        supabase.from('products').select('id, name, price, metadata').eq('tenant_id', tenantId!).eq('active', true).order('name'),
        supabase.from('reward_rules').select('id, name, buy_count, reward_count, active').eq('tenant_id', tenantId!).eq('active', true).order('priority'),
      ])
      setProducts(prodRes.data ?? [])
      setRules(rulesRes.data ?? [])
    } finally {
      setProductsLoading(false)
    }
  }

  async function startScan() {
    const { status } = await Camera.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Camera', 'Enable camera permission in device settings.')
      return
    }
    setScannedQr('')
    setCardInfo(null)
    setCart([])
    setResult(null)
    setMode('scanning')
  }

  async function handleBarcode({ data }: { data: string }) {
    if (cardLoading || scannedQr === data) return
    setScannedQr(data)
    setMode('cart')
    setCardLoading(true)
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('id, client_id, loyalty_state, clients(name, phone)')
        .eq('qr_code', data)
        .eq('tenant_id', tenantId!)
        .single()
      if (error || !card) {
        Alert.alert(a.scanNotFound, a.scanNotFoundMsg)
        setMode('idle')
        return
      }
      setCardInfo(card as any)
    } catch {
      Alert.alert('Error', 'Failed to load card.')
      setMode('idle')
    } finally {
      setCardLoading(false)
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev
      .map((i) => i.product.id === productId ? { ...i, qty: i.qty - 1 } : i)
      .filter((i) => i.qty > 0)
    )
  }

  async function handleConfirmScan() {
    if (cart.length === 0) { Alert.alert(a.selectProductsLabel); return }
    setSubmitting(true)
    const rewarded: string[] = []
    try {
      for (const item of cart) {
        for (let i = 0; i < item.qty; i++) {
          const data = await api.registerScan(scannedQr, item.product.id)
          if (data?.reward_earned) {
            rewarded.push(`🎁 ${data.reward_earned.rule_name} (×${data.reward_earned.reward_count})`)
          }
        }
      }
      const { data: refreshed } = await supabase
        .from('cards')
        .select('id, client_id, loyalty_state, clients(name, phone)')
        .eq('qr_code', scannedQr)
        .single()
      if (refreshed) setCardInfo(refreshed as any)
      setResult({
        rewarded,
        message: rewarded.length > 0 ? a.rewardEarned : a.scanRegistered,
      })
      setCart([])
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Scan failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRedeem(ruleId: string, ruleName: string) {
    setRedeemLoading(true)
    try {
      const data = await api.redeemReward(scannedQr, ruleId)
      Alert.alert(
        `✅ ${ruleName}`,
        `${a.availableLabel}: ${data.remaining_rewards ?? 0}`
      )
      const { data: refreshed } = await supabase
        .from('cards')
        .select('id, client_id, loyalty_state, clients(name, phone)')
        .eq('qr_code', scannedQr)
        .single()
      if (refreshed) setCardInfo(refreshed as any)
      setMode('cart')
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Redeem failed')
    } finally {
      setRedeemLoading(false)
    }
  }

  // ── CAMERA VIEW ─────────────────────────────────────────────────
  if (mode === 'scanning') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.cameraTopBar}>
            <TouchableOpacity
              style={s.cameraClose}
              onPress={() => setMode('idle')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.cameraCenter}>
            <View style={s.scanFrame} />
            <Text style={s.scanHint}>{a.scanHint}</Text>
          </View>
          <View style={{ flex: 1 }} />
        </SafeAreaView>
      </View>
    )
  }

  // ── REDEEM VIEW ──────────────────────────────────────────────────
  if (mode === 'redeem') {
    const redeemableRules = rules.filter((r) => {
      const state = cardInfo?.loyalty_state?.[r.id]
      return (state?.rewards ?? 0) > 0
    })
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => setMode('cart')}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
            <Text style={s.backText}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{a.redeemRewardTitle}</Text>
          <View style={{ width: 80 }} />
        </View>
        <ScrollView contentContainerStyle={s.body}>
          {redeemableRules.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="gift-outline" size={48} color={colors.inkFaint} />
              <Text style={s.emptyText}>{a.noRewardsMsg}</Text>
            </View>
          ) : redeemableRules.map((r) => {
            const count = cardInfo?.loyalty_state?.[r.id]?.rewards ?? 0
            return (
              <View key={r.id} style={s.redeemRow}>
                <View style={s.redeemInfo}>
                  <Text style={s.redeemName}>{r.name}</Text>
                  <Text style={s.redeemCount}>×{count} {a.availableLabel}</Text>
                </View>
                <TouchableOpacity
                  style={[s.redeemBtn, redeemLoading && s.btnDisabled]}
                  onPress={() => handleRedeem(r.id, r.name)}
                  disabled={redeemLoading}
                >
                  <Ionicons name="gift" size={18} color="#fff" />
                  <Text style={s.redeemBtnText}>{a.redeemBtn}</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── CART / RESULT VIEW ───────────────────────────────────────────
  const totalRewards = rules.reduce((acc, r) => acc + (cardInfo?.loyalty_state?.[r.id]?.rewards ?? 0), 0)
  const totalStamps = rules.reduce((acc, r) => acc + (cardInfo?.loyalty_state?.[r.id]?.count ?? 0), 0)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{a.scanCard}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Result banner */}
        {result && (
          <View style={result.rewarded.length > 0 ? s.resultBannerReward : s.resultBannerOk}>
            <Text style={[s.resultMsg, result.rewarded.length > 0 && { color: colors.onNight }]}>
              {result.message}
            </Text>
            {result.rewarded.map((r) => <Text key={r} style={s.resultReward}>{r}</Text>)}
            <TouchableOpacity style={s.newScanBtn} onPress={startScan}>
              <Text style={s.newScanText}>{a.newScan}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer info */}
        {cardInfo ? (
          <View style={s.customerCard}>
            <View style={s.customerRow}>
              <View style={s.avatarWrap}>
                <Text style={s.avatarLetter}>{(cardInfo.clients?.name ?? '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.customerName}>{cardInfo.clients?.name ?? a.clientDefault}</Text>
                {cardInfo.clients?.phone && <Text style={s.customerPhone}>{cardInfo.clients.phone}</Text>}
              </View>
              <View style={s.customerStats}>
                <Text style={s.statNum}>{totalStamps}</Text>
                <Text style={s.statLbl}>{a.stamps.toLowerCase()}</Text>
              </View>
              {totalRewards > 0 && (
                <TouchableOpacity style={s.redeemPill} onPress={() => setMode('redeem')}>
                  <Ionicons name="gift" size={14} color="#fff" />
                  <Text style={s.redeemPillText}>×{totalRewards} {a.rewards.toLowerCase()}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.scanPrompt} onPress={startScan} disabled={cardLoading}>
            {cardLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={s.scanIconWrap}>
                  <Ionicons name="qr-code-outline" size={44} color={colors.primary} />
                </View>
                <Text style={s.scanPromptTitle}>{a.scanCardTitle}</Text>
                <Text style={s.scanPromptSub}>{a.scanCardSub}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Product list */}
        {cardInfo && !result && (
          <>
            <Text style={s.sectionLabel}>{a.selectProductsLabel}</Text>
            {productsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : products.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>{a.noProductsMsg}</Text>
              </View>
            ) : (
              <View style={s.productGrid}>
                {products.map((p) => {
                  const qty = cart.find((i) => i.product.id === p.id)?.qty ?? 0
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.productCard, qty > 0 && s.productCardActive]}
                      onPress={() => addToCart(p)}
                    >
                      <Text style={s.productEmoji}>{p.metadata?.emoji ?? '🛍️'}</Text>
                      <Text style={s.productName} numberOfLines={2}>{p.name}</Text>
                      {p.price != null && <Text style={s.productPrice}>{p.price.toFixed(2)} lei</Text>}
                      {qty > 0 && (
                        <View style={s.qtyBadge}>
                          <Text style={s.qtyText}>×{qty}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Cart summary */}
            {cart.length > 0 && (
              <View style={s.cartBox}>
                <Text style={s.cartTitle}>{a.cartLabel}</Text>
                {cart.map((item) => (
                  <View key={item.product.id} style={s.cartRow}>
                    <Text style={s.cartEmoji}>{item.product.metadata?.emoji ?? '🛍️'}</Text>
                    <Text style={s.cartName}>{item.product.name}</Text>
                    <TouchableOpacity style={s.cartMinus} onPress={() => removeFromCart(item.product.id)}>
                      <Ionicons name="remove" size={14} color={colors.danger} />
                    </TouchableOpacity>
                    <Text style={s.cartQty}>×{item.qty}</Text>
                    <TouchableOpacity style={s.cartPlus} onPress={() => addToCart(item.product)}>
                      <Ionicons name="add" size={14} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={[s.confirmBtn, submitting && s.btnDisabled]}
                  onPress={handleConfirmScan}
                  disabled={submitting}
                >
                  {submitting
                    ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.confirmBtnText}>{a.registering}</Text></>
                    : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={s.confirmBtnText}>{a.confirmScan}</Text></>}
                </TouchableOpacity>
              </View>
            )}

            {/* Scan again */}
            <TouchableOpacity style={s.reScanBtn} onPress={startScan}>
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={s.reScanText}>{a.scanAnotherCard}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  body: { padding: 20, gap: 16, paddingBottom: 40 },

  // Camera overlay
  cameraTopBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  cameraClose: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scanFrame: { width: 240, height: 240, borderWidth: 3, borderColor: colors.violet, borderRadius: radius.lg },
  scanHint: {
    color: '#fff', fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm,
  },

  resultBannerOk: {
    backgroundColor: colors.successSoft, borderRadius: radius.lg,
    padding: 16, borderWidth: 1, borderColor: colors.successBorder, gap: 6,
  },
  resultBannerReward: {
    backgroundColor: colors.night, borderRadius: radius.lg,
    padding: 16, gap: 6,
    ...shadows.night,
  },
  resultMsg: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  resultReward: { color: colors.violetLight, fontWeight: '700', fontSize: 14 },
  newScanBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.primary, borderRadius: radius.sm,
  },
  newScanText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14,
    ...shadows.card,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  customerName: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  customerPhone: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  customerStats: { alignItems: 'center' },
  statNum: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  statLbl: { color: colors.inkSoft, fontSize: 11 },
  redeemPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  redeemPillText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  scanPrompt: {
    alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2, borderColor: colors.primaryBorder, borderStyle: 'dashed',
    padding: 40,
  },
  scanIconWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  scanPromptTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  scanPromptSub: { color: colors.inkSoft, fontSize: 13 },

  sectionLabel: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: {
    width: '30%', flexGrow: 1, alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, gap: 4, position: 'relative',
    ...shadows.card,
  },
  productCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft, borderWidth: 1.5 },
  productEmoji: { fontSize: 28 },
  productName: { color: colors.ink, fontWeight: '600', fontSize: 12, textAlign: 'center' },
  productPrice: { color: colors.inkSoft, fontSize: 11 },
  qtyBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.primary, borderRadius: 8,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  qtyText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  cartBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primaryBorder,
    padding: 14, gap: 10,
  },
  cartTitle: { color: colors.primary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartEmoji: { fontSize: 18 },
  cartName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '500' },
  cartMinus: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cartPlus: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cartQty: { color: colors.ink, fontWeight: '700', fontSize: 15, width: 28, textAlign: 'center' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 13, marginTop: 4,
    ...shadows.primaryBtn,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  reScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  reScanText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { color: colors.inkSoft, fontSize: 13, textAlign: 'center' },
  redeemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, gap: 12,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  redeemInfo: { flex: 1 },
  redeemName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  redeemCount: { color: colors.primary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  redeemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
}))
