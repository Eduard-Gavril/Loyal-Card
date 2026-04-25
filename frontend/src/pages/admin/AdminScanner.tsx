import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuthStore, useClientStore } from '@/store'
import { api, Product, Card, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

// Cart item interface for multiple product selection
interface CartItem {
  productId: string
  productName: string
  quantity: number
  price?: number
}

export default function AdminScanner() {
  const navigate = useNavigate()
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const [scannedQR, setScannedQR] = useState<string>('')
  const [card, setCard] = useState<Card | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [mode, setMode] = useState<'scan' | 'redeem'>('scan')
  const [selectedRule, setSelectedRule] = useState<string>('')
  const [scanning, setScanning] = useState(true)
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'requesting' | 'granted' | 'denied'>('pending')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  
  // Cart state for multiple product selection
  const [cart, setCart] = useState<CartItem[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Keyboard shortcuts and filtering
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [productStats, setProductStats] = useState<Record<string, number>>({})

  useEffect(() => {
    loadProducts()
    loadRewardRules()
    loadProductStats()

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    if (scannedQR) {
      loadCardInfo(scannedQR)
    }
  }, [scannedQR])

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!scannedQR || scanning || result || mode !== 'scan' || showConfirmation) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const key = e.key.toLowerCase()
      
      // Number keys: add product by position (1-9)
      if (/^[1-9]$/.test(key)) {
        e.preventDefault()
        const index = parseInt(key) - 1
        const filteredProducts = getFilteredProducts()
        if (index < filteredProducts.length) {
          addToCart(filteredProducts[index].id)
        }
        return
      }
      
      // Letter keys: append to search filter
      if (/^[a-z ]$/i.test(key)) {
        e.preventDefault()
        setSearchFilter(prev => prev + key)
        return
      }
      
      // Backspace: remove last character from search
      if (key === 'backspace') {
        e.preventDefault()
        setSearchFilter(prev => prev.slice(0, -1))
        return
      }
      
      // Enter: proceed to confirmation if cart has items
      if (key === 'enter' && cart.length > 0) {
        e.preventDefault()
        setShowConfirmation(true)
        return
      }
      
      // Escape: clear search or cancel
      if (key === 'escape') {
        e.preventDefault()
        if (searchFilter) {
          setSearchFilter('')
        } else if (cart.length > 0) {
          setCart([])
        } else {
          resetScanner()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [scannedQR, scanning, result, mode, showConfirmation, cart, searchFilter, products, selectedCategory])

  const loadProducts = async () => {
    if (!tenantId) return
    try {
      const data = await api.getProducts(tenantId)
      setProducts(data)
    } catch (err: any) {
      setError(err?.message || t.scanner.networkError)
    }
  }

  const loadProductStats = async () => {
    if (!tenantId) return
    try {
      const stats = await api.getProductUsageStats(tenantId)
      setProductStats(stats)
    } catch (err) {
      // Error silently handled
    }
  }

  const loadRewardRules = async () => {
    if (!tenantId) return
    try {
      const data = await api.getRewardRules(tenantId)
      setRules(data)
    } catch (err: any) {
      setError(err?.message || t.scanner.networkError)
    }
  }

  const loadCardInfo = async (qrCode: string) => {
    try {
      const cardData = await api.getCardByQR(qrCode)
      setCard(cardData)
    } catch (err: any) {
      setError(err?.message || t.scanner.networkError)
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
          html5QrCode.stop().catch(() => {})
        },
        () => {
          // QR code scan error (ignore, just means no QR found in frame)
        }
      )
    } catch (err) {
      setCameraPermission('denied')
    }
  }

  // Add product to cart
  const addToCart = (productId: string) => {
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
  }

  // Update quantity in cart
  const updateCartQuantity = (productId: string, delta: number) => {
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
  }

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId))
  }

  // Get total items in cart
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  // Process all cart items
  const handleRegisterCart = async () => {
    if (cart.length === 0 || !scannedQR) {
      setError(t.scanner.addAtLeastOne)
      return
    }

    setProcessing(true)
    setError('')

    try {
      let lastResult: any = null
      let allResults: any[] = []
      
      // Register each item in the cart
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const data = await api.registerScan(scannedQR, item.productId)
          if (!data.success) {
            throw new Error(data.error || t.scanner.registrationError)
          }
          lastResult = data
          allResults.push(data)
        }
      }
      
      // Combine results - check if any resulted in a reward
      const rewardResults = allResults.filter(r => r.reward_earned)
      
      if (rewardResults.length > 0) {
        // Show the last reward earned
        setResult({
          ...lastResult,
          totalItemsProcessed: getTotalItems(),
          multipleItems: true
        })
      } else {
        setResult({
          ...lastResult,
          totalItemsProcessed: getTotalItems(),
          multipleItems: true
        })
      }
      
      await loadCardInfo(scannedQR)
      setCart([])
      setShowConfirmation(false)
    } catch (err: any) {
      const errorMsg = err.message || t.scanner.networkError
      setError(errorMsg)
    } finally {
      setProcessing(false)
    }
  }

  const handleRedeemReward = async () => {
    if (!selectedRule || !scannedQR) {
      setError(t.scanner.selectRewardToRedeem)
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
        setError(data.error || t.scanner.redemptionError)
      }
    } catch (err: any) {
      setError(err.message || t.scanner.redemptionError)
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
    setSelectedCategory('')
    setSelectedRule('')
    setCard(null)
    setMode('scan')
    setResult(null)
    setError('')
    setScanning(true)
    setCameraPermission('granted')
    setCart([])
    setShowConfirmation(false)
    setSearchFilter('')
    
    // Reinitialize scanner after a short delay
    setTimeout(() => {
      initScanner()
    }, 150)
  }

  // Macro categories mapping
  const macroCategories = {
    espresso: { name: '☕ Espresso', emoji: '☕', types: ['espresso'] as string[] },
    milk: { name: '🥛 Cappuccini & Latte', emoji: '🥛', types: ['milk', 'cappuccino', 'latte'] as string[] },
    chocolate: { name: '🍫 Cioccolata & Tè', emoji: '🍫', types: ['chocolate', 'tea'] as string[] },
    specialty: { name: '✨ Specialità', emoji: '✨', types: ['specialty', 'special'] as string[] },
    other: { name: '📦 General', emoji: '📦', types: [] as string[] } // Catch-all for products without type
  }

  // Group products by macro category
  const getProductsByCategory = (categoryKey: string) => {
    const category = macroCategories[categoryKey as keyof typeof macroCategories]
    if (!category) return []
    
    // Special case for "other" - products without type or with unmatched type
    if (categoryKey === 'other') {
      return products.filter(product => {
        const type = product.metadata?.type?.toLowerCase()
        if (!type) return true // No type = show in "other"
        
        // Check if type matches any existing category
        const matchesAnyCategory = Object.entries(macroCategories)
          .filter(([key]) => key !== 'other')
          .some(([_, cat]) => cat.types.includes(type))
        
        return !matchesAnyCategory // Show in "other" if doesn't match any category
      })
    }
    
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

  // Fallback: if no categories have products, disable macro categories
  const useMacroCategories = shouldShowMacroCategories && availableCategories.length > 0

  // Filter and sort products by usage frequency
  const getFilteredProducts = () => {
    let filteredProducts = useMacroCategories && selectedCategory 
      ? getProductsByCategory(selectedCategory) 
      : products
    
    // Apply search filter
    if (searchFilter) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        product.id.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }
    
    // Sort by usage frequency (most used first)
    return filteredProducts.sort((a, b) => {
      const aCount = productStats[a.id] || 0
      const bCount = productStats[b.id] || 0
      return bCount - aCount // Descending order
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil hueShift={280} speed={0.3} warpAmount={0.1} />
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
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{t.admin.scanner.back}</span>
            </button>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex-1">
              {t.admin.scanner.title}
            </h1>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Scanner */}
          {scanning && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 border border-white/20">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-white flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl">📸</span>
                  {t.admin.scanner.frameQR}
                </h2>
                <p className="text-sm sm:text-base text-gray-200">
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
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 border border-white/20 mb-6">
                <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {t.admin.scanner.qrScanned}
                </h2>
                <p className="text-xs sm:text-sm text-gray-200 font-mono bg-black/30 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 break-all">
                  {scannedQR}
                </p>
              </div>

              {/* Mode selector */}
              {!result && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 border border-white/20">
                <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
                  <button
                    onClick={() => setMode('scan')}
                    className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                      mode === 'scan'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg sm:text-xl">📦</span>
                      <span className="leading-tight">{t.admin.scanner.registerPurchase}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setMode('redeem')}
                    className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                      mode === 'redeem'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg sm:text-xl">🎁</span>
                      <span className="leading-tight">{t.admin.scanner.redeemReward}</span>
                    </span>
                  </button>
                </div>

                {/* Product selection (scan mode) */}
                {mode === 'scan' && !showConfirmation && (
                  <div>
                    {/* Cart summary badge */}
                    {cart.length > 0 && (
                      <div className="mb-4 p-4 bg-primary-500/20 border-2 border-primary-400/50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🛒</span>
                            <div>
                              <span className="font-semibold text-white">{getTotalItems()} {t.scanner.productsInCart}</span>
                              <div className="text-xs text-gray-300 mt-1">
                                {cart.map(item => `${item.productName} x${item.quantity}`).join(', ')}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowConfirmation(true)}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-all duration-300"
                          >
                            {t.scanner.confirm} →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show macro categories if more than 8 products */}
                    {useMacroCategories && !selectedCategory ? (
                      <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{t.scanner.selectCategory}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {availableCategories.map(([key, category]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedCategory(key)}
                              className="p-4 sm:p-6 rounded-xl border-2 border-white/20 hover:border-primary-400 hover:bg-primary-500/10 bg-white/5 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            >
                              <div className="text-3xl sm:text-4xl mb-2">{category.emoji}</div>
                              <div className="font-semibold text-white text-sm">
                                {category.name.replace(/^[^\s]+\s/, '')}
                              </div>
                              <div className="text-xs text-gray-300 mt-1">
                                {getProductsByCategory(key).length} {t.scanner.products}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Show proceed button if cart has items */}
                        {cart.length > 0 && (
                          <div className="mt-6">
                            <button
                              onClick={() => setShowConfirmation(true)}
                              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105"
                            >
                              {t.scanner.proceedWith} {getTotalItems()} {t.scanner.products} →
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-white">
                            {selectedCategory 
                              ? macroCategories[selectedCategory as keyof typeof macroCategories]?.name 
                              : t.admin.scanner.selectProduct}
                          </h2>
                          {useMacroCategories && selectedCategory && (
                            <button
                              onClick={() => {
                                setSelectedCategory('')
                                setSearchFilter('')
                              }}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap"
                            >
                              {t.scanner.otherCategories}
                            </button>
                          )}
                        </div>

                        {/* Search input field */}
                        <div className="mb-3 sm:mb-4">
                          <div className="relative">
                            <input
                              type="text"
                              value={searchFilter}
                              onChange={(e) => setSearchFilter(e.target.value)}
                              placeholder={language === 'ro' ? 'Caută produs...' : 'Search product...'}
                              className="w-full px-3 py-2 pl-10 sm:px-4 sm:py-3 sm:pl-12 bg-white/10 border-2 border-white/20 rounded-xl text-white text-sm sm:text-base placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                            />
                            <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchFilter && (
                              <button
                                onClick={() => setSearchFilter('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {getFilteredProducts().length === 0 ? (
                          <p className="text-gray-200">{searchFilter ? `Nessun prodotto trovato per "${searchFilter}"` : t.admin.scanner.noProducts}</p>
                        ) : (
                          <div className="space-y-2 sm:space-y-3">
                            {getFilteredProducts().map((product) => {
                              const cartItem = cart.find(item => item.productId === product.id)
                              const usageCount = productStats[product.id] || 0
                              
                              return (
                                <div
                                  key={product.id}
                                  className={`w-full p-3 sm:p-5 rounded-xl border-2 transition-all duration-300 ${
                                    cartItem
                                      ? 'border-primary-400 bg-primary-500/20 shadow-lg shadow-primary-500/30'
                                      : 'border-white/20 hover:border-white/40 hover:shadow-md bg-white/5'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-semibold text-white">{product.name}</div>
                                        {usageCount > 0 && (
                                          <span className="text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded-full">
                                            ⭐ {usageCount}
                                          </span>
                                        )}
                                      </div>
                                      {product.description && (
                                        <div className="text-sm text-gray-300 mt-1">{product.description}</div>
                                      )}
                                      {product.price && (
                                        <div className="text-sm font-bold text-primary-300 mt-2">
                                          {product.price.toFixed(2)} RON
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Quantity controls */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      {cartItem ? (
                                        <>
                                          <button
                                            onClick={() => updateCartQuantity(product.id, -1)}
                                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-all duration-200 text-lg sm:text-xl font-bold"
                                          >
                                            −
                                          </button>
                                          <span className="w-8 sm:w-10 text-center text-white font-bold text-base sm:text-lg">
                                            {cartItem.quantity}
                                          </span>
                                          <button
                                            onClick={() => updateCartQuantity(product.id, 1)}
                                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-green-500/20 hover:bg-green-500/40 text-white rounded-lg transition-all duration-200 text-lg sm:text-xl font-bold"
                                          >
                                            +
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => addToCart(product.id)}
                                          className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200"
                                        >
                                          + {t.scanner.add}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {error && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
                      </div>
                    )}

                    {(!useMacroCategories || selectedCategory) && (
                      <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
                        {cart.length > 0 ? (
                          <button
                            onClick={() => setShowConfirmation(true)}
                            className="flex-1 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105"
                          >
                            {t.scanner.confirm} {getTotalItems()} {t.scanner.products} →
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 py-4 bg-gray-500/50 text-gray-300 font-semibold rounded-xl cursor-not-allowed"
                          >
                            {t.scanner.selectProducts}
                          </button>
                        )}
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

                {/* Cart confirmation screen */}
                {mode === 'scan' && showConfirmation && (
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-xl sm:text-2xl">🛒</span>
                        {t.scanner.orderSummary}
                      </h2>
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="px-3 py-2 sm:px-4 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap"
                      >
                        {t.scanner.edit}
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="p-3 sm:p-4 bg-white/5 border-2 border-white/20 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-sm sm:text-base truncate">{item.productName}</div>
                              {item.price && (
                                <div className="text-xs sm:text-sm text-primary-300 mt-1">
                                  {item.price.toFixed(2)} RON × {item.quantity} = {(item.price * item.quantity).toFixed(2)} RON
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => updateCartQuantity(item.productId, -1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-all duration-200 text-base sm:text-lg font-bold"
                              >
                                −
                              </button>
                              <span className="w-7 sm:w-8 text-center text-white font-bold text-sm sm:text-base">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(item.productId, 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-green-500/20 hover:bg-green-500/40 text-white rounded-lg transition-all duration-200 text-base sm:text-lg font-bold"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500/30 hover:bg-red-500/50 text-red-200 rounded-lg transition-all duration-200 ml-1 sm:ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total summary */}
                    <div className="p-3 sm:p-4 bg-primary-500/20 border-2 border-primary-400/50 rounded-xl mb-4 sm:mb-6">
                      <div className="flex justify-between items-center text-white">
                        <span className="font-semibold text-sm sm:text-base">{t.scanner.totalProducts}</span>
                        <span className="text-xl sm:text-2xl font-bold">{getTotalItems()}</span>
                      </div>
                      {cart.some(item => item.price) && (
                        <div className="flex justify-between items-center text-primary-200 mt-2">
                          <span className="text-xs sm:text-sm">{t.scanner.totalPrice}</span>
                          <span className="font-bold text-sm sm:text-base">
                            {cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)} RON
                          </span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="mb-3 sm:mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-3 sm:px-5 sm:py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono break-all">{error}</pre>
                      </div>
                    )}

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={handleRegisterCart}
                        disabled={cart.length === 0 || processing}
                        className="flex-1 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {processing ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {t.scanner.registering}
                          </span>
                        ) : (
                          `✓ ${t.scanner.confirmProducts} ${getTotalItems()} ${t.scanner.products}`
                        )}
                      </button>
                      <button
                        onClick={resetScanner}
                        disabled={processing}
                        className="px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50"
                      >
                        {t.admin.scanner.cancel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reward redemption (redeem mode) */}
                {mode === 'redeem' && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{t.admin.scanner.selectReward}</h2>
                    
                    {!card || !card.loyalty_state || Object.keys(card.loyalty_state).length === 0 ? (
                      <p className="text-gray-200">{t.admin.scanner.noRewards}</p>
                    ) : rules.filter(rule => {
                        const state = card.loyalty_state[rule.id]
                        return state && state.rewards > 0
                      }).length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-200 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
                        <span className="text-3xl sm:text-4xl mb-2 block">🎁</span>
                        {t.admin.scanner.noRewards}
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
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
                                className={`w-full text-left p-3 sm:p-5 rounded-xl border-2 transition-all duration-300 ${
                                  selectedRule === rule.id
                                    ? 'border-yellow-400 bg-yellow-500/20 shadow-lg shadow-yellow-500/30 scale-[1.02]'
                                    : 'border-white/20 hover:border-white/40 hover:shadow-md bg-white/5'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white text-sm sm:text-base">{rule.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-300 mt-2 flex items-center gap-2">
                                      <span>{t.admin.scanner.availableRewards}:</span>
                                      <span className="font-bold text-yellow-600 text-base sm:text-lg">{state.rewards}</span>
                                    </div>
                                  </div>

                                  <div className="text-xl sm:text-2xl">🎁</div>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    )}

                    {error && (
                      <div className="mt-3 sm:mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-3 sm:px-5 sm:py-4 rounded-xl">
                        <pre className="text-xs whitespace-pre-wrap font-mono break-all">{error}</pre>
                      </div>
                    )}

                    <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
                      <button
                        onClick={handleRedeemReward}
                        disabled={!selectedRule || processing}
                        className="flex-1 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        {processing ? t.admin.scanner.redeeming : t.admin.scanner.confirmRedeem}
                      </button>
                      <button
                        onClick={resetScanner}
                        className="px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
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
                    <p className="text-yellow-200 text-base sm:text-lg mb-3">
                      {result.message}
                    </p>
                    {result.remaining_rewards !== undefined && (
                      <p className="text-xs sm:text-sm text-yellow-200 bg-yellow-500/20 rounded-xl p-3 sm:p-4 border border-yellow-400/30">
                        {t.admin.scanner.remainingRewards}: <span className="font-bold text-lg sm:text-xl">{result.remaining_rewards}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Show multi-item success message */}
                    {result.multipleItems && (
                      <div className="bg-green-500/20 border-2 border-green-400/50 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4">
                        <p className="text-green-200 text-base sm:text-lg font-semibold flex items-center gap-2">
                          <span className="text-xl sm:text-2xl">📦</span>
                          {result.totalItemsProcessed} {t.scanner.products} {t.scanner.success}
                        </p>
                      </div>
                    )}
                    
                    {result.reward_earned ? (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6">
                        <p className="text-xl sm:text-2xl font-bold text-yellow-300 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl">🎉</span>
                          {t.admin.scanner.rewardEarned}
                        </p>
                        <p className="text-yellow-200 text-base sm:text-lg mb-2">
                          {result.reward_earned.rule_name}
                        </p>
                        <p className="text-xs sm:text-sm text-yellow-200 bg-yellow-500/30 rounded-lg p-2 sm:p-3">
                          {result.reward_earned.reward_count} {result.reward_earned.reward_count === 1 ? t.scanner.rewardAvailableFor : t.scanner.rewardsAvailableFor}
                        </p>
                      </div>
                    ) : result.milestone_reached ? (
                      <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-400/50 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6">
                        <p className="text-xl sm:text-2xl font-bold text-orange-300 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl">⭐</span>
                          {t.admin.scanner.milestoneReached}
                        </p>
                        <p className="text-orange-200 text-base sm:text-lg">
                          {result.milestone_reached.message}
                        </p>
                      </div>
                    ) : !result.multipleItems && (
                      <p className="text-green-200 text-base sm:text-lg mb-4 sm:mb-6 bg-green-500/20 rounded-xl p-3 sm:p-4 border border-green-400/30">
                        ✓ {t.admin.scanner.pointsAdded}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  className="w-full py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105"
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
