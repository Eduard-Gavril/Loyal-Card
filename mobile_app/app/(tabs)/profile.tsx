import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Linking, RefreshControl,
  Modal, Alert, Switch,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation, Language } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
]

const PREFIXES = [
  { country: 'IT', prefix: '+39', flag: '🇮🇹' },
  { country: 'RO', prefix: '+40', flag: '🇷🇴' },
  { country: 'UK', prefix: '+44', flag: '🇬🇧' },
  { country: '...', prefix: '+', flag: '🌍' },
]

function maskPhone(phone: string): string {
  if (phone.length <= 5) return phone
  const visible = phone.slice(0, 3)
  const tail = phone.slice(-2)
  const masked = '*'.repeat(Math.max(phone.length - 5, 3))
  return `${visible} ${masked}${tail}`
}

// ─── Name section ───────────────────────────────────────────────
function NameSection({ t }: { t: ReturnType<typeof getTranslation> }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const { clientId, displayName, setDisplayName } = useClientStore()
  const p = t.profile
  const inputRef = useRef<TextInput>(null)

  const [editing, setEditing] = useState(!displayName)
  const [value, setValue] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!displayName && clientId) {
      supabase.from('clients').select('name').eq('id', clientId).single().then(({ data }) => {
        if (data?.name) {
          setDisplayName(data.name)
          setValue(data.name)
          setEditing(false)
        }
      })
    }
  }, [clientId])

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) { setError(p.namePlaceholder); return }
    if (!clientId) { setError(p.nameHint); return }
    setSaving(true)
    setError('')
    try {
      await api.updateClientName(clientId, trimmed)
      setDisplayName(trimmed)
      setEditing(false)
    } catch (e: any) {
      setError(e?.message ?? 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    setValue(displayName ?? '')
    setError('')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.iconWrap}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleBig}>{p.nameTitle}</Text>
          <Text style={s.sectionDesc}>{p.nameHint}</Text>
        </View>
        {!editing && displayName && (
          <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={s.editBtnText}>{p.nameEdit}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!editing && displayName ? (
        <View style={s.nameDisplay}>
          <Text style={s.nameDisplayText}>{displayName}</Text>
        </View>
      ) : (
        <>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder={p.namePlaceholder}
            placeholderTextColor={colors.inkFaint}
            value={value}
            onChangeText={(v) => { setValue(v); setError('') }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          {error ? (
            <View style={[s.errorBox, { marginBottom: 10 }]}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={s.nameActions}>
            {editing && displayName && (
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setEditing(false); setValue(displayName); setError('') }}
              >
                <Text style={s.cancelBtnText}>{t.dashboard.cancel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.primaryBtn, saving && s.btnDisabled, { flex: 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.primaryBtnText}>{p.nameSaving}</Text></>
                : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={s.primaryBtnText}>{p.nameConfirm}</Text></>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

// ─── Link phone section ─────────────────────────────────────────
function LinkPhoneSection({ t }: { t: ReturnType<typeof getTranslation> }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const { clientId, linkedPhone, setLinkedPhone } = useClientStore()
  const p = t.profile

  const [prefix, setPrefix] = useState('+39')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showingCodes, setShowingCodes] = useState(false)

  // Already linked
  if (linkedPhone && !showingCodes) {
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.iconWrap, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={s.sectionTitleBig}>{p.linkedStatus}</Text>
              <View style={s.linkedBadge}>
                <Ionicons name="lock-closed" size={10} color={colors.success} />
                <Text style={s.linkedBadgeText}>{p.linkedBadge}</Text>
              </View>
            </View>
            <Text style={s.linkedPhone}>{maskPhone(linkedPhone)}</Text>
            <Text style={s.sectionDesc}>{p.linkedDesc}</Text>
          </View>
        </View>
      </View>
    )
  }

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
      setShowingCodes(true)
      setLinkedPhone(fullNumber)
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  if (showingCodes && backupCodes.length > 0) {
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.iconWrap, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitleBig}>{p.phoneTitle}</Text>
            <Text style={[s.sectionDesc, { color: colors.success }]}>{p.phoneDone}</Text>
          </View>
        </View>
        <View style={s.backupWarn}>
          <Ionicons name="warning-outline" size={16} color={colors.primary} />
          <Text style={s.backupWarnText}>{p.phoneBackupWarning}</Text>
        </View>
        <View style={s.backupGrid}>
          {backupCodes.map((code, i) => (
            <TouchableOpacity
              key={code}
              style={s.backupCode}
              onPress={() => Clipboard.setStringAsync(code)}
            >
              <Text style={s.backupCodeNum}>{i + 1}</Text>
              <Text style={s.backupCodeText}>{code}</Text>
              <Ionicons name="copy-outline" size={13} color={colors.inkFaint} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => { setShowingCodes(false); setBackupCodes([]); setPhone(''); setPin(''); setPinConfirm('') }}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={s.primaryBtnText}>{p.phoneBackupDone}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.iconWrap}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleBig}>{p.phoneTitle}</Text>
          <Text style={s.sectionDesc}>{p.phoneDesc}</Text>
        </View>
      </View>

      <Text style={s.inputLabel}>{p.prefixLabel}</Text>
      <View style={s.prefixRow}>
        {PREFIXES.map((pr) => (
          <TouchableOpacity
            key={pr.prefix}
            style={[s.prefixBtn, prefix === pr.prefix && s.prefixBtnActive]}
            onPress={() => setPrefix(pr.prefix)}
          >
            <Text style={s.prefixFlag}>{pr.flag}</Text>
            <Text style={[s.prefixCode, prefix === pr.prefix && s.prefixCodeActive]}>
              {pr.prefix !== '+' ? pr.prefix : pr.country}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.inputLabel}>{p.phoneLabel}</Text>
      <View style={s.phoneRow}>
        <View style={s.prefixDisplay}>
          <Text style={s.prefixDisplayText}>{prefix}</Text>
        </View>
        <TextInput
          style={s.phoneInput}
          placeholder={p.phonePlaceholder}
          placeholderTextColor={colors.inkFaint}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </View>

      <Text style={s.inputLabel}>PIN</Text>
      <TextInput
        style={s.input}
        placeholder={p.pinPlaceholder}
        placeholderTextColor={colors.inkFaint}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
      />

      <Text style={s.inputLabel}>{p.pinConfirmLabel}</Text>
      <TextInput
        style={[s.input, { marginBottom: 14 }]}
        placeholder={p.pinConfirmPlaceholder}
        placeholderTextColor={colors.inkFaint}
        value={pinConfirm}
        onChangeText={setPinConfirm}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
      />

      {error ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[s.primaryBtn, loading && s.btnDisabled]}
        onPress={handleLink}
        disabled={loading}
      >
        {loading
          ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.primaryBtnText}>{p.phoneSaving}</Text></>
          : <><Ionicons name="save-outline" size={16} color="#fff" /><Text style={s.primaryBtnText}>{p.phoneSave}</Text></>}
      </TouchableOpacity>
    </View>
  )
}

// ─── Recovery section ───────────────────────────────────────────
function RecoverySection({ t }: { t: ReturnType<typeof getTranslation> }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const { clientId, replaceAllCards, setClientId, setLinkedPhone } = useClientStore()
  const p = t.profile

  const [show, setShow] = useState(false)
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
    } catch (e: any) {
      setError(e?.message ?? p.recoveryPinWrong)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('phone')
    setPhone('')
    setPin('')
    setBackupCode('')
    setError('')
    setDone(false)
    setUseBackup(false)
  }

  return (
    <View style={s.section}>
      <TouchableOpacity
        style={s.toggleRow}
        onPress={() => { setShow(!show); if (!show) reset() }}
      >
        <View style={s.iconWrap}>
          <Ionicons name="refresh-circle-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleBig}>{p.recoveryTitle}</Text>
          <Text style={s.sectionDesc} numberOfLines={2}>{p.recoveryDesc}</Text>
        </View>
        <Ionicons name={show ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkFaint} />
      </TouchableOpacity>

      {show && (
        <View style={s.recoveryBody}>
          {done ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={s.successText}>{p.recoveryDone(restoredCount)}</Text>
              </View>
            </View>
          ) : step === 'phone' ? (
            <>
              <Text style={s.stepBadge}>{p.recoveryStep1}</Text>

              <Text style={s.inputLabel}>{p.prefixLabel}</Text>
              <View style={s.prefixRow}>
                {PREFIXES.map((pr) => (
                  <TouchableOpacity
                    key={pr.prefix}
                    style={[s.prefixBtn, prefix === pr.prefix && s.prefixBtnActive]}
                    onPress={() => setPrefix(pr.prefix)}
                  >
                    <Text style={s.prefixFlag}>{pr.flag}</Text>
                    <Text style={[s.prefixCode, prefix === pr.prefix && s.prefixCodeActive]}>
                      {pr.prefix !== '+' ? pr.prefix : pr.country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>{p.phoneLabel}</Text>
              <View style={[s.phoneRow, { marginBottom: 14 }]}>
                <View style={s.prefixDisplay}>
                  <Text style={s.prefixDisplayText}>{prefix}</Text>
                </View>
                <TextInput
                  style={s.phoneInput}
                  placeholder={p.phonePlaceholder}
                  placeholderTextColor={colors.inkFaint}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.primaryBtn, loading && s.btnDisabled]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading
                  ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.primaryBtnText}>{p.recoverySearching}</Text></>
                  : <><Ionicons name="search-outline" size={16} color="#fff" /><Text style={s.primaryBtnText}>{p.recoverySearch}</Text></>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.stepBadge}>{p.recoveryStep2}</Text>
              <TouchableOpacity style={s.phoneFoundRow} onPress={() => setStep('phone')}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={s.phoneFoundText}>{fullNumber}</Text>
                <Text style={s.changeLink}>{p.change}</Text>
              </TouchableOpacity>

              {!useBackup ? (
                <>
                  <Text style={s.inputLabel}>PIN</Text>
                  <TextInput
                    style={[s.input, { marginBottom: 8 }]}
                    placeholder="••••••"
                    placeholderTextColor={colors.inkFaint}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    autoFocus
                  />
                  <TouchableOpacity style={s.altLink} onPress={() => { setUseBackup(true); setPin(''); setError('') }}>
                    <Text style={s.altLinkText}>{p.recoveryBackupCode}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.inputLabel}>{p.backupCodeLabel}</Text>
                  <TextInput
                    style={[s.input, { marginBottom: 8 }]}
                    placeholder={p.recoveryBackupPlaceholder}
                    placeholderTextColor={colors.inkFaint}
                    value={backupCode}
                    onChangeText={setBackupCode}
                    autoCapitalize="characters"
                    autoFocus
                  />
                  <TouchableOpacity style={s.altLink} onPress={() => { setUseBackup(false); setBackupCode(''); setError('') }}>
                    <Text style={s.altLinkText}>{p.recoveryUsePIN}</Text>
                  </TouchableOpacity>
                </>
              )}

              {error ? (
                <View style={[s.errorBox, { marginTop: 8 }]}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.primaryBtn, { marginTop: 14 }, loading && s.btnDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading
                  ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.primaryBtnText}>{p.recoveryVerifying}</Text></>
                  : <><Ionicons name="download-outline" size={16} color="#fff" /><Text style={s.primaryBtnText}>{p.recoveryVerify}</Text></>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Main screen ────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter()
  const { language, setLanguage, savedCards, displayName, clientId, linkedPhone, clearAll, darkMode, setDarkMode } = useClientStore()
  const t = getTranslation(language)
  const p = t.profile
  const colors = useTheme()
  const s = themedStyles(colors)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      if (clientId) {
        await api.deleteAccount(clientId)
      }
      clearAll()
      setDeleteModal(false)
      setDeleteInput('')
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete data')
    } finally {
      setDeleting(false)
    }
  }

  function onRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{displayName ? displayName : p.title}</Text>
            <Text style={s.headerSub}>{savedCards.length} {p.savedCards}</Text>
          </View>
          <View style={s.langFlags}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[s.flagBtn, language === l.code && s.flagBtnActive]}
                onPress={() => setLanguage(l.code)}
              >
                <Text style={s.flagText}>{l.flag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dark mode */}
        <View style={s.darkModeRow}>
          <View style={s.iconWrap}>
            <Ionicons name={darkMode ? 'moon' : 'moon-outline'} size={20} color={colors.primary} />
          </View>
          <Text style={s.darkModeLabel}>{p.darkMode}</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <LinkPhoneSection t={t} />
        <RecoverySection t={t} />

        {/* Admin access */}
        <TouchableOpacity style={s.adminBtn} onPress={() => router.push('/admin/login')}>
          <View style={s.adminIconWrap}>
            <Ionicons name="shield-half-outline" size={20} color={colors.onNight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.adminBtnTitle}>{p.adminAccess}</Text>
            <Text style={s.adminBtnSub}>{p.adminSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.onNightSoft} />
        </TouchableOpacity>

        {/* Need help */}
        <TouchableOpacity
          style={s.helpCard}
          onPress={() => Linking.openURL('https://loyalcard.net/contact')}
          activeOpacity={0.8}
        >
          <View style={s.iconWrap}>
            <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>{p.needHelp}</Text>
            <Text style={s.helpSub}>{p.needHelpSub}</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.inkFaint} />
        </TouchableOpacity>

        {/* Legal */}
        <View style={s.legalSection}>
          <Text style={s.legalTitle}>{p.legalTitle}</Text>
          <TouchableOpacity
            style={s.legalRow}
            onPress={() => Linking.openURL('https://loyalcard.net/privacy')}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.inkSoft} />
            <Text style={s.legalText}>{p.privacyPolicy}</Text>
            <Ionicons name="open-outline" size={13} color={colors.inkFaint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.legalRow}
            onPress={() => Linking.openURL('https://loyalcard.net/cookie-policy')}
          >
            <Ionicons name="shield-outline" size={16} color={colors.inkSoft} />
            <Text style={s.legalText}>{p.cookiePolicy}</Text>
            <Ionicons name="open-outline" size={13} color={colors.inkFaint} />
          </TouchableOpacity>
        </View>

        <NameSection t={t} />

        {/* Delete account */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => { setDeleteInput(''); setDeleteModal(true) }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.deleteBtnTitle}>{p.deleteAccountTitle}</Text>
            <Text style={s.deleteBtnSub}>{p.deleteAccountSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.danger} />
        </TouchableOpacity>

        <Text style={s.version}>{p.appVersion}</Text>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={deleteModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDeleteModal(false)}>
        <View style={s.modalWrap}>
          <View style={s.modalHandle} />

          <View style={s.modalIconWrap}>
            <Ionicons name="warning" size={34} color={colors.danger} />
          </View>
          <Text style={s.modalTitle}>{p.deleteAccountTitle}</Text>

          <View style={s.modalWarnBox}>
            <Text style={s.modalWarnText}>
              {linkedPhone ? p.deleteLinkedWarning : p.deleteUnlinkedWarning}
            </Text>
          </View>

          <Text style={s.modalPrompt}>{p.deleteConfirmPrompt}</Text>
          <TextInput
            style={[s.modalInput, deleteInput === p.deleteConfirmWord && s.modalInputValid]}
            value={deleteInput}
            onChangeText={(v) => setDeleteInput(v.toUpperCase())}
            placeholder={p.deleteConfirmWord}
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[s.modalDeleteBtn, (deleteInput !== p.deleteConfirmWord || deleting) && s.modalDeleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleteInput !== p.deleteConfirmWord || deleting}
          >
            {deleting
              ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.modalDeleteBtnText}>{p.deleteConfirmBtn}</Text></>
              : <><Ionicons name="trash" size={16} color="#fff" /><Text style={s.modalDeleteBtnText}>{p.deleteConfirmBtn}</Text></>}
          </TouchableOpacity>

          <TouchableOpacity style={s.modalCancelBtn} onPress={() => setDeleteModal(false)}>
            <Text style={s.modalCancelText}>{t.dashboard.cancel}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  darkModeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 14,
    ...shadows.card,
  },
  darkModeLabel: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 14.5 },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 },
  headerTitle: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: colors.inkSoft, fontSize: 14, marginTop: 4 },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
    ...shadows.card,
  },
  sectionHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  sectionTitleBig: { color: colors.ink, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sectionDesc: { color: colors.inkSoft, fontSize: 12, lineHeight: 17 },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  recoveryBody: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  stepBadge: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  phoneFoundRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.successSoft, borderRadius: radius.sm,
    padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: colors.successBorder,
  },
  phoneFoundText: { color: colors.ink, fontWeight: '600', flex: 1 },
  changeLink: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  altLink: { marginBottom: 4 },
  altLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  langFlags: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingTop: 6 },
  flagBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  flagBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  flagText: { fontSize: 18 },

  inputLabel: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  prefixRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  prefixBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: radius.sm, backgroundColor: colors.bgDeep,
    borderWidth: 1, borderColor: colors.border, gap: 2,
  },
  prefixBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  prefixFlag: { fontSize: 18 },
  prefixCode: { color: colors.inkSoft, fontSize: 11, fontWeight: '700' },
  prefixCodeActive: { color: colors.primary },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefixDisplay: {
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primaryBorder,
    paddingHorizontal: 12, justifyContent: 'center',
  },
  prefixDisplayText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  phoneInput: {
    flex: 1, backgroundColor: colors.bgDeep,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    color: colors.ink, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
  },
  input: {
    backgroundColor: colors.bgDeep,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    color: colors.ink, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 12,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.dangerSoft, borderRadius: radius.sm,
    padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.successSoft, borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: colors.successBorder,
  },
  successText: { color: colors.success, fontWeight: '700', fontSize: 14 },

  backupWarn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  backupWarnText: { color: colors.inkMid, fontSize: 12, flex: 1, lineHeight: 18 },
  backupGrid: { gap: 8, marginBottom: 16 },
  backupCode: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.night, borderRadius: radius.sm,
    padding: 12, borderWidth: 1, borderColor: colors.nightBorder,
  },
  backupCodeNum: { color: colors.onNightSoft, fontSize: 12, fontWeight: '700', width: 16 },
  backupCodeText: { flex: 1, color: colors.onNight, fontFamily: 'monospace', fontSize: 16, fontWeight: '700', letterSpacing: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13,
    ...shadows.primaryBtn,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  linkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.successSoft, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.successBorder,
  },
  linkedBadgeText: { color: colors.success, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  linkedPhone: { color: colors.ink, fontSize: 16, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 },
  nameDisplay: {
    backgroundColor: colors.bgDeep, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  nameDisplayText: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  nameActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  editBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.md,
    backgroundColor: colors.bgDeep,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: colors.inkSoft, fontWeight: '600', fontSize: 14 },

  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.night,
    borderRadius: radius.lg, padding: 16, marginBottom: 14,
    ...shadows.night,
  },
  adminIconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: 'rgba(124,58,237,0.35)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  adminBtnTitle: { color: colors.onNight, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  adminBtnSub: { color: colors.onNightSoft, fontSize: 11 },

  helpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 12,
    ...shadows.card,
  },
  helpTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  helpSub: { color: colors.inkSoft, fontSize: 11 },
  version: { color: colors.inkFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },

  legalSection: { marginBottom: 12, paddingHorizontal: 4 },
  legalTitle: { color: colors.inkFaint, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  legalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  legalText: { flex: 1, color: colors.inkMid, fontSize: 13 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  deleteBtnTitle: { color: colors.danger, fontSize: 14, fontWeight: '700', marginBottom: 1 },
  deleteBtnSub: { color: colors.danger, fontSize: 11, opacity: 0.7 },

  modalWrap: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 16 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.borderStrong, borderRadius: 2, alignSelf: 'center', marginBottom: 28 },
  modalIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  modalWarnBox: {
    backgroundColor: colors.dangerSoft, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.dangerBorder,
    padding: 16, marginBottom: 24,
  },
  modalWarnText: { color: colors.inkMid, fontSize: 14, lineHeight: 21 },
  modalPrompt: { color: colors.inkSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalInput: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.dangerBorder,
    color: colors.ink, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 18, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginBottom: 20,
  },
  modalInputValid: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  modalDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.danger, borderRadius: radius.md,
    paddingVertical: 14, marginBottom: 12,
  },
  modalDeleteBtnDisabled: { opacity: 0.35 },
  modalDeleteBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { color: colors.inkSoft, fontSize: 15, fontWeight: '600' },
}))
