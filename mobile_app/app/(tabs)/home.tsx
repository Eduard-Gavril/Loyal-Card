import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ScrollView, ActivityIndicator, Linking,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

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
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
      >
        {/* Decorative blobs */}
        <View style={s.blob1} pointerEvents="none" />
        <View style={s.blob2} pointerEvents="none" />

        {/* Greeting — returning users */}
        {hasCards && (
          <View style={s.greetingRow}>
            <Text style={s.greetingText}>
              {displayName
                ? `${getTimeGreeting(t)}, ${displayName}!`
                : `${getTimeGreeting(t)}! 👋`}
            </Text>
            <View style={s.greetingPill}>
              <Ionicons name="card-outline" size={12} color="#a78bfa" />
              <Text style={s.greetingPillText}>{h.cardCount(savedCards.length)}</Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoWrap}>
            <View style={s.logoRing}>
              <Ionicons name="shield-checkmark" size={38} color="#a78bfa" />
            </View>
          </View>
          <Text style={s.appName}>LoyalCard</Text>
          <Text style={s.tagline1}>{h.tagline1}</Text>
          <Text style={s.tagline2}>{h.tagline2}</Text>
          <Text style={s.subtitle}>{h.subtitle}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { val: h.stat1Val, label: h.stat1Label, color: '#a78bfa' },
            { val: h.stat2Val, label: h.stat2Label, color: '#60a5fa' },
            { val: h.stat3Val, label: h.stat3Label, color: '#10b981' },
          ].map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── CTAs ─────────────────────────────────────────────────── */}
        <View style={s.ctas}>

          {/* My Cards shortcut — only when user has cards */}
          {hasCards && (
            <TouchableOpacity
              style={s.myCardsBtn}
              onPress={() => router.push('/(tabs)/dashboard')}
              activeOpacity={0.8}
            >
              <View style={[s.btnIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="wallet-outline" size={18} color="#fff" />
              </View>
              <Text style={s.myCardsBtnText}>{t.tabs.myCards} ({savedCards.length})</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}

          {/* Primary — Discover Partners */}
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.navigate('/(tabs)/' as any)}
            activeOpacity={0.85}
          >
            <View style={[s.btnIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="compass" size={18} color="#fff" />
            </View>
            <Text style={s.primaryBtnText}>{h.discoverBtn}</Text>
            <View style={s.btnArrowCircle}>
              <Ionicons name="arrow-forward" size={14} color="#7c3aed" />
            </View>
          </TouchableOpacity>

          {/* Secondary — Become a Partner */}
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => { setContactOpen(true); setSent(false) }}
            activeOpacity={0.85}
          >
            <View style={[s.btnIconCircle, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
              <Ionicons name="storefront-outline" size={18} color="#10b981" />
            </View>
            <Text style={s.secondaryBtnText}>{h.partnerBtn}</Text>
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </TouchableOpacity>

          {/* Learn more → website */}
          <TouchableOpacity
            style={s.learnMoreBtn}
            onPress={() => Linking.openURL(WEBSITE_URL)}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={16} color="#7c3aed" />
            <Text style={s.learnMoreText}>{h.learnMore}</Text>
            <Ionicons name="open-outline" size={14} color="#7c3aed" />
          </TouchableOpacity>
        </View>

        {/* Need Help card */}
        <TouchableOpacity
          style={s.helpCard}
          onPress={() => Linking.openURL(HELP_URL)}
          activeOpacity={0.8}
        >
          <View style={s.helpIconWrap}>
            <Ionicons name="help-buoy-outline" size={22} color="#60a5fa" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>{t.profile.needHelp}</Text>
            <Text style={s.helpSub}>{t.profile.needHelpSub}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={s.footer}>LoyalCard • loyalcard.net</Text>
      </ScrollView>

      {/* ── Contact modal ─────────────────────────────────────────── */}
      <Modal
        visible={contactOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeContact}
      >
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity style={s.modalClose} onPress={closeContact}>
              <Ionicons name="close" size={22} color="#fff" />
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
                  <Ionicons name="checkmark-circle" size={52} color="#10b981" />
                  <Text style={s.sentTitle}>{h.contactSentTitle}</Text>
                  <Text style={s.sentDesc}>{h.contactSentDesc}</Text>
                  <TouchableOpacity style={s.primaryBtn} onPress={closeContact}>
                    <Text style={s.primaryBtnText}>{h.contactClose}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Field label={`${h.contactName} *`} value={form.name} placeholder="Mario Rossi"
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Field label={`${h.contactEmail} *`} value={form.email} placeholder="mario@negozio.it"
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    keyboardType="email-address" autoCapitalize="none" />
                  <Field label={`${h.contactShop} *`} value={form.shop} placeholder="Bar dello Sport"
                    onChange={(v) => setForm((f) => ({ ...f, shop: v }))} />
                  <Field label={h.contactCity} value={form.city} placeholder="Milano"
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                  <Field label={h.contactMsg} value={form.message}
                    placeholder="Dimmi di più sul tuo negozio..."
                    onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                    multiline numberOfLines={4} />

                  {formError ? (
                    <View style={s.errorBox}>
                      <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
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
        style={[s.fieldInput, multiline && { minHeight: numberOfLines * 44, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  scroll: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 8, minHeight: '100%' },

  blob1: { position: 'absolute', top: -60, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(124,58,237,0.18)' },
  blob2: { position: 'absolute', top: 200, left: -100, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(79,70,229,0.12)' },

  // Greeting
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  greetingText: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  greetingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  greetingPillText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },

  // Hero
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 32, gap: 10 },
  logoWrap: { marginBottom: 8 },
  logoRing: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)', alignItems: 'center', justifyContent: 'center' },
  appName: { color: 'rgba(167,139,250,0.6)', fontSize: 13, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
  tagline1: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, letterSpacing: -0.5 },
  tagline2: { color: '#7c3aed', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 4, paddingHorizontal: 8 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 16, gap: 4 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600' },

  // CTAs
  ctas: { gap: 12, marginBottom: 20 },

  // My Cards shortcut
  myCardsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  myCardsBtnText: { flex: 1, color: '#c4b5fd', fontWeight: '700', fontSize: 15 },

  // Primary button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#7c3aed', borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 16 },

  // Become Partner button
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  secondaryBtnText: { flex: 1, color: '#10b981', fontWeight: '700', fontSize: 15 },

  // Icon elements inside buttons
  btnIconCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  btnArrowCircle: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Learn more link
  learnMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  learnMoreText: { color: '#7c3aed', fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'center' },

  // Need Help card
  helpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    padding: 16, marginBottom: 12,
  },
  helpIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  helpTitle: { color: '#93c5fd', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  helpSub: { color: '#3b82f6', fontSize: 12, opacity: 0.8 },

  footer: { color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 12 },

  // Modal
  modal: { flex: 1, backgroundColor: '#0f0d2e' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  modalSub: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 40 },

  // Form
  field: { marginBottom: 14 },
  fieldLabel: { color: '#7c6faa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  fieldInput: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  errorText: { color: '#f87171', fontSize: 13, flex: 1 },

  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 16, marginTop: 4 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  emailHint: { color: '#374151', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 12 },

  sentBox: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  sentTitle: { color: '#10b981', fontSize: 22, fontWeight: '800' },
  sentDesc: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
})
