import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Clipboard, Linking, RefreshControl,
  Modal, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation, Language } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'

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
  // Show first 3 chars and last 2, mask the rest: +39 ***...89
  if (phone.length <= 5) return phone
  const visible = phone.slice(0, 3)
  const tail = phone.slice(-2)
  const masked = '*'.repeat(Math.max(phone.length - 5, 3))
  return `${visible} ${masked}${tail}`
}

// ─── Name section ───────────────────────────────────────────────
function NameSection({ t }: { t: ReturnType<typeof getTranslation> }) {
  const { clientId, displayName, setDisplayName } = useClientStore()
  const p = t.profile
  const inputRef = useRef<TextInput>(null)

  const [editing, setEditing] = useState(!displayName)
  const [value, setValue] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // On mount, if we have no local name but have a clientId, try to load from DB
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
    if (!trimmed) { setError('Inserisci un nome'); return }
    if (!clientId) { setError('Apri prima una carta fedeltà'); return }
    setSaving(true)
    setError('')
    try {
      const { error: dbErr } = await supabase
        .from('clients')
        .update({ name: trimmed })
        .eq('id', clientId)
      if (dbErr) throw dbErr
      setDisplayName(trimmed)
      setEditing(false)
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il salvataggio')
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
          <Ionicons name="person-outline" size={18} color="#a78bfa" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleBig}>{p.nameTitle}</Text>
          <Text style={s.sectionDesc}>{p.nameHint}</Text>
        </View>
        {!editing && displayName && (
          <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color="#a78bfa" />
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
            placeholderTextColor="#4b5563"
            value={value}
            onChangeText={(v) => { setValue(v); setError('') }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          {error ? (
            <View style={[s.errorBox, { marginBottom: 10 }]}>
              <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={s.nameActions}>
            {editing && displayName && (
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setEditing(false); setValue(displayName); setError('') }}
              >
                <Text style={s.cancelBtnText}>Annulla</Text>
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

  // ── Already linked ──────────────────────────────────────────
  if (linkedPhone && !showingCodes) {
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.iconWrap, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={s.sectionTitleBig}>{p.linkedStatus}</Text>
              <View style={s.linkedBadge}>
                <Ionicons name="lock-closed" size={10} color="#10b981" />
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
          <View style={[s.iconWrap, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitleBig}>{p.phoneTitle}</Text>
            <Text style={[s.sectionDesc, { color: '#10b981' }]}>{p.phoneDone}</Text>
          </View>
        </View>
        <View style={s.backupWarn}>
          <Ionicons name="warning-outline" size={16} color="#f59e0b" />
          <Text style={s.backupWarnText}>{p.phoneBackupWarning}</Text>
        </View>
        <View style={s.backupGrid}>
          {backupCodes.map((code, i) => (
            <TouchableOpacity
              key={code}
              style={s.backupCode}
              onPress={() => Clipboard.setString(code)}
            >
              <Text style={s.backupCodeNum}>{i + 1}</Text>
              <Text style={s.backupCodeText}>{code}</Text>
              <Ionicons name="copy-outline" size={13} color="#6b7280" />
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
          <Ionicons name="phone-portrait-outline" size={18} color="#a78bfa" />
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

      <Text style={s.inputLabel}>Numero</Text>
      <View style={s.phoneRow}>
        <View style={s.prefixDisplay}>
          <Text style={s.prefixDisplayText}>{prefix}</Text>
        </View>
        <TextInput
          style={s.phoneInput}
          placeholder={p.phonePlaceholder}
          placeholderTextColor="#4b5563"
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
        placeholderTextColor="#4b5563"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
      />

      <Text style={s.inputLabel}>Conferma PIN</Text>
      <TextInput
        style={[s.input, { marginBottom: 14 }]}
        placeholder={p.pinConfirmPlaceholder}
        placeholderTextColor="#4b5563"
        value={pinConfirm}
        onChangeText={setPinConfirm}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
      />

      {error ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
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
      const body = useBackup
        ? { phone: fullNumber, backup_code: credential }
        : { phone: fullNumber, pin: credential }
      // Pass current clientId so any local cards get merged server-side
      const result = await api.recoverVerify(fullNumber, useBackup ? '' : credential, clientId ?? undefined)

      // Fetch the actual cards from DB for the recovered client
      const cards = await api.getCardsForClient(result.clientId)

      // Replace local cards with recovered ones (clears duplicates)
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
          <Ionicons name="refresh-circle-outline" size={18} color="#a78bfa" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleBig}>{p.recoveryTitle}</Text>
          <Text style={s.sectionDesc} numberOfLines={2}>{p.recoveryDesc}</Text>
        </View>
        <Ionicons name={show ? 'chevron-up' : 'chevron-down'} size={18} color="#4b5563" />
      </TouchableOpacity>

      {show && (
        <View style={s.recoveryBody}>
          {done ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle" size={28} color="#10b981" />
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

              <Text style={s.inputLabel}>Numero</Text>
              <View style={[s.phoneRow, { marginBottom: 14 }]}>
                <View style={s.prefixDisplay}>
                  <Text style={s.prefixDisplayText}>{prefix}</Text>
                </View>
                <TextInput
                  style={s.phoneInput}
                  placeholder={p.phonePlaceholder}
                  placeholderTextColor="#4b5563"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
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
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={s.phoneFoundText}>{fullNumber}</Text>
                <Text style={s.changeLink}>Cambia</Text>
              </TouchableOpacity>

              {!useBackup ? (
                <>
                  <Text style={s.inputLabel}>PIN</Text>
                  <TextInput
                    style={[s.input, { marginBottom: 8 }]}
                    placeholder="••••••"
                    placeholderTextColor="#4b5563"
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
                  <Text style={s.inputLabel}>Backup code</Text>
                  <TextInput
                    style={[s.input, { marginBottom: 8 }]}
                    placeholder={p.recoveryBackupPlaceholder}
                    placeholderTextColor="#4b5563"
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
                  <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
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
  const { language, setLanguage, savedCards, displayName, clientId, linkedPhone, clearAll } = useClientStore()
  const t = getTranslation(language)
  const p = t.profile
  const [refreshing, setRefreshing] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      if (clientId) {
        const { data, error } = await supabase.functions.invoke('delete-account', {
          body: { client_id: clientId },
        })
        if (error) throw error
        if (!data?.success) throw new Error(data?.error ?? 'Server error')
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
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
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

        <NameSection t={t} />

        <LinkPhoneSection t={t} />
        <RecoverySection t={t} />

        {/* Admin Access */}
        <View style={s.section}>
          <TouchableOpacity style={s.adminBtn} onPress={() => router.push('/admin/login')}>
            <View style={s.adminIconWrap}>
              <Ionicons name="shield-half-outline" size={22} color="#7c3aed" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.adminBtnTitle}>{p.adminAccess}</Text>
              <Text style={s.adminBtnSub}>{p.adminSubtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7c3aed" />
          </TouchableOpacity>
        </View>

        {/* Need Help */}
        <TouchableOpacity
          style={s.helpCard}
          onPress={() => Linking.openURL('https://loyalcard.net/contact')}
          activeOpacity={0.8}
        >
          <View style={s.helpIconWrap}>
            <Ionicons name="help-buoy-outline" size={20} color="#60a5fa" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>{p.needHelp}</Text>
            <Text style={s.helpSub}>{p.needHelpSub}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#3b82f6" />
        </TouchableOpacity>

        {/* Legal */}
        <View style={s.legalSection}>
          <Text style={s.legalTitle}>{p.legalTitle}</Text>
          <TouchableOpacity
            style={s.legalRow}
            onPress={() => Linking.openURL('https://loyalcard.net/privacy')}
          >
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text style={s.legalText}>{p.privacyPolicy}</Text>
            <Ionicons name="open-outline" size={13} color="#4b5563" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.legalRow}
            onPress={() => Linking.openURL('https://loyalcard.net/cookie-policy')}
          >
            <Ionicons name="shield-outline" size={16} color="#6b7280" />
            <Text style={s.legalText}>{p.cookiePolicy}</Text>
            <Ionicons name="open-outline" size={13} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Delete account */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => { setDeleteInput(''); setDeleteModal(true) }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color="#f87171" />
          <View style={{ flex: 1 }}>
            <Text style={s.deleteBtnTitle}>{p.deleteAccountTitle}</Text>
            <Text style={s.deleteBtnSub}>{p.deleteAccountSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#f87171" />
        </TouchableOpacity>

        <Text style={s.version}>{p.appVersion}</Text>
      </ScrollView>

      {/* ── Delete confirmation modal ─────────────────────────── */}
      <Modal visible={deleteModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDeleteModal(false)}>
        <View style={s.modalWrap}>
          <View style={s.modalHandle} />

          <View style={s.modalIconWrap}>
            <Ionicons name="warning" size={36} color="#f87171" />
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
            placeholderTextColor="#4b5563"
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, paddingTop: 8 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub: { color: '#7c6faa', fontSize: 14, marginTop: 4 },

  section: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 14 },
  sectionLabel: { color: '#a78bfa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  sectionTitleBig: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sectionDesc: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  recoveryBody: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  stepBadge: { color: '#a78bfa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  phoneFoundRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  phoneFoundText: { color: '#fff', fontWeight: '600', flex: 1 },
  changeLink: { color: '#7c3aed', fontSize: 12, fontWeight: '600' },
  altLink: { marginBottom: 4 },
  altLinkText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },

  langFlags: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingTop: 6 },
  flagBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  flagBtnActive: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
  flagText: { fontSize: 19 },

  inputLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  prefixRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  prefixBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 2 },
  prefixBtnActive: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
  prefixFlag: { fontSize: 18 },
  prefixCode: { color: '#6b7280', fontSize: 11, fontWeight: '700' },
  prefixCodeActive: { color: '#c4b5fd' },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefixDisplay: { backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', paddingHorizontal: 12, justifyContent: 'center' },
  prefixDisplayText: { color: '#a78bfa', fontWeight: '700', fontSize: 15 },
  phoneInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 12 },

  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  errorText: { color: '#f87171', fontSize: 13, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  successText: { color: '#10b981', fontWeight: '600', fontSize: 14 },

  backupWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  backupWarnText: { color: '#fbbf24', fontSize: 12, flex: 1, lineHeight: 18 },
  backupGrid: { gap: 8, marginBottom: 16 },
  backupCode: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backupCodeNum: { color: '#6b7280', fontSize: 12, fontWeight: '700', width: 16 },
  backupCodeText: { flex: 1, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 16, fontWeight: '700', letterSpacing: 2 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 13 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  linkedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  linkedBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  linkedPhone: { color: '#e5e7eb', fontSize: 16, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 },
  nameDisplay: { backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', paddingHorizontal: 14, paddingVertical: 12 },
  nameDisplayText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  nameActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(167,139,250,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' },
  editBtnText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)',
  },
  adminIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  adminBtnTitle: { color: '#c4b5fd', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  adminBtnSub: { color: '#7c3aed', fontSize: 11 },
  helpCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', padding: 16, marginBottom: 12 },
  helpIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  helpTitle: { color: '#93c5fd', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  helpSub: { color: '#3b82f6', fontSize: 11, opacity: 0.85 },
  version: { color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Legal section
  legalSection: { marginBottom: 12, paddingHorizontal: 4 },
  legalTitle: { color: '#374151', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  legalText: { flex: 1, color: '#4b5563', fontSize: 13 },

  // Delete account button
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  deleteBtnTitle: { color: '#f87171', fontSize: 14, fontWeight: '700', marginBottom: 1 },
  deleteBtnSub: { color: '#7f1d1d', fontSize: 11 },

  // Delete modal
  modalWrap: { flex: 1, backgroundColor: '#0f0d2e', padding: 24, paddingTop: 16 },
  modalHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 28 },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(248,113,113,0.25)' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  modalWarnBox: { backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', padding: 16, marginBottom: 24 },
  modalWarnText: { color: '#fca5a5', fontSize: 14, lineHeight: 21 },
  modalPrompt: { color: '#6b7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(248,113,113,0.3)', color: '#fff', paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginBottom: 20 },
  modalInputValid: { borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.08)' },
  modalDeleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  modalDeleteBtnDisabled: { opacity: 0.35 },
  modalDeleteBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
})
