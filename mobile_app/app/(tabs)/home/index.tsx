import { useState } from 'react'
import { View, StyleSheet, Linking, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, continuous } from '@/theme'
import TiltCard from '@/components/TiltCard'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Button from '@/ui/Button'
import Sheet from '@/ui/Sheet'
import Field from '@/ui/Field'
import StampCard from '@/ui/StampCard'
import Txt from '@/ui/Txt'
import { Ionicons } from '@expo/vector-icons'

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
    setTimeout(() => {
      setSent(false)
      setFormError('')
    }, 300)
  }

  return (
    <>
      <ScreenScroll
        title={t.tabs.home}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        bottomPad={40}
      >
        {hasCards && (
          <Txt v="subhead" tone="secondary" style={s.greeting}>
            {displayName ? `${getTimeGreeting(t)}, ${displayName}` : `${getTimeGreeting(t)}!`}
          </Txt>
        )}

        <View style={s.hero}>
          <Txt v="title1">{h.tagline1}</Txt>
          <Txt v="title1" tone="tint">
            {h.tagline2}
          </Txt>
          <Txt v="body" tone="secondary" style={{ marginTop: 8 }}>
            {h.subtitle}
          </Txt>
        </View>

        {/* Two example cards: in progress, and complete with a reward ready. They tilt with the phone, like the real card. */}
        <TiltCard style={s.cardWrap}>
          <StampCard title="LoyalCard" count={4} total={6} stampsLabel={t.dashboard.stamps} rewardLabel={t.dashboard.rewards} />
        </TiltCard>
        <TiltCard style={s.cardWrap}>
          <StampCard title="LoyalCard" count={6} total={6} stampsLabel={t.dashboard.stamps} readyLabel={t.card.rewardReady} />
        </TiltCard>

        {/* Pitch numbers: only for first-time visitors */}
        {!hasCards && (
          <View style={s.stats}>
            {[
              { val: h.stat1Val, label: h.stat1Label },
              { val: h.stat2Val, label: h.stat2Label },
              { val: h.stat3Val, label: h.stat3Label },
            ].map((stat) => (
              <View key={stat.label} style={s.stat}>
                <Txt v="title2" tone="tint">
                  {stat.val}
                </Txt>
                <Txt v="footnote" tone="secondary">
                  {stat.label}
                </Txt>
              </View>
            ))}
          </View>
        )}

        {/* One filled button on the screen */}
        <Button title={h.discoverBtn} icon="compass" onPress={() => router.navigate('/(tabs)/partners' as any)} style={{ marginBottom: 28 }} />

        <ListGroup>
          {hasCards && <ListRow icon="card-outline" title={t.tabs.myCards} value={h.cardCount(savedCards.length)} onPress={() => router.push('/(tabs)/dashboard')} />}
          <ListRow
            icon="storefront-outline"
            title={h.partnerBtn}
            onPress={() => {
              setContactOpen(true)
              setSent(false)
            }}
          />
          <ListRow icon="help-buoy-outline" title={t.profile.needHelp} onPress={() => Linking.openURL(HELP_URL)} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
          <ListRow icon="globe-outline" title={h.learnMore} onPress={() => Linking.openURL(WEBSITE_URL)} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
        </ListGroup>

        <Txt v="caption1" tone="tertiary" style={s.footer}>
          LoyalCard • loyalcard.net
        </Txt>
      </ScreenScroll>

      <Sheet
        visible={contactOpen}
        title={h.contactTitle}
        cancelLabel={t.dashboard.cancel}
        onClose={closeContact}
        onDone={sent ? undefined : handleSend}
        doneLabel={sent ? undefined : h.contactSend}
        doneDisabled={sending}
      >
        {sent ? (
          <View style={s.sent}>
            <View style={s.sentIcon}>
              <Ionicons name="checkmark" size={38} color={colors.success} />
            </View>
            <Txt v="title3" style={s.center}>
              {h.contactSentTitle}
            </Txt>
            <Txt v="subhead" tone="secondary" style={s.center}>
              {h.contactSentDesc}
            </Txt>
            <Button title={h.contactClose} onPress={closeContact} style={{ alignSelf: 'stretch', marginTop: 12 }} />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Txt v="subhead" tone="secondary">
              {h.contactSubtitle}
            </Txt>
            <Field label={`${h.contactName} *`} value={form.name} placeholder={h.contactNamePlaceholder} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Field
              label={`${h.contactEmail} *`}
              value={form.email}
              placeholder={h.contactEmailPlaceholder}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Field label={`${h.contactShop} *`} value={form.shop} placeholder={h.contactShopPlaceholder} onChangeText={(v) => setForm((f) => ({ ...f, shop: v }))} />
            <Field label={h.contactCity} value={form.city} placeholder={h.contactCityPlaceholder} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} />
            <Field label={h.contactMsg} value={form.message} placeholder={h.contactMsgPlaceholder} onChangeText={(v) => setForm((f) => ({ ...f, message: v }))} multiline />
            {formError ? (
              <Txt v="footnote" tone="danger">
                {formError}
              </Txt>
            ) : null}
            <Button title={h.contactSend} icon="send-outline" loading={sending} onPress={handleSend} />
            <Txt v="footnote" tone="secondary" style={s.center}>
              {h.contactEmailHint}
              {'\n'}
              {CONTACT_EMAIL}
            </Txt>
          </View>
        )}
      </Sheet>
    </>
  )
}

const s = StyleSheet.create({
  greeting: { marginBottom: 8 },
  hero: { gap: 2, paddingTop: 4, paddingBottom: 24 },
  cardWrap: { marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14, borderRadius: 18, backgroundColor: colors.grouped, ...continuous },
  footer: { textAlign: 'center', marginTop: -8 },
  sent: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  sentIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...continuous },
  center: { textAlign: 'center' },
})
