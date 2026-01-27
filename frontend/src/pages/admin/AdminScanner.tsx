import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuthStore } from '@/store'
import { api, Product, Card, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

export default function AdminScanner() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const [scannedQR, setScannedQR] = useState<string>('')
  const [card, setCard] = useState<Card | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [mode, setMode] = useState<'scan' | 'redeem'>('scan')
  const [selectedRule, setSelectedRule] = useState<string>('')
  const [scanning, setScanning] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadProducts()
    loadRewardRules()
    initScanner()

    return () => {
      // Cleanup scanner on unmount
      const elem = document.getElementById('qr-reader')
      if (elem) elem.innerHTML = ''
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

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        videoConstraints: {
          facingMode: { ideal: "environment" }
        }
      },
      false
    )

    scanner.render(
      (decodedText) => {
        setScannedQR(decodedText)
        setScanning(false)
        scanner.clear().catch(err => console.error('Error clearing scanner:', err))
      },
      (errorMessage) => {
        if (!errorMessage.includes('No MultiFormat Readers')) {
          console.debug('QR scan error:', errorMessage)
        }
      }
    )
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

  const resetScanner = () => {
    setScannedQR('')
    setSelectedProduct('')
    setSelectedRule('')
    setCard(null)
    setMode('scan')
    setResult(null)
    setError('')
    setScanning(true)
    initScanner()
  }

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
              Indietro
            </button>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Scansiona QR Code
            </h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Scanner */}
          {scanning && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-3 text-white flex items-center gap-2">
                  <span className="text-4xl">📸</span>
                  Inquadra il QR code
                </h2>
                <p className="text-gray-200">
                  Posiziona il QR code del cliente al centro del riquadro
                </p>
            </div>
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden"></div>
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-200 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <span className="text-xl">💡</span>
                <span>Consenti l'accesso alla fotocamera quando richiesto</span>
              </div>
            </div>
          )}

          {!scanning && (
            <div>
              {/* QR Code scanned info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mb-6">
                <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  QR Code Scansionato
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
                      Registra Acquisto
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
                      Riscatta Premio
                    </span>
                  </button>
                </div>

                {/* Product selection (scan mode) */}
                {mode === 'scan' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Seleziona il prodotto acquistato</h2>
                    
                    {products.length === 0 ? (
                      <p className="text-gray-200">Nessun prodotto disponibile</p>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => (
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
                              <div className="text-sm text-gray-600 mt-1">{product.description}</div>
                            )}
                            {product.price && (
                              <div className="text-sm font-bold text-primary-600 mt-2">
                                €{product.price.toFixed(2)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                      </div>
                    )}

                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={handleRegisterScan}
                        disabled={!selectedProduct || processing}
                        className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {processing ? 'Registrazione...' : 'Conferma Acquisto'}
                      </button>
                      <button
                        onClick={resetScanner}
                        className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}

                {/* Reward redemption (redeem mode) */}
                {mode === 'redeem' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Seleziona il premio da riscattare</h2>
                    
                    {!card || !card.loyalty_state || Object.keys(card.loyalty_state).length === 0 ? (
                      <p className="text-gray-200">Nessun premio disponibile per questa card</p>
                    ) : rules.filter(rule => {
                        const state = card.loyalty_state[rule.id]
                        return state && state.rewards > 0
                      }).length === 0 ? (
                      <div className="text-center py-8 text-gray-200 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
                        <span className="text-4xl mb-2 block">🎁</span>
                        Nessun premio disponibile per questa card
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
                                      <span>Premi disponibili:</span>
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
                        {processing ? 'Riscatto...' : 'Conferma Riscatto'}
                      </button>
                      <button
                        onClick={resetScanner}
                        className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
                      >
                        Annulla
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
                  {result.redeemed ? '🎁 Premio Riscattato!' : '✓ Acquisto Registrato!'}
                </h2>

                {result.redeemed ? (
                  <div>
                    <p className="text-yellow-200 text-lg mb-3">
                      {result.message}
                    </p>
                    {result.remaining_rewards !== undefined && (
                      <p className="text-sm text-yellow-200 bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
                        Premi rimanenti: <span className="font-bold text-xl">{result.remaining_rewards}</span>
                      </p>
                    )}
                  </div>
                ) : result.reward_earned ? (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50 p-6 rounded-xl mb-6">
                    <p className="text-2xl font-bold text-yellow-300 mb-3 flex items-center gap-2">
                      <span className="text-3xl">🎉</span>
                      Premio Guadagnato!
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
                    ✓ Punti aggiunti alla card del cliente
                  </p>
                )}

                <button
                  onClick={resetScanner}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105"
                >
                  Scansiona Nuovo Cliente
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
