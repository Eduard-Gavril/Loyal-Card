import { useEffect, useState } from 'react'
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, Camera } from 'expo-camera'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { isPlanError, planErrorText } from '@/lib/plan'
import { colors, continuous, layout } from '@/theme'
import { inlineTitle } from '@/ui/nav'
import ProductIcon from '@/components/ProductIcon'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Button from '@/ui/Button'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'
import AccountInfo from '@/components/AccountInfo'

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

/** - qty + : 44pt targets, selection haptic on each change. */
function Stepper({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={s.stepper}>
      <PressableScale accessibilityRole="button" accessibilityLabel="-" haptic="selection" onPress={onMinus} style={s.stepBtn}>
        <Ionicons name="remove" size={20} color={colors.danger} />
      </PressableScale>
      <Txt v="headline" style={{ minWidth: 30, textAlign: 'center' }}>
        {qty}
      </Txt>
      <PressableScale accessibilityRole="button" accessibilityLabel="+" haptic="selection" onPress={onPlus} style={s.stepBtn}>
        <Ionicons name="add" size={20} color={colors.success} />
      </PressableScale>
    </View>
  )
}

export default function AdminScannerScreen() {
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
  const [redeemQty, setRedeemQty] = useState<Record<string, number>>({})

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
            rewarded.push(`${data.reward_earned.rule_name} (×${data.reward_earned.reward_count})`)
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (e: any) {
      Alert.alert('Error', isPlanError(e) ? planErrorText(e) : e?.message ?? 'Scan failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRedeem(ruleId: string, ruleName: string, quantity: number) {
    setRedeemLoading(true)
    try {
      const data = await api.redeemReward(scannedQr, ruleId, quantity)
      const title = (data.redeemed_count ?? quantity) > 1 ? `${ruleName} (×${data.redeemed_count ?? quantity})` : ruleName
      Alert.alert(
        title,
        `${a.availableLabel}: ${data.remaining_rewards ?? 0}`
      )
      const { data: refreshed } = await supabase
        .from('cards')
        .select('id, client_id, loyalty_state, clients(name, phone)')
        .eq('qr_code', scannedQr)
        .single()
      if (refreshed) setCardInfo(refreshed as any)
      setRedeemQty((prev) => ({ ...prev, [ruleId]: 1 }))
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
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleBarcode} />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={s.cameraTopBar}>
              <PressableScale accessibilityRole="button" accessibilityLabel={t.dashboard.cancel} onPress={() => setMode('idle')} hitSlop={8} style={s.cameraClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </PressableScale>
            </View>
            <View style={s.cameraCenter}>
              <View style={s.scanFrame} />
              <View style={s.scanHintPill}>
                <Txt v="subhead" style={{ color: '#fff', fontWeight: '600' }}>
                  {a.scanHint}
                </Txt>
              </View>
            </View>
            <View style={{ flex: 1 }} />
          </SafeAreaView>
        </View>
      </>
    )
  }

  // ── REDEEM VIEW ──────────────────────────────────────────────────
  if (mode === 'redeem') {
    const redeemableRules = rules.filter((r) => (cardInfo?.loyalty_state?.[r.id]?.rewards ?? 0) > 0)
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: a.redeemRewardTitle,
            ...(inlineTitle as object),
            headerLeft: () => (
              <PressableScale accessibilityRole="button" accessibilityLabel={t.back} onPress={() => setMode('cart')} hitSlop={8} style={s.headerBtn}>
                <Ionicons name="chevron-back" size={26} color={colors.primary} />
              </PressableScale>
            ),
          }}
        />
        <ScreenScroll title={a.redeemRewardTitle} bottomPad={40}>
          {redeemableRules.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="gift-outline" size={44} color={colors.labelTertiary} />
              <Txt v="subhead" tone="secondary" style={{ textAlign: 'center' }}>
                {a.noRewardsMsg}
              </Txt>
            </View>
          ) : (
            redeemableRules.map((r) => {
              const count = cardInfo?.loyalty_state?.[r.id]?.rewards ?? 0
              const qty = Math.min(redeemQty[r.id] ?? 1, count)
              return (
                <View key={r.id} style={s.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Txt v="headline">{r.name}</Txt>
                      <Txt v="footnote" tone="secondary">
                        ×{count} {a.availableLabel}
                      </Txt>
                    </View>
                    {count > 1 && (
                      <Stepper
                        qty={qty}
                        onMinus={() => setRedeemQty((prev) => ({ ...prev, [r.id]: Math.max(1, qty - 1) }))}
                        onPlus={() => setRedeemQty((prev) => ({ ...prev, [r.id]: Math.min(count, qty + 1) }))}
                      />
                    )}
                  </View>
                  <Button icon="gift" title={a.redeemBtn} loading={redeemLoading} onPress={() => handleRedeem(r.id, r.name, qty)} />
                </View>
              )
            })
          )}
        </ScreenScroll>
      </>
    )
  }

  // ── CART / RESULT VIEW ───────────────────────────────────────────
  const totalRewards = rules.reduce((acc, r) => acc + (cardInfo?.loyalty_state?.[r.id]?.rewards ?? 0), 0)
  const totalStamps = rules.reduce((acc, r) => acc + (cardInfo?.loyalty_state?.[r.id]?.count ?? 0), 0)

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: a.scanCard, ...(inlineTitle as object) }} />
      <ScreenScroll title={a.scanCard} bottomPad={40}>
        {/* Who is signed in (a staff account sees only the scanner, so it is shown here too) */}
        {!cardInfo && !result && <AccountInfo />}

        {/* Result */}
        {result && (
          <View style={[s.card, result.rewarded.length > 0 ? s.resultReward : s.resultOk]}>
            <View style={s.resultHead}>
              <Ionicons name={result.rewarded.length > 0 ? 'gift' : 'checkmark-circle'} size={26} color={result.rewarded.length > 0 ? colors.primary : colors.success} />
              <Txt v="headline" style={{ flex: 1 }}>
                {result.message}
              </Txt>
            </View>
            {result.rewarded.map((r) => (
              <Txt key={r} v="subhead" tone="tint">
                {r}
              </Txt>
            ))}
            <Button title={a.newScan} onPress={startScan} />
          </View>
        )}

        {/* Customer */}
        {cardInfo ? (
          <ListGroup>
            <ListRow
              leading={
                <View style={s.avatar}>
                  <Txt v="headline" tone="tint">
                    {(cardInfo.clients?.name ?? '?').charAt(0).toUpperCase()}
                  </Txt>
                </View>
              }
              title={cardInfo.clients?.name ?? a.clientDefault}
              subtitle={cardInfo.clients?.phone ?? undefined}
              value={`${totalStamps} ${a.stamps.toLowerCase()}`}
            />
            {totalRewards > 0 && <ListRow icon="gift" title={`×${totalRewards} ${a.rewards.toLowerCase()}`} onPress={() => setMode('redeem')} />}
          </ListGroup>
        ) : (
          <View style={s.prompt}>
            {cardLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={s.promptIcon}>
                  <Ionicons name="qr-code-outline" size={40} color={colors.primary} />
                </View>
                <Txt v="title3" style={{ textAlign: 'center' }}>
                  {a.scanCardTitle}
                </Txt>
                <Txt v="subhead" tone="secondary" style={{ textAlign: 'center' }}>
                  {a.scanCardSub}
                </Txt>
                <Button icon="scan" title={a.scanCard} onPress={startScan} style={{ alignSelf: 'stretch', marginTop: 12 }} />
              </>
            )}
          </View>
        )}

        {/* Products + cart */}
        {cardInfo && !result && (
          <>
            <Txt v="footnote" tone="secondary" style={s.section}>
              {a.selectProductsLabel.toUpperCase()}
            </Txt>
            {productsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : products.length === 0 ? (
              <View style={s.emptyBox}>
                <Txt v="subhead" tone="secondary">
                  {a.noProductsMsg}
                </Txt>
              </View>
            ) : (
              <View style={s.grid}>
                {products.map((p) => {
                  const qty = cart.find((i) => i.product.id === p.id)?.qty ?? 0
                  return (
                    <PressableScale
                      key={p.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${p.name}${qty > 0 ? ` ×${qty}` : ''}`}
                      haptic="light"
                      onPress={() => addToCart(p)}
                      style={[s.product, qty > 0 && s.productActive]}
                    >
                      <ProductIcon emoji={p.metadata?.emoji} size={28} color={colors.label} />
                      <Txt v="subhead" style={{ textAlign: 'center', fontWeight: '600' }} numberOfLines={2}>
                        {p.name}
                      </Txt>
                      {p.price != null && (
                        <Txt v="footnote" tone="secondary">
                          {p.price.toFixed(2)} lei
                        </Txt>
                      )}
                      {qty > 0 && (
                        <View style={s.qtyBadge}>
                          <Txt v="caption1" tone="onTint" style={{ fontWeight: '700' }}>
                            ×{qty}
                          </Txt>
                        </View>
                      )}
                    </PressableScale>
                  )
                })}
              </View>
            )}

            {cart.length > 0 && (
              <>
                <ListGroup header={a.cartLabel}>
                  {cart.map((item) => (
                    <ListRow
                      key={item.product.id}
                      leading={<ProductIcon emoji={item.product.metadata?.emoji} size={22} color={colors.label} />}
                      title={item.product.name}
                      right={<Stepper qty={item.qty} onMinus={() => removeFromCart(item.product.id)} onPlus={() => addToCart(item.product)} />}
                    />
                  ))}
                </ListGroup>
                <Button icon="checkmark-circle" title={submitting ? a.registering : a.confirmScan} loading={submitting} onPress={handleConfirmScan} style={{ marginBottom: 12 }} />
              </>
            )}

            <Button variant="tinted" icon="refresh-outline" title={a.scanAnotherCard} onPress={startScan} />
          </>
        )}
      </ScreenScroll>
    </>
  )
}

const s = StyleSheet.create({
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cameraTopBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  cameraClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cameraCenter: { flex: 3, alignItems: 'center', justifyContent: 'center', gap: 22 },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: colors.primary, borderRadius: 28, ...continuous },
  scanHintPill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, ...continuous },

  card: { gap: 12, padding: 16, borderRadius: layout.cardRadius, backgroundColor: colors.grouped, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...continuous },
  resultOk: { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  resultReward: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  prompt: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 8 },
  promptIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6, ...continuous },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },

  section: { marginLeft: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  product: { width: '48.4%', minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 20, backgroundColor: colors.grouped, borderWidth: 1.5, borderColor: 'transparent', ...continuous },
  productActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  qtyBadge: { position: 'absolute', top: 8, right: 8, minWidth: 26, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
})
