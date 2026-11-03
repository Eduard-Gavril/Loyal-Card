import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { api, supabase } from '@/lib/supabase'
import StaticBackground from '@/components/admin/AdminBackdrop'
import PlanCard from '@/components/admin/PlanCard'
import { usePlanUsage, isPlanError, planErrorText } from '@/lib/plan'
import { Settings, Users, QrCode, Trash2, AlertTriangle } from 'lucide-react'

interface StaffAdmin {
  id: string
  email: string | null
  active: boolean
  created_at: string
}

interface TenantSettings {
  name: string
  logo_url: string
  primary_color: string
  welcome_message: string
  address: string
  city: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  type: string
  description: string
}

const BUSINESS_TYPES: { id: string; it: string; ro: string; en: string }[] = [
  { id: 'cafe', it: 'Bar e caffetteria', ro: 'Cafenea', en: 'Cafe' },
  { id: 'food', it: 'Ristorante e cibo', ro: 'Restaurant și mâncare', en: 'Restaurant and food' },
  { id: 'beauty', it: 'Bellezza e benessere', ro: 'Frumusețe și wellness', en: 'Beauty and wellness' },
  { id: 'gym', it: 'Palestra e sport', ro: 'Sală și sport', en: 'Gym and sport' },
  { id: 'shop', it: 'Negozio', ro: 'Magazin', en: 'Shop' },
]

export default function AdminSettings() {
  const navigate = useNavigate()
  const { tenantId, role } = useAuthStore()
  const { language } = useClientStore()
  const isOwner = role === 'owner'
  const { usage: plan } = usePlanUsage(tenantId)
  const canLogo = !plan || plan.limits.can_white_label
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    logo_url: '',
    primary_color: '#3b82f6',
    welcome_message: '',
    address: '',
    city: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    type: '',
    description: ''
  })
  const [rawMetadata, setRawMetadata] = useState<Record<string, any>>({})
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Staff (scan-only) account creation
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [creatingStaff, setCreatingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffCreated, setStaffCreated] = useState(false)
  const [staffList, setStaffList] = useState<StaffAdmin[]>([])
  const [staffListLoading, setStaffListLoading] = useState(false)
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Business deletion (owner only, 14 day grace period handled by the database)
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const handleRequestDeletion = async () => {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      const res: any = await api.requestTenantDeletion(deleteName)
      setDeletionScheduledAt(res?.scheduled_at ?? null)
      setShowDelete(false)
      setDeleteName('')
    } catch (err: any) {
      const msg = String(err?.message || '')
      setDeleteError(
        msg.includes('NAME_MISMATCH')
          ? (language === 'ro' ? 'Numele nu corespunde.' : language === 'it' ? 'Il nome non corrisponde.' : 'The name does not match.')
          : msg || 'Error'
      )
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleCancelDeletion = async () => {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await api.cancelTenantDeletion()
      setDeletionScheduledAt(null)
    } catch (err: any) {
      setDeleteError(err?.message || 'Error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const loadStaffList = async () => {
    if (!isOwner) return
    setStaffListLoading(true)
    try {
      const result: any = await api.listStaffAdmins()
      setStaffList(result?.staff || [])
    } catch (err) {
      // Non-fatal: the create-staff form still works even if the list fails to load.
    } finally {
      setStaffListLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingStaff(true)
    setStaffError('')
    setStaffCreated(false)
    try {
      await api.createStaffAdmin(staffEmail.trim(), staffPassword)
      setStaffCreated(true)
      setStaffEmail('')
      setStaffPassword('')
      loadStaffList()
    } catch (err: any) {
      setStaffError(isPlanError(err) ? planErrorText(err) : err?.message || 'Failed to create staff account')
    } finally {
      setCreatingStaff(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    setDeletingStaffId(staffId)
    try {
      await api.deleteStaffAdmin(staffId)
      setStaffList((prev) => prev.filter((s) => s.id !== staffId))
    } catch (err) {
      // Leave the row in place; the owner can retry the delete.
    } finally {
      setDeletingStaffId(null)
      setConfirmDeleteId(null)
    }
  }

  useEffect(() => {
    loadSettings()
    loadStaffList()
  }, [tenantId])

  const loadSettings = async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      const result = await Promise.race([
        supabase.from('tenants').select('*').eq('id', tenantId).single(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
        )
      ]) as any

      const data = result?.data
      if (data) {
        setDeletionScheduledAt(data.deletion_scheduled_at || null)
        setSettings({
          name: data.name || '',
          logo_url: data.logo_url || '',
          primary_color: data.brand_color || '#3b82f6',
          welcome_message: data.metadata?.welcome_message || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          latitude: data.latitude != null ? Number(data.latitude) : null,
          longitude: data.longitude != null ? Number(data.longitude) : null,
          type: data.metadata?.type || '',
          description: data.metadata?.description || ''
        })
        setRawMetadata(data.metadata || {})
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!tenantId) return
    const T = (it: string, ro: string, en: string) => (language === 'it' ? it : language === 'ro' ? ro : en)
    if (!settings.type) {
      setError(T('Seleziona il tipo di attività.', 'Selectează tipul afacerii.', 'Select the business type.'))
      return
    }
    if (settings.latitude == null || settings.longitude == null) {
      setError(T('Imposta la posizione: cerca l\'indirizzo oppure usa la tua posizione attuale.', 'Setează locația: caută adresa sau folosește locația curentă.', 'Set the position: search the address or use your current location.'))
      return
    }
    setSaving(true)
    setError('')

    try {
      const result = await Promise.race([
        supabase.from('tenants').update({
          name: settings.name,
          logo_url: settings.logo_url || null,
          brand_color: settings.primary_color,
          address: settings.address.trim() || null,
          city: settings.city.trim() || null,
          postal_code: settings.postal_code.trim() || null,
          latitude: settings.latitude,
          longitude: settings.longitude,
          // keep the keys this page does not edit (type, description, ...) instead of overwriting them
          metadata: {
            ...rawMetadata,
            welcome_message: settings.welcome_message,
            type: settings.type || null,
            description: settings.description.trim() || null
          }
        }).eq('id', tenantId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
        )
      ]) as any
      if (result?.error) throw result.error

      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const L = (it: string, ro: string, en: string) => (language === 'it' ? it : language === 'ro' ? ro : en)

  const NOMINATIM = 'https://nominatim.openstreetmap.org'

  const geocode = async (q: string) => {
    const res = await fetch(`${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { 'Accept-Language': language }
    })
    const rows = await res.json()
    return Array.isArray(rows) && rows.length > 0 ? { lat: Number(rows[0].lat), lon: Number(rows[0].lon) } : null
  }

  // Finds the coordinates of the typed address (OpenStreetMap Nominatim, free, no key).
  // Tries the most precise query first, then looser ones (without the postcode, then the city alone).
  const findPosition = async () => {
    const address = settings.address.trim()
    const city = settings.city.trim()
    const postal = settings.postal_code.trim()
    if (!address && !city) {
      setGeoMessage(L('Scrivi almeno la città, oppure usa la tua posizione attuale.', 'Scrie cel puțin orașul sau folosește locația curentă.', 'Type at least the city, or use your current location.'))
      return
    }
    const attempts = [[address, city, postal], [address, city], [address, postal], [city, postal], [city]]
      .map((parts) => ({ q: parts.filter(Boolean).join(', '), precise: parts.includes(address) && !!address }))
      .filter((a, i, all) => a.q && all.findIndex((b) => b.q === a.q) === i)
    setGeoBusy(true)
    setGeoMessage('')
    try {
      for (const a of attempts) {
        const hit = await geocode(a.q)
        if (hit) {
          setSettings((prev) => ({ ...prev, latitude: hit.lat, longitude: hit.lon }))
          setGeoMessage(a.precise ? '' : L('Trovata solo la città: posizione approssimativa. Per più precisione usa la tua posizione attuale.', 'Am găsit doar orașul: locație aproximativă. Pentru precizie folosește locația curentă.', 'Only the city was found: approximate position. For more precision use your current location.'))
          return
        }
      }
      setGeoMessage(L('Indirizzo non trovato. Controlla indirizzo e città, oppure usa la tua posizione attuale.', 'Adresă negăsită. Verifică adresa și orașul sau folosește locația curentă.', 'Address not found. Check the address and city, or use your current location.'))
    } catch {
      setGeoMessage(L('Ricerca non riuscita. Riprova.', 'Căutarea a eșuat. Încearcă din nou.', 'Search failed. Try again.'))
    } finally {
      setGeoBusy(false)
    }
  }

  const useMyPosition = () => {
    if (!navigator.geolocation) {
      setGeoMessage(L('Il tuo browser non supporta la posizione.', 'Browserul tău nu suportă localizarea.', 'Your browser does not support location.'))
      return
    }
    setGeoBusy(true)
    setGeoMessage('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setSettings((prev) => ({ ...prev, latitude, longitude }))
        // fill the empty address fields from the position, best effort
        try {
          const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=18&addressdetails=1&lat=${latitude}&lon=${longitude}`, {
            headers: { 'Accept-Language': language }
          })
          const a = (await res.json())?.address || {}
          const street = [a.road, a.house_number].filter(Boolean).join(' ')
          setSettings((prev) => ({
            ...prev,
            address: prev.address || street,
            city: prev.city || a.city || a.town || a.village || a.municipality || '',
            postal_code: prev.postal_code || a.postcode || ''
          }))
        } catch {
          // the coordinates are enough
        }
        setGeoBusy(false)
      },
      () => {
        setGeoMessage(L('Non riesco a leggere la posizione: consenti l\'accesso nel browser.', 'Nu pot citi locația: permite accesul în browser.', 'Cannot read your location: allow access in the browser.'))
        setGeoBusy(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const colorPresets = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticBackground />
      </div>

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {language === 'ro' ? 'Înapoi' : language === 'it' ? 'Indietro' : 'Back'}
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex-1 flex items-center gap-2 sm:gap-3">
              <Settings className="w-7 h-7 sm:w-9 sm:h-9" />
              {language === 'ro' ? 'Setări' : language === 'it' ? 'Impostazioni' : 'Settings'}
            </h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {loading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : language === 'it' ? 'Caricamento...' : 'Loading...'}</p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {plan && <PlanCard usage={plan} />}

              {/* Business Info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Informații Afacere' : language === 'it' ? 'Informazioni Azienda' : 'Business Info'}
                </h2>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'ro' ? 'Nume Afacere' : language === 'it' ? 'Nome Azienda' : 'Business Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder={language === 'ro' ? 'Cafeneaua Mea' : language === 'it' ? 'Il Mio Cafè' : 'My Coffee Shop'}
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'ro' ? 'URL Logo' : 'Logo URL'}
                    </label>
                    <input
                      type="url"
                      value={settings.logo_url}
                      disabled={!canLogo}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder="https://example.com/logo.png"
                    />
                    {!canLogo && (
                      <p className="mt-2 text-sm text-amber-200">
                        {language === 'ro' ? 'Logo-ul propriu (white-label) este inclus începând cu planul Business.' : language === 'it' ? 'Il logo personalizzato (white-label) è incluso dal piano Business.' : 'Your own logo (white-label) is included from the Business plan.'}
                      </p>
                    )}
                    {settings.logo_url && (
                      <div className="mt-3 p-4 bg-white/5 rounded-xl">
                        <img
                          src={settings.logo_url}
                          alt="Logo preview"
                          className="h-16 object-contain mx-auto"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  {/* Welcome Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'ro' ? 'Mesaj de Bun Venit' : language === 'it' ? 'Messaggio di Benvenuto' : 'Welcome Message'}
                    </label>
                    <textarea
                      value={settings.welcome_message}
                      onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors resize-none"
                      rows={3}
                      placeholder={language === 'ro' 
                        ? 'Bun venit la programul nostru de fidelitate!'
                        : 'Welcome to our loyalty program!'}
                    />
                  </div>
                </div>
              </div>

              {/* Location and listing */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {L('Posizione e visibilità', 'Locație și vizibilitate', 'Location and visibility')}
                </h2>
                <p className="text-sm text-gray-300 mb-4 sm:mb-6">
                  {L(
                    'Il tipo di attività e la posizione sono obbligatori per comparire nella lista dei partner: i clienti vedono le attività più vicine a loro. Indirizzo, CAP e descrizione sono facoltativi: basta la posizione, trovata dall\'indirizzo o con la tua posizione attuale.',
                    'Tipul afacerii și locația sunt obligatorii pentru a apărea în lista partenerilor: clienții văd afacerile cele mai apropiate de ei. Adresa, codul poștal și descrierea sunt opționale: este suficientă locația, găsită după adresă sau cu locația curentă.',
                    'The business type and the position are required to appear in the partners list: customers see the businesses closest to them. Address, postcode and description are optional: the position is enough, found from the address or with your current location.'
                  )}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{L('Tipo di attività', 'Tipul afacerii', 'Business type')} *</label>
                    <select
                      value={settings.type}
                      onChange={(e) => setSettings({ ...settings, type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-primary-400 focus:outline-none transition-colors"
                    >
                      <option value="" className="text-black">{L('Seleziona...', 'Selectează...', 'Select...')}</option>
                      {BUSINESS_TYPES.map((b) => (
                        <option key={b.id} value={b.id} className="text-black">{L(b.it, b.ro, b.en)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{L('Breve descrizione', 'Scurtă descriere', 'Short description')} ({L('facoltativa', 'opțională', 'optional')})</label>
                    <input
                      type="text"
                      value={settings.description}
                      maxLength={120}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder={L('Es. Caffetteria artigianale in centro', 'Ex. Cafenea artizanală în centru', 'E.g. Craft coffee shop downtown')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{L('Indirizzo', 'Adresă', 'Address')} ({L('facoltativo', 'opțional', 'optional')})</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value, latitude: null, longitude: null })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder={L('Via Roma 1', 'Strada Exemplu 1', '1 Main Street')}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">{L('Città', 'Oraș', 'City')}</label>
                      <input
                        type="text"
                        value={settings.city}
                        onChange={(e) => setSettings({ ...settings, city: e.target.value, latitude: null, longitude: null })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-primary-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{L('CAP', 'Cod poștal', 'Postcode')}</label>
                      <input
                        type="text"
                        value={settings.postal_code}
                        onChange={(e) => setSettings({ ...settings, postal_code: e.target.value, latitude: null, longitude: null })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-primary-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={findPosition}
                      disabled={geoBusy}
                      className="flex-1 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-400/40 text-primary-100 font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {L('Trova la posizione dall\'indirizzo', 'Găsește locația după adresă', 'Find position from address')}
                    </button>
                    <button
                      type="button"
                      onClick={useMyPosition}
                      disabled={geoBusy}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {L('Usa la mia posizione attuale', 'Folosește locația mea curentă', 'Use my current location')}
                    </button>
                  </div>

                  {geoMessage && <p className="text-sm text-gray-200">{geoMessage}</p>}

                  <p className={`text-sm ${settings.latitude != null && settings.longitude != null ? 'text-green-300' : 'text-amber-200'}`}>
                    {settings.latitude != null && settings.longitude != null
                      ? L(`Posizione impostata (${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)}). Salva per applicarla.`, `Locație setată (${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)}). Salvează pentru a o aplica.`, `Position set (${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)}). Save to apply it.`)
                      : L('Posizione non impostata: l\'attività non compare ancora nella lista dei partner.', 'Locație nesetată: afacerea nu apare încă în lista partenerilor.', 'Position not set: the business does not appear in the partners list yet.')}
                  </p>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Aspect' : language === 'it' ? 'Aspetto' : 'Appearance'}
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    {language === 'ro' ? 'Culoare Primară' : language === 'it' ? 'Colore Primario' : 'Primary Color'}
                  </label>
                  
                  {/* Color presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setSettings({ ...settings, primary_color: preset.value })}
                        className={`h-12 rounded-xl transition-all duration-300 ${
                          settings.primary_color === preset.value 
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-105' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>

                  {/* Custom color */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="h-12 w-12 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-mono focus:border-primary-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-400 mb-3">
                      {language === 'ro' ? 'Previzualizare' : language === 'it' ? 'Anteprima' : 'Preview'}
                    </p>
                    <button
                      className="px-6 py-3 text-white font-semibold rounded-xl transition-all"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      {language === 'ro' ? 'Buton Exemplu' : language === 'it' ? 'Pulsante Esempio' : 'Example Button'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Staff (scan-only) accounts */}
              {isOwner && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                    {language === 'ro' ? 'Personal' : language === 'it' ? 'Personale' : 'Staff'}
                  </h2>
                  <p className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                    <QrCode className="w-4 h-4 flex-shrink-0" />
                    {language === 'ro'
                      ? 'Creează un cont separat care poate doar scana coduri QR'
                      : language === 'it'
                      ? 'Crea un account separato che può solo scansionare i QR'
                      : 'Create a separate login that can only scan QR codes'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/reports')}
                    className="text-sm text-primary-300 hover:text-primary-200 underline mb-4 sm:mb-6"
                  >
                    {language === 'ro'
                      ? 'Vezi câte scanări a făcut fiecare angajat în Rapoarte →'
                      : language === 'it'
                      ? 'Vedi quante scansioni ha fatto ogni dipendente nei Report →'
                      : 'See how many scans each staff member made in Reports →'}
                  </button>

                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {language === 'ro' ? 'Email' : 'Email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        disabled={creatingStaff}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                        placeholder="staff@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {language === 'ro' ? 'Parolă' : language === 'it' ? 'Password' : 'Password'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        disabled={creatingStaff}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                        placeholder="••••••••"
                      />
                    </div>

                    {staffError && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                        {staffError}
                      </div>
                    )}
                    {staffCreated && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-xl px-4 py-3 text-green-300 text-sm">
                        {language === 'ro' ? 'Cont creat cu succes' : language === 'it' ? 'Account creato con successo' : 'Account created successfully'}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={creatingStaff}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingStaff
                        ? (language === 'ro' ? 'Se creează...' : language === 'it' ? 'Creazione...' : 'Creating...')
                        : (language === 'ro' ? 'Creează Cont' : language === 'it' ? 'Crea Account' : 'Create Account')}
                    </button>
                  </form>

                  {/* Staff list */}
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                    {staffListLoading ? (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 mx-auto border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
                      </div>
                    ) : staffList.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {language === 'ro' ? 'Niciun cont de personal creat încă' : language === 'it' ? 'Nessun account creato finora' : 'No staff accounts created yet'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {staffList.map((staff) => (
                          <div
                            key={staff.id}
                            className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{staff.email || staff.id}</p>
                              {!staff.active && (
                                <span className="text-xs text-red-400">
                                  {language === 'ro' ? 'Dezactivat' : language === 'it' ? 'Disattivato' : 'Deactivated'}
                                </span>
                              )}
                            </div>

                            {confirmDeleteId === staff.id ? (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  disabled={deletingStaffId === staff.id}
                                  className="px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {deletingStaffId === staff.id
                                    ? '...'
                                    : (language === 'ro' ? 'Confirmă' : language === 'it' ? 'Conferma' : 'Confirm')}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                                >
                                  {language === 'ro' ? 'Anulează' : language === 'it' ? 'Annulla' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(staff.id)}
                                className="flex-shrink-0 p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                title={language === 'ro' ? 'Șterge' : language === 'it' ? 'Elimina' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delete business (owner only) */}
              {isOwner && (
                <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-red-500/30">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                    {language === 'ro' ? 'Șterge afacerea' : language === 'it' ? 'Elimina attività' : 'Delete business'}
                  </h2>

                  {deletionScheduledAt ? (
                    <>
                      <p className="text-sm text-red-200 mb-4">
                        {language === 'ro'
                          ? `Afacerea va fi ștearsă definitiv pe ${new Date(deletionScheduledAt).toLocaleDateString('ro-RO')}. Până atunci poți anula.`
                          : language === 'it'
                          ? `L'attività verrà eliminata definitivamente il ${new Date(deletionScheduledAt).toLocaleDateString('it-IT')}. Fino ad allora puoi annullare.`
                          : `Your business will be permanently deleted on ${new Date(deletionScheduledAt).toLocaleDateString('en-GB')}. You can cancel until then.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleCancelDeletion}
                        disabled={deleteBusy}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        {language === 'ro' ? 'Anulează ștergerea' : language === 'it' ? 'Annulla eliminazione' : 'Cancel deletion'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-300 mb-4">
                        {language === 'ro'
                          ? 'Se șterg afacerea, sediile, produsele, recompensele, cardurile clienților pentru această afacere și conturile de acces ale tale și ale personalului. Conturile clienților rămân. Ai 14 zile în care poți anula.'
                          : language === 'it'
                          ? 'Vengono eliminati l\'attività, le sedi, i prodotti, i premi, le carte dei clienti di questa attività e gli account di accesso tuo e del personale. Gli account dei clienti restano. Hai 14 giorni di tempo per annullare.'
                          : 'This deletes the business, its stores, products, rewards, the customer cards for this business and the login accounts of you and your staff. Customer accounts are kept. You have 14 days to cancel.'}
                      </p>
                      {!showDelete ? (
                        <button
                          type="button"
                          onClick={() => setShowDelete(true)}
                          className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 font-semibold rounded-xl transition-all duration-300"
                        >
                          {language === 'ro' ? 'Șterge afacerea' : language === 'it' ? 'Elimina attività' : 'Delete business'}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            {language === 'ro'
                              ? `Scrie numele afacerii pentru a confirma: ${settings.name}`
                              : language === 'it'
                              ? `Scrivi il nome dell'attività per confermare: ${settings.name}`
                              : `Type the business name to confirm: ${settings.name}`}
                          </label>
                          <input
                            type="text"
                            value={deleteName}
                            onChange={(e) => setDeleteName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-red-400 focus:outline-none transition-colors"
                          />
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleRequestDeletion}
                              disabled={deleteBusy || deleteName.trim().length === 0}
                              className="flex-1 py-3 bg-red-500/80 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {language === 'ro' ? 'Confirmă ștergerea' : language === 'it' ? 'Conferma eliminazione' : 'Confirm deletion'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowDelete(false); setDeleteName(''); setDeleteError('') }}
                              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                            >
                              {language === 'ro' ? 'Anulează' : language === 'it' ? 'Annulla' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {deleteError && (
                    <div className="mt-3 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                      {deleteError}
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {language === 'ro' ? 'Se salvează...' : language === 'it' ? 'Salvataggio...' : 'Saving...'}
                  </>
                ) : saved ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {language === 'ro' ? 'Salvat!' : language === 'it' ? 'Salvato!' : 'Saved!'}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {language === 'ro' ? 'Salvează Setările' : language === 'it' ? 'Salva Impostazioni' : 'Save Settings'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
