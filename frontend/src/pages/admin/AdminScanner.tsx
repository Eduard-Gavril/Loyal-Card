import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuthStore } from '@/store'
import { api, Product } from '@/lib/supabase'

export default function AdminScanner() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const [scannedQR, setScannedQR] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [scanning, setScanning] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadProducts()
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
      } else {
        // Show full error with debug info
        const errorMsg = data.error || 'Errore durante la registrazione'
        const debugInfo = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : ''
        setError(errorMsg + debugInfo)
      }
    } catch (err: any) {
      // Show full error details
      const errorMsg = err.message || 'Errore di rete'
      const errorDetails = err.debug ? `\n\nDebug: ${JSON.stringify(err.debug, null, 2)}` : ''
      setError(errorMsg + errorDetails + `\n\nFull error: ${JSON.stringify(err, null, 2)}`)
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
            </div>

            {/* Product selection */}
            {!result && (
              <div className="card">
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

            {/* Success result */}
            {result && result.success && (
              <div className="card bg-green-50 border-2 border-green-200">
                <h2 className="text-2xl font-bold text-green-800 mb-4">
                  ✓ Acquisto Registrato!
                </h2>

                {result.reward_earned ? (
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
