import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { api } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function CardScreen() {
  const router = useRouter()
  const { tenantId, tenantName } = useLocalSearchParams<{ tenantId: string; tenantName: string }>()
  const { language, savedCards, clientId: storedClientId, setClientData } = useClientStore()
  const t = getTranslation(language)

  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const existingCard = savedCards.find((c) => c.tenantId === tenantId)

  useEffect(() => {
    if (existingCard) {
      setQrCode(existingCard.qrCode)
    } else {
      generateCard()
    }
  }, [])

  async function generateCard() {
    if (!tenantId) return
    setLoading(true)
    setError('')
    try {
      const data = await api.generateClientId(tenantId, storedClientId ?? undefined)
      setQrCode(data.qr_code)
      setClientData({
        clientId: data.client_id,
        cardId: data.card_id,
        qrCode: data.qr_code,
        tenantId,
        tenantName: tenantName ?? undefined,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Errore nella generazione del card')
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!qrCode) return
    try {
      await Share.share({ message: `Il mio codice LoyalCard: ${qrCode}` })
    } catch {}
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{tenantName ?? 'LoyalCard'}</Text>
        {qrCode ? (
          <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#a78bfa" />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      <View style={s.body}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={s.loadingText}>{t.card.generating}</Text>
          </>
        ) : error ? (
          <View style={s.errorBox}>
            <Text style={{ fontSize: 48 }}>⚠️</Text>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={generateCard}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={s.retryText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : qrCode ? (
          <>
            {/* Card */}
            <View style={s.cardBox}>
              <Text style={s.cardLabel}>{tenantName ?? 'LoyalCard'}</Text>
              <View style={s.qrWrap}>
                <QRCode
                  value={qrCode}
                  size={200}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
              <Text style={s.cardHint}>
                {existingCard ? t.card.existing : t.card.new}
              </Text>
              <Text style={s.cardId} numberOfLines={1}>#{qrCode.slice(0, 16)}...</Text>
            </View>

            {/* Instructions */}
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#a78bfa" />
              <Text style={s.infoText}>{t.card.instructions}</Text>
            </View>

            {/* Dashboard button */}
            <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/(tabs)/dashboard')}>
              <Ionicons name="grid-outline" size={18} color="#fff" />
              <Text style={s.dashBtnText}>{t.myDashboard}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.backToListBtn} onPress={() => router.push('/(tabs)/')}>
              <Ionicons name="compass-outline" size={18} color="#a78bfa" />
              <Text style={s.backToListText}>{t.discoverPartners}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  backText: { color: '#fff', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  shareBtn: { width: 40, alignItems: 'flex-end' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  loadingText: { color: '#a78bfa', marginTop: 12, fontSize: 14 },
  errorBox: { alignItems: 'center', gap: 12 },
  errorText: { color: '#f87171', textAlign: 'center', fontSize: 14 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600' },
  cardBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 28, alignItems: 'center', gap: 16, width: '100%' },
  cardLabel: { color: '#fff', fontSize: 20, fontWeight: '800' },
  qrWrap: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16 },
  cardHint: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  cardId: { color: '#4b5563', fontSize: 11 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)', width: '100%' },
  infoText: { color: '#c4b5fd', fontSize: 13, flex: 1 },
  dashBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, width: '100%', justifyContent: 'center' },
  dashBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backToListBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  backToListText: { color: '#a78bfa', fontWeight: '600', fontSize: 14 },
})
