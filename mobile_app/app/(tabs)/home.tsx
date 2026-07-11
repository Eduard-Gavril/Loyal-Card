import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ScrollView, ActivityIndicator, Linking,
  KeyboardAvoidingView, Platform, RefreshControl, Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, radius, shadows } from '@/theme'

const CONTACT_EMAIL = 'eduardgavril.1999@gmail.com'
const WEBSITE_URL = 'https://loyalcard.net'
const HELP_URL = 'https://loyalcard.net/contact'

function getTimeGreeting(t: ReturnType<typeof getTranslation>): string {
  const hr = new Date().getHours()
  if (hr < 12) return t.home.greetingMorning
  if (hr < 18) return t.home.greetingAfternoon
  return t.home.greetingEvening
}

export default function HomeScreen() {
  const router = useRouter()
  const { language, savedCards, displayName } = useClientStore()
  const t = getTranslation(language)
  const h = t.home

  const [contactOpen, setContactOpen] = useState(false)
  const [form, setForm] = useState({ name: displayName ?? '', email: '', shop: '', city: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const hasCards = savedCards.length > 0

  function onRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  async function handleSend() {
    if (!form.name.trim() || !form.email.trim() || !form.shop.trim()) {
      setFormError(h.contactFormError)
      return
    }
    if (!form.email.includes('@')) {
      setFormError(h.contactEmailError)
      return
    }
    setSending(true)
    setFormError('')
    const subject = encodeURIComponent(`[LoyalCard] Richiesta partnership — ${form.shop}`)
    const body = encodeURIComponent(
      `Nome: ${form.name}\nEmail: ${form.email}\nNegozio: ${form.shop}\nCittà: ${form.city || '—'}\n\n${form.message || '(nessun messaggio aggiuntivo)'}`
    )
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`)
      setSent(true)
    } catch {
      setFormError('Impossibile aprire il client email. Scrivi a: ' + CONTACT_EMAIL)
    } finally {
      setSending(false)
    }
  }

  function closeContact() {
    setContactOpen(false)
    setTimeout(() => { setSent(false); setFormError('') }, 300)
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.brandRow}>
            <Image source={require('../../assets/logo.png')} style={s.brandLogo} resizeMode="contain" />
            <Text style={s.brandName}>LoyalCard</Text>
          </View>
          {hasCards && (
            <TouchableOpacity
              style={s.cardsPill}
              onPress={() => router.push('/(tabs)/dashboard')}
              activeOpacity={0.8}
            >
              <Ionicons name="card" size={13} color={colors.primary} />
              <Text style={s.cardsPillText}>{h.cardCount(savedCards.length)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Greeting */}
        {hasCards && (
          <Text style={s.greetingText}>
            {displayName ? `${getTimeGreeting(t)}, ${displayName}` : `${getTimeGreeting(t)}!`}
          </Text>
        )}

        {/* Hero copy */}
        <View style={s.hero}>
          <Text style={s.tagline1}>{h.tagline1}</Text>
          <Text style={s.tagline2}>{h.tagline2}</Text>
          <Text style={s.subtitle}>{h.subtitle}</Text>
        </View>

        {/* Night loyalty-card visual */}
        <View style={s.nightCard}>
          <View style={s.nightBlob1} pointerEvents="none" />
          <View style={s.nightBlob2} pointerEvents="none" />
          <View style={s.nightTop}>
            <Text style={s.nightBrand}>LOYALCARD</Text>
            <Ionicons name="qr-code" size={22} color={colors.violetLight} />
          </View>
          <View style={s.nightStamps}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={[s.stampDot, i < 5 && s.stampDotFilled]}>
                {i < 5 && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            ))}
          </View>
          <View style={s.nightBottom}>
            <View>
              <Text style={s.nightLabel}>{t.dashboard.stamps.toUpperCase()}</Text>
              <Text style={s.nightValue}>5 / 8</Text>
            </View>
            <View style={s.nightReward}>
              <Ionicons name="gift-outline" size={14} color={colors.violetLight} />
              <Text style={s.nightRewardText}>{t.dashboard.rewards}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { val: h.stat1Val, label: h.stat1Label },
            { val: h.stat2Val, label: h.stat2Label },
            { val: h.stat3Val, label: h.stat3Label },
          ].map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <Text style={s.statVal}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.navigate('/(tabs)/' as any)}
            activeOpacity={0.85}
          >
            <View style={s.primaryIconCircle}>
              <Ionicons name="compass" size={18} color="#fff" />
            </View>
            <Text style={s.primaryBtnText}>{h.discoverBtn}</Text>
            <View style={s.btnArrowCircle}>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => { setContactOpen(true); setSent(false) }}
            activeOpacity={0.85}
          >
            <View style={s.secondaryIconCircle}>
              <Ionicons name="storefront-outline" size={18} color={colors.primary} />
            </View>
            <Text style={s.secondaryBtnText}>{h.partnerBtn}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.learnMoreBtn}
            onPress={() => Linking.openURL(WEBSITE_URL)}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={15} color={colors.inkSoft} />
            <Text style={s.learnMoreText}>{h.learnMore}</Text>
            <Ionicons name="open-outline" size={13} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Need help */}
        <TouchableOpacity
          style={s.helpCard}
          onPress={() => Linking.openURL(HELP_URL)}
          activeOpacity={0.8}
        >
          <View style={s.helpIconWrap}>
            <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>{t.profile.needHelp}</Text>
            <Text style={s.helpSub}>{t.profile.needHelpSub}</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.inkFaint} />
        </TouchableOpacity>

        <Text style={s.footer}>LoyalCard • loyalcard.net</Text>
      </ScrollView>

      {/* Contact modal */}
      <Modal
        visible={contactOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeContact}
      >
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity style={s.modalClose} onPress={closeContact}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>{h.contactTitle}</Text>
              <Text style={s.modalSub}>{h.contactSubtitle}</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              {sent ? (
                <View style={s.sentBox}>
                  <View style={s.sentIconWrap}>
                    <Ionicons name="checkmark" size={40} color={colors.success} />
                  </View>
                  <Text style={s.sentTitle}>{h.contactSentTitle}</Text>
                  <Text style={s.sentDesc}>{h.contactSentDesc}</Text>
                  <TouchableOpacity style={[s.sendBtn, { alignSelf: 'stretch' }]} onPress={closeContact}>
                    <Text style={s.sendBtnText}>{h.contactClose}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Field label={`${h.contactName} *`} value={form.name} placeholder={h.contactNamePlaceholder}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Field label={`${h.contactEmail} *`} value={form.email} placeholder={h.contactEmailPlaceholder}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    keyboardType="email-address" autoCapitalize="none" />
                  <Field label={`${h.contactShop} *`} value={form.shop} placeholder={h.contactShopPlaceholder}
                    onChange={(v) => setForm((f) => ({ ...f, shop: v }))} />
                  <Field label={h.contactCity} value={form.city} placeholder={h.contactCityPlaceholder}
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                  <Field label={h.contactMsg} value={form.message}
                    placeholder={h.contactMsgPlaceholder}
                    onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                    multiline numberOfLines={4} />

                  {formError ? (
                    <View style={s.errorBox}>
                      <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                      <Text style={s.errorText}>{formError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[s.sendBtn, sending && s.btnDisabled]}
                    onPress={handleSend}
                    disabled={sending}
                    activeOpacity={0.85}
                  >
                    {sending
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="send-outline" size={16} color="#fff" />
                          <Text style={s.sendBtnText}>{h.contactSend}</Text>
                        </>}
                  </TouchableOpacity>

                  <Text style={s.emailHint}>
                    {h.contactEmailHint}{'\n'}
                    {CONTACT_EMAIL}
                  </Text>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function Field({
  label, value, onChange, placeholder = '', multiline = false,
  numberOfLines = 1, keyboardType = 'default' as any, autoCapitalize = 'sentences' as any,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; multiline?: boolean; numberOfLines?: number
  keyboardType?: any; autoCapitalize?: any
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && { minHeight: numberOfLines * 40, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 32, height: 32 },
  brandName: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  cardsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  cardsPillText: { color: colors.primary, fontSize: 12, fontWeight: '700' },

  greetingText: { color: colors.inkSoft, fontSize: 14, fontWeight: '500', marginTop: 12 },

  // Hero
  hero: { paddingTop: 20, paddingBottom: 24, gap: 2 },
  tagline1: { color: colors.ink, fontSize: 32, fontWeight: '900', lineHeight: 38, letterSpacing: -1 },
  tagline2: { color: colors.primary, fontSize: 32, fontWeight: '900', lineHeight: 38, letterSpacing: -1 },
  subtitle: { color: colors.inkSoft, fontSize: 15, lineHeight: 22, marginTop: 10, paddingRight: 24 },

  // Night card visual
  nightCard: {
    backgroundColor: colors.night,
    borderRadius: radius.xl,
    padding: 22,
    gap: 20,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadows.night,
  },
  nightBlob1: { position: 'absolute', top: -70, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(124,58,237,0.35)' },
  nightBlob2: { position: 'absolute', bottom: -90, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(124,58,237,0.16)' },
  nightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nightBrand: { color: colors.onNightSoft, fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  nightStamps: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stampDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.nightBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stampDotFilled: { backgroundColor: colors.violet, borderColor: colors.violet },
  nightBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  nightLabel: { color: colors.onNightSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  nightValue: { color: colors.onNight, fontSize: 22, fontWeight: '800', marginTop: 2 },
  nightReward: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)',
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
  },
  nightRewardText: { color: colors.violetLight, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: {
    flex: 1, alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 16, gap: 3,
    ...shadows.card,
  },
  statVal: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  statLabel: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },

  // CTAs
  ctas: { gap: 12, marginBottom: 20 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: 16, paddingVertical: 15,
    ...shadows.primaryBtn,
  },
  primaryIconCircle: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 16 },
  btnArrowCircle: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    ...shadows.card,
  },
  secondaryIconCircle: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 15 },
  learnMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12,
  },
  learnMoreText: { color: colors.inkSoft, fontWeight: '600', fontSize: 13 },

  // Help card
  helpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primaryBorder,
    padding: 16, marginBottom: 16,
  },
  helpIconWrap: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  helpTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  helpSub: { color: colors.inkSoft, fontSize: 12 },

  footer: { color: colors.inkFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  modalSub: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  modalBody: { padding: 20, paddingBottom: 40 },

  field: { marginBottom: 14 },
  fieldLabel: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  fieldInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong,
    color: colors.ink, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.dangerSoft, borderRadius: radius.sm,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 15, marginTop: 4,
    ...shadows.primaryBtn,
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  emailHint: { color: colors.inkFaint, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 14 },

  sentBox: { alignItems: 'center', gap: 14, paddingVertical: 36 },
  sentIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.successSoft,
    borderWidth: 1, borderColor: colors.successBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  sentTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  sentDesc: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
})
