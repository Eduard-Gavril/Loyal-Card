import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { api, supabase } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import { Settings, Users, QrCode, Trash2 } from 'lucide-react'

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
}

export default function AdminSettings() {
  const navigate = useNavigate()
  const { tenantId, role } = useAuthStore()
  const { language } = useClientStore()
  const isOwner = role === 'owner'
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    logo_url: '',
    primary_color: '#3b82f6',
    welcome_message: ''
  })
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
      setStaffError(err?.message || 'Failed to create staff account')
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
        setSettings({
          name: data.name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#3b82f6',
          welcome_message: data.metadata?.welcome_message || ''
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!tenantId) return
    setSaving(true)
    setError('')

    try {
      await Promise.race([
        supabase.from('tenants').update({
          name: settings.name,
          logo_url: settings.logo_url,
          primary_color: settings.primary_color,
          metadata: { welcome_message: settings.welcome_message }
        }).eq('id', tenantId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout. Close any background tabs and try again.')), 8000)
        )
      ])

      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
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
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder="https://example.com/logo.png"
                    />
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
