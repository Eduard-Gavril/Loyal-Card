import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuthStore } from '@/store'
import { api, Product, Card, RewardRule } from '@/lib/supabase'

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

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        // Prefer rear camera on mobile
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
        // Ignore continuous scan errors (noise)
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
        // Reload card to update loyalty state
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
        // Reload card to update loyalty state
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
    setResult(null)
    setError('')
    setScanning(true)
    initScanner()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-primary-600">
            ← Indietro
          </button>
          <h1 className="text-2xl font-bold">Scansiona QR Code</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Scanner */}
        {scanning && (
          <div className="card mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">📸 Inquadra il QR code</h2>
              <p className="text-sm text-gray-600">
                Posiziona il QR code del cliente al centro del riquadro
              </p>
            </div>
            <div id="qr-reader" className="w-full"></div>
            <div className="mt-4 text-sm text-gray-500">
              💡 Consenti l'accesso alla fotocamera quando richiesto
            </div>
          </div>
        )}

        {/* Scanned result */}
        {scannedQR && !scanning && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">✓ QR Code Scansionato</h2>
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-3 rounded">
                {scannedQR}
              </p>
              {card && (
                <div className="mt-3 text-sm text-gray-600">
                  Cliente: {card.client_name || 'N/A'}
                </div>
              )}
            </div>

            {/* Mode selector */}
            {!result && (
              <div className="card">
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setMode('scan')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      mode === 'scan'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📦 Registra Acquisto
                  </button>
                  <button
                    onClick={() => setMode('redeem')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      mode === 'redeem'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🎁 Riscatta Premio
                  </button>
                </div>

                {/* Product selection (scan mode) */}
                {mode === 'scan' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Seleziona il prodotto acquistato</h2>
                {mode === 'scan' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Seleziona il prodotto acquistato</h2>
                
                {products.length === 0 ? (
                  <p className="text-gray-600">Nessun prodotto disponibile</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          selectedProduct === product.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600">{product.description}</div>
                        )}
                        {product.price && (
                          <div className="text-sm font-bold text-primary-600 mt-1">
                            €{product.price.toFixed(2)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleRegisterScan}
                    disabled={!selectedProduct || processing}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Registrazione...' : 'Conferma Acquisto'}
                  </button>
                  <button onClick={resetScanner} className="btn-secondary">
                    Annulla
                  </button>
                </div>
                  </div>
                )}

                {/* Reward redemption (redeem mode) */}
                {mode === 'redeem' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Seleziona il premio da riscattare</h2>
                    
                    {!card || !card.loyalty_state || Object.keys(card.loyalty_state).length === 0 ? (
                      <p className="text-gray-600">Nessun premio disponibile per questa card</p>
                    ) : (
                      <div className="space-y-2">
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
                                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                  selectedRule === rule.id
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold">{rule.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Premi disponibili: <span className="font-bold text-yellow-600">{state.rewards}</span>
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
                      <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={handleRedeemReward}
                        disabled={!selectedRule || processing}
                        className="flex-1 py-3 px-4 rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing ? 'Riscatto...' : 'Conferma Riscatto'}
                      </button>
                      <button onClick={resetScanner} className="btn-secondary">
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success result */}
            {result && result.success && (
              <div className={`card border-2 ${result.redeemed ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${result.redeemed ? 'text-yellow-800' : 'text-green-800'}`}>
                  {result.redeemed ? '🎁 Premio Riscattato!' : '✓ Acquisto Registrato!'}
                </h2>

                {result.redeemed ? (
                  <div>
                    <p className="text-yellow-700 mb-2">
                      {result.message}
                    </p>
                    {result.remaining_rewards !== undefined && (
                      <p className="text-sm text-yellow-600">
                        Premi rimanenti: {result.remaining_rewards}
                      </p>
                    )}
                  </div>
                ) : result.reward_earned ? (
                  <div className="bg-yellow-100 border-2 border-yellow-300 p-4 rounded-lg mb-4">
                    <p className="text-xl font-bold text-yellow-900 mb-2">
                      🎉 Premio Guadagnato!
                    </p>
                    <p className="text-yellow-800">
                      {result.reward_earned.rule_name}
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      {result.reward_earned.reward_count} {result.reward_earned.reward_count === 1 ? 'premio' : 'premi'} disponibile per il cliente
                    </p>
                  </div>
                ) : (
                  <p className="text-green-700 mb-4">
                    Punti aggiunti alla card del cliente
                  </p>
                )}

                <button onClick={resetScanner} className="btn-primary w-full">
                  Scansiona Nuovo Cliente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
