import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuthStore, useClientStore } from '@/store'
import { api, Product, Card, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function AdminScanner() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const [scannedQR, setScannedQR] = useState<string>('')
  const [card, setCard] = useState<Card | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [mode, setMode] = useState<'scan' | 'redeem'>('scan')
  const [selectedRule, setSelectedRule] = useState<string>('')
  const [scanning, setScanning] = useState(true)
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'requesting' | 'granted' | 'denied'>('pending')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    loadProducts()
    loadRewardRules()
    // Don't auto-init scanner, wait for user to request camera permission

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (scannedQR) {
      loadCardInfo(scannedQR)
    }
  }, [scannedQR])

  const loadProducts = async () => {
    if (!tenantId) return
    try {
      const data = await api.getProducts(tenantId)
      setProducts(data)
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  const loadRewardRules = async () => {
    if (!tenantId) return
    try {
      const data = await api.getRewardRules(tenantId)
      setRules(data)
    } catch (err) {
      console.error('Error loading reward rules:', err)
    }
  }

  const loadCardInfo = async (qrCode: string) => {
    try {
      const cardData = await api.getCardByQR(qrCode)
      setCard(cardData)
    } catch (err) {
      console.error('Error loading card:', err)
    }
  }

  const initScanner = async () => {
    // Check if scanner is already running
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    // Create new scanner instance
    const html5QrCode = new Html5Qrcode('qr-reader')
    scannerRef.current = html5QrCode

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code scanned successfully
          setScannedQR(decodedText)
          setScanning(false)
          html5QrCode.stop().catch(err => console.error('Error stopping scanner:', err))
        },
        () => {
          // QR code scan error (ignore, just means no QR found in frame)
        }
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setCameraPermission('denied')
    }
  }

  const handleRegisterScan = async () => {
    if (!selectedProduct || !scannedQR) {
      setError('Seleziona un prodotto')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const data = await api.registerScan(scannedQR, selectedProduct)
      
      if (data.success) {
        setResult(data)
        await loadCardInfo(scannedQR)
      } else {
        const errorMsg = data.error || 'Errore durante la registrazione'
        const debugInfo = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : ''
        setError(errorMsg + debugInfo)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Errore di rete'
      const errorDetails = err.debug ? `\n\nDebug: ${JSON.stringify(err.debug, null, 2)}` : ''
      setError(errorMsg + errorDetails + `\n\nFull error: ${JSON.stringify(err, null, 2)}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRedeemReward = async () => {
    if (!selectedRule || !scannedQR) {
      setError('Seleziona un premio da riscattare')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const data = await api.redeemReward(scannedQR, selectedRule)
      
      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          remaining_rewards: data.remaining_rewards,
          redeemed: true
        })
        await loadCardInfo(scannedQR)
      } else {
        setError(data.error || 'Errore durante il riscatto')
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il riscatto')
    } finally {
      setProcessing(false)
    }
  }

  const resetScanner = async () => {
    // Stop existing scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }

    // Reset all state
    setScannedQR('')
    setSelectedProduct('')
    setSelectedCategory('')
    setSelectedRule('')
    setCard(null)
    setMode('scan')
    setResult(null)
    setError('')
    setScanning(true)
    setCameraPermission('granted')
    
    // Reinitialize scanner after a short delay
    setTimeout(() => {
      initScanner()
    }, 150)
  }

  // Macro categories mapping
  const macroCategories = {
    espresso: { name: '☕ Espresso', emoji: '☕', types: ['espresso'] },
    milk: { name: '🥛 Cappuccini & Latte', emoji: '🥛', types: ['milk', 'cappuccino', 'latte'] },
    chocolate: { name: '🍫 Cioccolata & Tè', emoji: '🍫', types: ['chocolate', 'tea'] },
    specialty: { name: '✨ Specialità', emoji: '✨', types: ['specialty', 'special'] }
  }

  // Group products by macro category
  const getProductsByCategory = (categoryKey: string) => {
    const category = macroCategories[categoryKey as keyof typeof macroCategories]
    if (!category) return []
    
    return products.filter(product => {
      const type = product.metadata?.type?.toLowerCase()
      return type && category.types.includes(type)
    })
  }

  // Check if we should show macro categories (more than 8 products)
  const shouldShowMacroCategories = products.length > 8

  // Get available categories (categories that have products)
  const availableCategories = Object.entries(macroCategories).filter(([key]) => 
    getProductsByCategory(key).length > 0
  )

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={280} speed={0.3} warpAmount={0.1} />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t.admin.scanner.back}
            </button>
            <h1 className="text-4xl font-bold text-white tracking-tight flex-1">
              {t.admin.scanner.title}
            </h1>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Scanner */}
          {scanning && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-3 text-white flex items-center gap-2">
                  <span className="text-4xl">📸</span>
                  {t.admin.scanner.frameQR}
                </h2>
                <p className="text-gray-200">
                  {t.admin.scanner.frameDesc}
                </p>
              </div>
              
              {/* Step 1: Request Permission Button */}
              {cameraPermission === 'pending' && (
                <div className="text-center py-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center border-2 border-primary-400/30">
                    <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 mb-6">{t.admin.scanner.cameraInfo}</p>
                  <button
                    onClick={async () => {
                      setCameraPermission('requesting')
                      try {
                        // Request camera permission using native API first
                        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                        // Permission granted - stop the stream and init scanner
                        stream.getTracks().forEach(track => track.stop())
                        setCameraPermission('granted')
                        setTimeout(() => initScanner(), 100)
                      } catch (err) {
                        console.error('Camera permission error:', err)
                        setCameraPermission('denied')
                      }
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {language === 'ro' ? 'Activează Camera' : 'Enable Camera'}
                    </span>
                  </button>
                </div>
              )}

              {/* Requesting Permission - Loading State */}
              {cameraPermission === 'requesting' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin"></div>
                  <p className="text-gray-300">{language === 'ro' ? 'Se solicită permisiunea...' : 'Requesting permission...'}</p>
                </div>
              )}

              {/* Camera Permission Denied Warning */}
              {cameraPermission === 'denied' && (
                <div className="bg-red-500/20 border-2 border-red-400/50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🚫</div>
                  <h3 className="text-xl font-bold text-red-200 mb-2">
                    {language === 'ro' ? 'Permisiune Cameră Refuzată' : 'Camera Permission Denied'}
                  </h3>
                  <p className="text-red-100 text-sm mb-4">
                    {language === 'ro' 
                      ? 'Pentru a scana codurile QR, trebuie să permiți accesul la cameră în setările browserului.'
                      : 'To scan QR codes, you need to allow camera access in your browser settings.'}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
                  >
                    {language === 'ro' ? 'Reîncearcă' : 'Try Again'}
                  </button>
                </div>
              )}

              {/* QR Reader - only show when permission is granted */}
              {cameraPermission === 'granted' && (
                <div className="relative">
                  <div id="qr-reader" className="w-full rounded-2xl overflow-hidden [&>video]:w-full [&>video]:rounded-xl"></div>
                  <p className="text-center text-gray-300 mt-4 text-sm">
                    {language === 'ro' ? 'Scanare în curs...' : 'Scanning...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!scanning && (
            <div>
              {/* QR Code scanned info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mb-6">
                <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t.admin.scanner.qrScanned}
                </h2>
                <p className="text-sm text-gray-200 font-mono bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  {scannedQR}
                </p>
              </div>

              {/* Mode selector */}
              {!result && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
                <div className="flex gap-3 mb-8">
                  <button
                    onClick={() => setMode('scan')}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      mode === 'scan'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">📦</span>
                      {t.admin.scanner.registerPurchase}
                    </span>
                  </button>
                  <button
                    onClick={() => setMode('redeem')}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      mode === 'redeem'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">🎁</span>
                      {t.admin.scanner.redeemReward}
                    </span>
                  </button>
                </div>

                {/* Product selection (scan mode) */}
                {mode === 'scan' && (
                  <div>
                    {/* Show macro categories if more than 8 products */}
                    {shouldShowMacroCategories && !selectedCategory ? (
                      <>
                        <h2 className="text-2xl font-bold mb-4 text-white">Seleziona Categoria</h2>
                        <div className="grid grid-cols-2 gap-3">
                          {availableCategories.map(([key, category]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedCategory(key)}
                              className="p-6 rounded-xl border-2 border-white/20 hover:border-primary-400 hover:bg-primary-500/10 bg-white/5 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            >
                              <div className="text-4xl mb-2">{category.emoji}</div>
                              <div className="font-semibold text-white text-sm">
                                {category.name.replace(/^[^\s]+\s/, '')}
                              </div>
                              <div className="text-xs text-gray-300 mt-1">
                                {getProductsByCategory(key).length} prodotti
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-white">
                            {selectedCategory 
                              ? macroCategories[selectedCategory as keyof typeof macroCategories]?.name 
                              : t.admin.scanner.selectProduct}
                          </h2>
                          {shouldShowMacroCategories && selectedCategory && (
                            <button
                              onClick={() => {
                                setSelectedCategory('')
                                setSelectedProduct('')
                              }}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all duration-300"
                            >
                              ← Indietro
                            </button>
                          )}
                        </div>
                        
                        {(shouldShowMacroCategories && selectedCategory ? getProductsByCategory(selectedCategory) : products).length === 0 ? (
                          <p className="text-gray-200">{t.admin.scanner.noProducts}</p>
                        ) : (
                          <div className="space-y-3">
                            {(shouldShowMacroCategories && selectedCategory ? getProductsByCategory(selectedCategory) : products).map((product) => (
                              <button
                                key={product.id}
                                onClick={() => setSelectedProduct(product.id)}
                                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                                  selectedProduct === product.id
                                    ? 'border-primary-400 bg-primary-500/20 shadow-lg shadow-primary-500/30 scale-[1.02]'
                                    : 'border-white/20 hover:border-white/40 hover:shadow-md bg-white/5'
                                }`}
                              >
                                <div className="font-semibold text-white">{product.name}</div>
                                {product.description && (
                                  <div className="text-sm text-gray-300 mt-1">{product.description}</div>
                                )}
                                {product.price && (
                                  <div className="text-sm font-bold text-primary-300 mt-2">
                                    €{product.price.toFixed(2)}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {error && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                      </div>
                    )}

                    {(!shouldShowMacroCategories || selectedCategory) && (
                      <div className="mt-8 flex gap-3">
                        <button
                          onClick={handleRegisterScan}
                          disabled={!selectedProduct || processing}
                          className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                          {processing ? t.admin.scanner.registering : t.admin.scanner.confirmPurchase}
                        </button>
                        <button
                          onClick={resetScanner}
                          className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
                        >
                          {t.admin.scanner.cancel}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Reward redemption (redeem mode) */}
                {mode === 'redeem' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-white">{t.admin.scanner.selectReward}</h2>
                    
                    {!card || !card.loyalty_state || Object.keys(card.loyalty_state).length === 0 ? (
                      <p className="text-gray-200">{t.admin.scanner.noRewards}</p>
                    ) : rules.filter(rule => {
                        const state = card.loyalty_state[rule.id]
                        return state && state.rewards > 0
                      }).length === 0 ? (
                      <div className="text-center py-8 text-gray-200 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
                        <span className="text-4xl mb-2 block">🎁</span>
                        {t.admin.scanner.noRewards}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rules
                          .filter(rule => {
                            const state = card.loyalty_state[rule.id]
                            return state && state.rewards > 0
                          })
                          .map((rule) => {
                            const state = card.loyalty_state[rule.id]
                            return (
                              <button
                                key={rule.id}
                                onClick={() => setSelectedRule(rule.id)}
                                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                                  selectedRule === rule.id
                                    ? 'border-yellow-400 bg-yellow-500/20 shadow-lg shadow-yellow-500/30 scale-[1.02]'
                                    : 'border-white/20 hover:border-white/40 hover:shadow-md bg-white/5'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-white">{rule.name}</div>
                                    <div className="text-sm text-gray-300 mt-2 flex items-center gap-2">
                                      <span>{t.admin.scanner.availableRewards}:</span>
                                      <span className="font-bold text-yellow-600 text-lg">{state.rewards}</span>
                                    </div>
                                  </div>

                                  <div className="text-2xl">🎁</div>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                      </div>
                    )}

                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={handleRedeemReward}
                        disabled={!selectedRule || processing}
                        className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {processing ? t.admin.scanner.redeeming : t.admin.scanner.confirmRedeem}
                      </button>
                      <button
                        onClick={resetScanner}
                        className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
                      >
                        {t.admin.scanner.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success/Result message */}
            {result && (
              <div className={`bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border-2 ${result.redeemed ? 'border-yellow-400/50' : 'border-green-400/50'}`}>
                <h2 className={`text-4xl font-bold mb-6 ${result.redeemed ? 'text-yellow-300' : 'text-green-300'}`}>
                  {result.redeemed ? `🎁 ${t.admin.scanner.rewardRedeemed}` : `✓ ${t.admin.scanner.purchaseRegistered}`}
                </h2>

                {result.redeemed ? (
                  <div>
                    <p className="text-yellow-200 text-lg mb-3">
                      {result.message}
                    </p>
                    {result.remaining_rewards !== undefined && (
                      <p className="text-sm text-yellow-200 bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
                        {t.admin.scanner.remainingRewards}: <span className="font-bold text-xl">{result.remaining_rewards}</span>
                      </p>
                    )}
                  </div>
                ) : result.reward_earned ? (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50 p-6 rounded-xl mb-6">
                    <p className="text-2xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
                      <span className="text-3xl">🎉</span>
                      {t.admin.scanner.rewardEarned}
                    </p>
                    <p className="text-yellow-200 text-lg mb-2">
                      {result.reward_earned.rule_name}
                    </p>
                    <p className="text-sm text-yellow-200 bg-yellow-500/30 rounded-lg p-3">
                      {result.reward_earned.reward_count} {result.reward_earned.reward_count === 1 ? 'premio' : 'premi'} disponibile per il cliente
                    </p>
                  </div>
                ) : (
                  <p className="text-green-200 text-lg mb-6 bg-green-500/20 rounded-xl p-4 border border-green-400/30">
                    ✓ {t.admin.scanner.pointsAdded}
                  </p>
                )}

                <button
                  onClick={resetScanner}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105"
                >
                  {t.admin.scanner.scanNewClient}
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
