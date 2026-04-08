import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useClientStore } from '@/store'
import { supabase } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

interface TenantSettings {
  name: string
  logo_url: string
  primary_color: string
  welcome_message: string
}

export default function AdminSettings() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    logo_url: '',
    primary_color: '#3b82f6',
    welcome_message: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [tenantId])

  const loadSettings = async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (data) {
        setSettings({
          name: data.name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#3b82f6',
          welcome_message: data.metadata?.welcome_message || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!tenantId) return
    setSaving(true)

    try {
      await supabase
        .from('tenants')
        .update({
          name: settings.name,
          logo_url: settings.logo_url,
          primary_color: settings.primary_color,
          metadata: { welcome_message: settings.welcome_message }
        })
        .eq('id', tenantId)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
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
      <div className="fixed inset-0 z-0">
        <DarkVeil hueShift={320} speed={0.3} warpAmount={0.1} />
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
              {language === 'ro' ? 'Înapoi' : 'Back'}
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex-1">
              ⚙️ {language === 'ro' ? 'Setări' : 'Settings'}
            </h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {loading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
              <p className="text-gray-300">{language === 'ro' ? 'Se încarcă...' : 'Loading...'}</p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Business Info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                  {language === 'ro' ? 'Informații Afacere' : 'Business Info'}
                </h2>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'ro' ? 'Nume Afacere' : 'Business Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-400 focus:outline-none transition-colors"
                      placeholder={language === 'ro' ? 'Cafeneaua Mea' : 'My Coffee Shop'}
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
                      {language === 'ro' ? 'Mesaj de Bun Venit' : 'Welcome Message'}
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
                  {language === 'ro' ? 'Aspect' : 'Appearance'}
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    {language === 'ro' ? 'Culoare Primară' : 'Primary Color'}
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
                      {language === 'ro' ? 'Previzualizare' : 'Preview'}
                    </p>
                    <button
                      className="px-6 py-3 text-white font-semibold rounded-xl transition-all"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      {language === 'ro' ? 'Buton Exemplu' : 'Example Button'}
                    </button>
                  </div>
                </div>
              </div>

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
                    {language === 'ro' ? 'Se salvează...' : 'Saving...'}
                  </>
                ) : saved ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {language === 'ro' ? 'Salvat!' : 'Saved!'}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {language === 'ro' ? 'Salvează Setările' : 'Save Settings'}
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
