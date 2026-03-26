import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import { isValidPhoneNumber } from '@/lib/phoneUtils'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function RecoveryPage() {
  const navigate = useNavigate()
  const { clientId, setClientData, replaceAllCards, language } = useClientStore()
  const t = getTranslation(language)
  
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'request' | 'verify'>('request')

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      setError('Invalid phone number format. Please use format: +40 123 456 789')
      setLoading(false)
      return
    }

    try {
      const result = await api.requestRecovery(phone)
      
      if (result.success && result.phone_found) {
        setMode('verify')
        setSuccess(t.recovery.checkPhone || 'Phone found. Please enter your PIN.')
      }
    } catch (err: any) {
      setError(err.message || t.recovery.requestError)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!useBackupCode && !pin) {
      setError('Please enter your PIN')
      return
    }

    if (useBackupCode && !backupCode) {
      setError('Please enter a backup code')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.verifyRecovery(
        phone,
        useBackupCode ? undefined : pin,
        useBackupCode ? backupCode : undefined,
        clientId || undefined
      )
      
      if (result.success) {
        // Update local storage with recovered client_id
        if (result.client_id) {
          // Get all cards for the recovered client and replace local data
          const cards = await api.getCardsByClient(result.client_id)
          if (cards && cards.length > 0) {
            // Replace all saved cards with the recovered ones
            const recoveredCards = cards.map(card => ({
              clientId: result.client_id,
              cardId: card.id,
              qrCode: card.qr_code,
              tenantId: card.tenant_id
            }))
            replaceAllCards(recoveredCards)
            
            // Set first card as active
            setClientData(recoveredCards[0])
          }
          
          // Show success with merge info
          const mergeInfo = result.cards_merged > 0 || result.cards_transferred > 0
            ? ` (${result.cards_merged || 0} merged, ${result.cards_transferred || 0} transferred)`
            : ''
          setSuccess(t.recovery.accountRecovered.replace('{count}', result.cards_count || '0') + mergeInfo)
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || t.recovery.verifyError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={180}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.3}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10"></div>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6">
          <div className="max-w-lg mx-auto flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{t.wallet.back}</span>
            </button>
            <LanguageSelector />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t.recovery.title}
              </h1>
              <p className="text-gray-300">
                {t.recovery.subtitle}
              </p>
            </div>

            {/* Recovery Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              {mode === 'request' ? (
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t.recovery.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.recovery.phonePlaceholder}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.recovery.sending : t.recovery.sendButton}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyRecovery} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-white text-sm">
                      Enter your 6-digit PIN to recover your account
                    </p>
                  </div>

                  {!useBackupCode ? (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        PIN
                      </label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 6) setPin(value)
                        }}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Backup Code
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          setBackupCode(value)
                        }}
                        placeholder="XXXX-XXXX"
                        maxLength={9}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 font-mono"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.recovery.verifying : 'Verify'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                    className="w-full text-primary-400 hover:text-primary-300 text-sm"
                  >
                    {useBackupCode 
                      ? 'Use PIN instead' 
                      : 'Forgot PIN? Use backup code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('request')
                      setPin('')
                      setBackupCode('')
                      setUseBackupCode(false)
                    }}
                    className="w-full text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Try different phone number
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <p className="text-center text-gray-400 text-sm mt-6">
              {t.recovery.noPhone}{' '}
              <button
                onClick={() => navigate('/dashboard')}
                className="text-primary-400 hover:text-primary-300"
              >
                {t.recovery.createNew}
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
