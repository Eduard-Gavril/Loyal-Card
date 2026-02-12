import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function RecoveryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientId, setClientData, language } = useClientStore()
  const t = getTranslation(language)
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'request' | 'verify'>('request')
  const [recoveryToken, setRecoveryToken] = useState('')

  // Check for recovery token in URL
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setRecoveryToken(token)
      setMode('verify')
      handleVerifyToken(token)
    }
  }, [searchParams])

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.requestRecovery(email)
      
      if (result.success) {
        // In demo mode, we show the token directly
        // In production, this would just show "Check your email"
        if (result.recovery_token) {
          setSuccess(t.recovery.tokenGenerated)
          setRecoveryToken(result.recovery_token)
        } else {
          setSuccess(t.recovery.checkEmail)
        }
      }
    } catch (err: any) {
      setError(err.message || t.recovery.requestError)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyToken = async (token?: string) => {
    const tokenToVerify = token || recoveryToken
    if (!tokenToVerify) {
      setError(t.recovery.noToken)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.verifyRecovery(tokenToVerify, clientId || undefined)
      
      if (result.success) {
        // Update local storage with recovered client_id
        if (result.client_id) {
          // Get the first card to set client data
          const cards = await api.getCardsByClient(result.client_id)
          if (cards && cards.length > 0) {
            setClientData({
              clientId: result.client_id,
              cardId: cards[0].id,
              qrCode: cards[0].qr_code,
              tenantId: cards[0].tenant_id
            })
          }
          
          setSuccess(t.recovery.accountRecovered.replace('{count}', result.cards_count || '0'))
          
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
                      {t.recovery.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.recovery.emailPlaceholder}
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

                  {/* Demo: Show recovery token if generated */}
                  {recoveryToken && (
                    <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                      <p className="text-yellow-200 text-sm mb-2">{t.recovery.demoToken}:</p>
                      <code className="text-xs text-yellow-100 break-all block bg-black/20 p-2 rounded">
                        {recoveryToken}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleVerifyToken(recoveryToken)}
                        className="mt-3 w-full bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                      >
                        {t.recovery.useToken}
                      </button>
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
                <div className="space-y-4">
                  <div className="text-center">
                    {loading ? (
                      <div className="py-8">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white">{t.recovery.verifying}</p>
                      </div>
                    ) : error ? (
                      <div className="py-4">
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm mb-4">
                          {error}
                        </div>
                        <button
                          onClick={() => setMode('request')}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          {t.recovery.tryAgain}
                        </button>
                      </div>
                    ) : success ? (
                      <div className="py-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-green-200 text-lg">{success}</p>
                        <p className="text-gray-400 text-sm mt-2">{t.recovery.redirecting}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <p className="text-center text-gray-400 text-sm mt-6">
              {t.recovery.noEmail}{' '}
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
