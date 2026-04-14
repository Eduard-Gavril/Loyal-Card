import { useState, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api, Product, Card, RewardRule } from '@/lib/supabase'
import { CartItem, CameraPermission, ScanResult } from '@/types/scanner'

interface UseScannerProps {
  tenantId: string | null
}

export function useScanner({ tenantId }: UseScannerProps) {
  const [scannedQR, setScannedQR] = useState<string>('')
  const [card, setCard] = useState<Card | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [scanning, setScanning] = useState(true)
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('pending')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Load products for tenant
  const loadProducts = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await api.getProducts(tenantId)
      setProducts(data)
    } catch (err) {
      // Error silently handled
    }
  }, [tenantId])

  // Load reward rules for tenant
  const loadRewardRules = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await api.getRewardRules(tenantId)
      setRules(data)
    } catch (err) {
      // Error silently handled
    }
  }, [tenantId])

  // Load card info by QR code
  const loadCardInfo = useCallback(async (qrCode: string) => {
    try {
      const cardData = await api.getCardByQR(qrCode)
      setCard(cardData)
    } catch (err) {
      // Error silently handled
    }
  }, [])

  // Initialize QR scanner
  const initScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }

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
          setScannedQR(decodedText)
          setScanning(false)
          html5QrCode.stop().catch(() => {})
        },
        () => {
          // QR code scan error (ignore, just means no QR found in frame)
        }
      )
    } catch (err) {
      setCameraPermission('denied')
    }
  }, [])

  // Request camera permission
  const requestCameraPermission = useCallback(async () => {
    setCameraPermission('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      setTimeout(() => initScanner(), 100)
    } catch (err) {
      setCameraPermission('denied')
    }
  }, [initScanner])

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }
  }, [])

  // Cart operations
  const addToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === productId)
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, {
        productId,
        productName: product.name,
        quantity: 1,
        price: product.price
      }]
    })
  }, [products])

  const updateCartQuantity = useCallback((productId: string, delta: number) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.productId === productId)
      if (!item) return prevCart
      
      const newQty = item.quantity + delta
      if (newQty <= 0) {
        return prevCart.filter(i => i.productId !== productId)
      }
      return prevCart.map(i =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId))
  }, [])

  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Register all cart items
  const registerCart = useCallback(async () => {
    if (cart.length === 0 || !scannedQR) {
      setError('Aggiungi almeno un prodotto al carrello')
      return false
    }

    setProcessing(true)
    setError('')

    try {
      let lastResult: any = null
      const allResults: any[] = []
      
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const data = await api.registerScan(scannedQR, item.productId)
          if (!data.success) {
            throw new Error(data.error || 'Errore durante la registrazione')
          }
          lastResult = data
          allResults.push(data)
        }
      }
      
      setResult({
        ...lastResult,
        totalItemsProcessed: getTotalItems(),
        multipleItems: true
      })
      
      await loadCardInfo(scannedQR)
      clearCart()
      return true
    } catch (err: any) {
      setError(err.message || 'Errore di rete')
      return false
    } finally {
      setProcessing(false)
    }
  }, [cart, scannedQR, getTotalItems, loadCardInfo, clearCart])

  // Redeem reward
  const redeemReward = useCallback(async (ruleId: string) => {
    if (!ruleId || !scannedQR) {
      setError('Seleziona un premio da riscattare')
      return false
    }

    setProcessing(true)
    setError('')

    try {
      const data = await api.redeemReward(scannedQR, ruleId)
      
      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          remaining_rewards: data.remaining_rewards,
          redeemed: true
        })
        await loadCardInfo(scannedQR)
        return true
      } else {
        setError(data.error || 'Errore durante il riscatto')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il riscatto')
      return false
    } finally {
      setProcessing(false)
    }
  }, [scannedQR, loadCardInfo])

  // Reset scanner state
  const resetScanner = useCallback(async () => {
    await stopScanner()
    
    setScannedQR('')
    setCard(null)
    setResult(null)
    setError('')
    setScanning(true)
    setCameraPermission('granted')
    clearCart()
    
    setTimeout(() => {
      initScanner()
    }, 150)
  }, [stopScanner, clearCart, initScanner])

  return {
    // State
    scannedQR,
    card,
    rules,
    products,
    scanning,
    cameraPermission,
    processing,
    result,
    error,
    cart,
    scannerRef,
    
    // Actions
    loadProducts,
    loadRewardRules,
    loadCardInfo,
    initScanner,
    requestCameraPermission,
    stopScanner,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getTotalItems,
    clearCart,
    registerCart,
    redeemReward,
    resetScanner,
    setScannedQR,
    setError,
  }
}
