import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Linking, RefreshControl, Alert } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useClientStore } from '@/store'
import { getTranslation, Language } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { colors, continuous } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Segmented from '@/ui/Segmented'
import Sheet from '@/ui/Sheet'
import Field from '@/ui/Field'
import Button from '@/ui/Button'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

type T = ReturnType<typeof getTranslation>

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ro', label: 'RO' },
  { value: 'it', label: 'IT' },
]

const PREFIXES = [
  { value: '+39', label: 'IT +39' },
  { value: '+40', label: 'RO +40' },
  { value: '+44', label: 'UK +44' },
  { value: '+', label: '+ …' },
]

function maskPhone(phone: string): string {
  if (phone.length <= 5) return phone
  const visible = phone.slice(0, 3)
  const tail = phone.slice(-2)
  const masked = '*'.repeat(Math.max(phone.length - 5, 3))
  return `${visible} ${masked}${tail}`
}

function ErrorLine({ message }: { message: string }) {
  if (!message) return null
  return (
    <View style={s.errorLine} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Txt v="footnote" tone="danger" style={{ flex: 1 }}>
        {message}
      </Txt>
    </View>
  )
}

// ─── Name ───────────────────────────────────────────────────────
function NameSheet({ t, visible, onClose }: { t: T; visible: boolean; onClose: () => void }) {
  const { clientId, displayName, setDisplayName } = useClientStore()
  const p = t.profile
  const [value, setValue] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) {
      setValue(displayName ?? '')
      setError('')
    }
  }, [visible])

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) { setError(p.namePlaceholder); return }
    if (!clientId) { setError(p.nameHint); return }
    setSaving(true)
    setError('')
    try {
      await api.updateClientName(clientId, trimmed)
      setDisplayName(trimmed)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      onClose()
    } catch (e: any) {
      setError(e?.message ?? 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet visible={visible} title={p.nameTitle} cancelLabel={t.dashboard.cancel} onClose={onClose} onDone={handleSave} doneLabel={p.nameConfirm} doneDisabled={saving}>
      <View style={{ gap: 12 }}>
        <Field
          value={value}
          onChangeText={(v) => { setValue(v); setError('') }}
          placeholder={p.namePlaceholder}
          autoCapitalize="words"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          error={error}
        />
        <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
          {p.nameHint}
        </Txt>
      </View>
    </Sheet>
  )
}

// ─── Link phone ─────────────────────────────────────────────────
function PhoneSheet({ t, visible, onClose }: { t: T; visible: boolean; onClose: () => void }) {
  const { clientId, setLinkedPhone } = useClientStore()
  const p = t.profile
  const [prefix, setPrefix] = useState('+39')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setPhone(''); setPin(''); setPinConfirm(''); setError(''); setBackupCodes([]); setCopied(null)
    }
  }, [visible])

  async function handleLink() {
    const digits = phone.replace(/\s/g, '')
    if (digits.length < 7) { setError(p.phoneInvalid); return }
    if (!/^\d{6}$/.test(pin)) { setError(p.pinInvalid); return }
    if (pin !== pinConfirm) { setError(p.pinMismatch); return }
    if (!clientId) { setError('Apri prima una carta fedeltà per creare il tuo account.'); return }

    const fullNumber = prefix === '+' ? digits : `${prefix}${digits}`
    setLoading(true)
    setError('')
    try {
      const result = await api.linkPhone(clientId, fullNumber, pin)
      setBackupCodes(result.backupCodes)
      setLinkedPhone(fullNumber)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const showingCodes = backupCodes.length > 0

  return (
    <Sheet
      visible={visible}
      title={p.phoneTitle}
      cancelLabel={t.dashboard.cancel}
      onClose={onClose}
      onDone={showingCodes ? onClose : handleLink}
      doneLabel={showingCodes ? p.phoneBackupDone : p.phoneSave}
      doneDisabled={loading}
    >
      {showingCodes ? (
        <View style={{ gap: 16 }}>
          <View style={s.successRow}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Txt v="headline" tone="success">
              {p.phoneDone}
            </Txt>
          </View>
          <View style={s.warnBox}>
            <Ionicons name="warning" size={18} color={colors.primary} />
            <Txt v="footnote" style={{ flex: 1 }}>
              {p.phoneBackupWarning}
            </Txt>
          </View>
          <ListGroup>
            {backupCodes.map((code, i) => (
              <ListRow
                key={code}
                title={code}
                value={String(i + 1)}
                onPress={() => {
                  Clipboard.setStringAsync(code)
                  Haptics.selectionAsync().catch(() => {})
                  setCopied(code)
                }}
                right={<Ionicons name={copied === code ? 'checkmark' : 'copy-outline'} size={16} color={copied === code ? colors.success : colors.labelTertiary} />}
                chevron={false}
              />
            ))}
          </ListGroup>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Txt v="subhead" tone="secondary">
            {p.phoneDesc}
          </Txt>
          <View style={{ gap: 6 }}>
            <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
              {p.prefixLabel}
            </Txt>
            <Segmented options={PREFIXES} value={prefix} onChange={setPrefix} />
          </View>
          <Field label={`${p.phoneLabel} (${prefix === '+' ? '+' : prefix})`} placeholder={p.phonePlaceholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          <Field label="PIN" placeholder={p.pinPlaceholder} value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} secureTextEntry />
          <Field label={p.pinConfirmLabel} placeholder={p.pinConfirmPlaceholder} value={pinConfirm} onChangeText={setPinConfirm} keyboardType="number-pad" maxLength={6} secureTextEntry />
          <ErrorLine message={error} />
          <Button title={p.phoneSave} icon="save-outline" loading={loading} onPress={handleLink} />
        </View>
      )}
    </Sheet>
  )
}

// ─── Recovery ───────────────────────────────────────────────────
function RecoverySheet({ t, visible, onClose }: { t: T; visible: boolean; onClose: () => void }) {
  const { clientId, replaceAllCards, setClientId, setLinkedPhone } = useClientStore()
  const p = t.profile
  const [prefix, setPrefix] = useState('+39')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'pin'>('phone')
  const [useBackup, setUseBackup] = useState(false)
  const [pin, setPin] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [restoredCount, setRestoredCount] = useState(0)

  const fullNumber = prefix === '+' ? phone.replace(/\s/g, '') : `${prefix}${phone.replace(/\s/g, '')}`

  useEffect(() => {
    if (visible) {
      setStep('phone'); setPhone(''); setPin(''); setBackupCode(''); setError(''); setDone(false); setUseBackup(false)
    }
  }, [visible])

  async function handleSearch() {
    if (phone.replace(/\s/g, '').length < 7) { setError(p.phoneInvalid); return }
    setLoading(true)
    setError('')
    try {
      await api.recoverRequest(fullNumber)
      setStep('pin')
    } catch (e: any) {
      setError(e?.message ?? p.recoveryNone)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    const credential = useBackup ? backupCode.trim() : pin.trim()
    if (!credential) { setError(useBackup ? 'Inserisci il codice di backup' : p.pinInvalid); return }
    setLoading(true)
    setError('')
    try {
      const result = await api.recoverVerify(fullNumber, useBackup ? '' : credential, clientId ?? undefined)
      const cards = await api.getCardsForClient(result.clientId)
      const mapped = cards.map((c: any) => ({
        clientId: result.clientId,
        cardId: c.id,
        qrCode: c.qr_code,
        tenantId: c.tenant_id,
        tenantName: c.tenants?.name,
      }))
      replaceAllCards(mapped)
      setClientId(result.clientId)
      setLinkedPhone(fullNumber)
      setRestoredCount(mapped.length)
      setDone(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (e: any) {
      setError(e?.message ?? p.recoveryPinWrong)
    } finally {
      setLoading(false)
    }
  }

  const primary = done ? onClose : step === 'phone' ? handleSearch : handleVerify
  const primaryLabel = done ? t.profile.phoneBackupDone : step === 'phone' ? p.recoverySearch : p.recoveryVerify

  return (
    <Sheet visible={visible} title={p.recoveryTitle} cancelLabel={t.dashboard.cancel} onClose={onClose} onDone={primary} doneLabel={primaryLabel} doneDisabled={loading}>
      {done ? (
        <View style={s.successRow}>
          <Ionicons name="checkmark-circle" size={26} color={colors.success} />
          <Txt v="headline" tone="success" style={{ flex: 1 }}>
            {p.recoveryDone(restoredCount)}
          </Txt>
        </View>
      ) : step === 'phone' ? (
        <View style={{ gap: 16 }}>
          <Txt v="subhead" tone="secondary">
            {p.recoveryDesc}
          </Txt>
          <Txt v="footnote" tone="tint" style={{ marginLeft: 4 }}>
            {p.recoveryStep1}
          </Txt>
          <View style={{ gap: 6 }}>
            <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
              {p.prefixLabel}
            </Txt>
            <Segmented options={PREFIXES} value={prefix} onChange={setPrefix} />
          </View>
          <Field label={p.phoneLabel} placeholder={p.phonePlaceholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <ErrorLine message={error} />
          <Button title={p.recoverySearch} icon="search-outline" loading={loading} onPress={handleSearch} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Txt v="footnote" tone="tint" style={{ marginLeft: 4 }}>
            {p.recoveryStep2}
          </Txt>
          <ListGroup>
            <ListRow icon="checkmark-circle-outline" iconColor={colors.success} title={fullNumber} value={p.change} onPress={() => setStep('phone')} chevron={false} />
          </ListGroup>
          {!useBackup ? (
            <Field label="PIN" placeholder="••••••" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={6} secureTextEntry autoFocus />
          ) : (
            <Field label={p.backupCodeLabel} placeholder={p.recoveryBackupPlaceholder} value={backupCode} onChangeText={setBackupCode} autoCapitalize="characters" autoFocus />
          )}
          <PressableScale
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => { setUseBackup(!useBackup); setPin(''); setBackupCode(''); setError('') }}
            style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
          >
            <Txt v="subhead" tone="tint">
              {useBackup ? p.recoveryUsePIN : p.recoveryBackupCode}
            </Txt>
          </PressableScale>
          <ErrorLine message={error} />
          <Button title={p.recoveryVerify} icon="download-outline" loading={loading} onPress={handleVerify} />
        </View>
      )}
    </Sheet>
  )
}

// ─── Delete account ─────────────────────────────────────────────
function DeleteSheet({ t, visible, onClose }: { t: T; visible: boolean; onClose: () => void }) {
  const { clientId, linkedPhone, clearAll } = useClientStore()
  const p = t.profile
  const [input, setInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (visible) setInput('')
  }, [visible])

  async function handleDelete() {
    setDeleting(true)
    try {
      if (clientId) await api.deleteAccount(clientId)
      clearAll()
      onClose()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete data')
    } finally {
      setDeleting(false)
    }
  }

  const ready = input === p.deleteConfirmWord

  return (
    <Sheet visible={visible} title={p.deleteAccountTitle} cancelLabel={t.dashboard.cancel} onClose={onClose}>
      <View style={{ gap: 16 }}>
        <View style={s.dangerIcon}>
          <Ionicons name="warning" size={30} color={colors.danger} />
        </View>
        <Txt v="subhead" tone="secondary" style={{ textAlign: 'center' }}>
          {linkedPhone ? p.deleteLinkedWarning : p.deleteUnlinkedWarning}
        </Txt>
        <Field
          label={p.deleteConfirmPrompt}
          value={input}
          onChangeText={(v) => setInput(v.toUpperCase())}
          placeholder={p.deleteConfirmWord}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button variant="destructive" icon="trash" title={p.deleteConfirmBtn} loading={deleting} disabled={!ready} onPress={handleDelete} />
      </View>
    </Sheet>
  )
}

// ─── Main screen ────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter()
  const { language, setLanguage, savedCards, displayName, clientId, linkedPhone, setDisplayName } = useClientStore()
  const t = getTranslation(language)
  const p = t.profile
  const [refreshing, setRefreshing] = useState(false)
  const [sheet, setSheet] = useState<null | 'name' | 'phone' | 'recovery' | 'delete'>(null)

  // Same behaviour as before: if the name is not stored locally, fetch it once for this client.
  useEffect(() => {
    if (!displayName && clientId) {
      supabase.from('clients').select('name').eq('id', clientId).single().then(({ data }) => {
        if (data?.name) setDisplayName(data.name)
      })
    }
  }, [clientId])

  function onRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 600)
  }

  const initial = (displayName ?? '').trim().charAt(0).toUpperCase()

  return (
    <>
      <ScreenScroll
        title={p.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        bottomPad={40}
      >
        {/* Identity */}
        <View style={s.identity}>
          <View style={s.avatar}>
            {initial ? <Txt v="title1" tone="onTint">{initial}</Txt> : <Ionicons name="person" size={34} color={colors.onPrimary} />}
          </View>
          <Txt v="title2" numberOfLines={1}>
            {displayName ? displayName : p.title}
          </Txt>
          <Txt v="subhead" tone="secondary">
            {savedCards.length} {p.savedCards}
          </Txt>
        </View>

        <ListGroup header={p.nameTitle} footer={p.nameHint}>
          <ListRow icon="person-outline" title={p.nameTitle} value={displayName ?? p.namePlaceholder} onPress={() => setSheet('name')} />
        </ListGroup>

        <ListGroup header={p.phoneTitle}>
          {linkedPhone ? (
            <ListRow icon="shield-checkmark-outline" iconColor={colors.success} title={p.linkedStatus} subtitle={p.linkedDesc} value={maskPhone(linkedPhone)} />
          ) : (
            <ListRow icon="phone-portrait-outline" title={p.phoneTitle} subtitle={p.phoneDesc} onPress={() => setSheet('phone')} />
          )}
          <ListRow icon="refresh-circle-outline" title={p.recoveryTitle} subtitle={p.recoveryDesc} onPress={() => setSheet('recovery')} />
        </ListGroup>

        <ListGroup>
          <ListRow icon="shield-half-outline" title={p.adminAccess} subtitle={p.adminSubtitle} onPress={() => router.push('/admin/login')} />
        </ListGroup>

        <ListGroup header={p.settingsTitle}>
          <ListRow
            icon="language-outline"
            title={p.language}
            right={
              <View style={{ width: 150 }}>
                <Segmented options={LANGUAGES} value={language} onChange={(v) => setLanguage(v)} />
              </View>
            }
          />
          <ListRow icon="help-buoy-outline" title={p.needHelp} onPress={() => Linking.openURL('https://loyalcard.net/contact')} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
          <ListRow icon="document-text-outline" title={p.privacyPolicy} onPress={() => Linking.openURL('https://loyalcard.net/privacy')} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
          <ListRow icon="shield-outline" title={p.cookiePolicy} onPress={() => Linking.openURL('https://loyalcard.net/cookie-policy')} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
          <ListRow icon="reader-outline" title={p.termsOfService} onPress={() => Linking.openURL('https://loyalcard.net/terms')} right={<Ionicons name="open-outline" size={16} color={colors.labelTertiary} />} chevron={false} />
        </ListGroup>

        <ListGroup>
          <ListRow icon="trash-outline" destructive title={p.deleteAccountTitle} onPress={() => setSheet('delete')} chevron={false} />
        </ListGroup>

        <Txt v="caption1" tone="tertiary" style={{ textAlign: 'center' }}>
          {p.appVersion}
        </Txt>
      </ScreenScroll>

      <NameSheet t={t} visible={sheet === 'name'} onClose={() => setSheet(null)} />
      <PhoneSheet t={t} visible={sheet === 'phone'} onClose={() => setSheet(null)} />
      <RecoverySheet t={t} visible={sheet === 'recovery'} onClose={() => setSheet(null)} />
      <DeleteSheet t={t} visible={sheet === 'delete'} onClose={() => setSheet(null)} />
    </>
  )
}

const s = StyleSheet.create({
  identity: { alignItems: 'center', gap: 4, paddingVertical: 16, marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  errorLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  warnBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 14, backgroundColor: colors.primarySoft, ...continuous },
  dangerIcon: { alignSelf: 'center', width: 68, height: 68, borderRadius: 22, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', ...continuous },
})
