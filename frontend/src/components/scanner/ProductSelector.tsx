import { Product } from '@/lib/supabase'
import { CartItem, MACRO_CATEGORIES } from '@/types/scanner'

interface ProductSelectorProps {
  products: Product[]
  cart: CartItem[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onAddToCart: (productId: string) => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onProceedToConfirmation: () => void
  onCancel: () => void
  t: any
}

export default function ProductSelector({
  products,
  cart,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onUpdateQuantity,
  onProceedToConfirmation,
  onCancel,
  t
}: ProductSelectorProps) {
  // Group products by macro category
  const getProductsByCategory = (categoryKey: string) => {
    const category = MACRO_CATEGORIES[categoryKey]
    if (!category) return []
    
    return products.filter(product => {
      const type = product.metadata?.type?.toLowerCase()
      return type && category.types.includes(type)
    })
  }

  // Check if we should show macro categories (more than 8 products)
  const shouldShowMacroCategories = products.length > 8

  // Get available categories (categories that have products)
  const availableCategories = Object.entries(MACRO_CATEGORIES).filter(([key]) => 
    getProductsByCategory(key).length > 0
  )

  // Get total items in cart
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  // Get products to display based on category selection
  const displayProducts = shouldShowMacroCategories && selectedCategory 
    ? getProductsByCategory(selectedCategory) 
    : products

  return (
    <div>
      {/* Cart summary badge */}
      {cart.length > 0 && (
        <div className="mb-4 p-4 bg-primary-500/20 border-2 border-primary-400/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <span className="font-semibold text-white">{getTotalItems()} prodotti nel carrello</span>
                <div className="text-xs text-gray-300 mt-1">
                  {cart.map(item => `${item.productName} x${item.quantity}`).join(', ')}
                </div>
              </div>
            </div>
            <button
              onClick={onProceedToConfirmation}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-all duration-300"
            >
              Conferma →
            </button>
          </div>
        </div>
      )}

      {/* Show macro categories if more than 8 products */}
      {shouldShowMacroCategories && !selectedCategory ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-white">Seleziona Categoria</h2>
          <div className="grid grid-cols-2 gap-3">
            {availableCategories.map(([key, category]) => (
              <button
                key={key}
                onClick={() => onSelectCategory(key)}
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
          
          {/* Show proceed button if cart has items */}
          {cart.length > 0 && (
            <div className="mt-6">
              <button
                onClick={onProceedToConfirmation}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105"
              >
                Procedi con {getTotalItems()} prodotti →
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory 
                ? MACRO_CATEGORIES[selectedCategory]?.name 
                : t.admin.scanner.selectProduct}
            </h2>
            {shouldShowMacroCategories && selectedCategory && (
              <button
                onClick={() => onSelectCategory('')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all duration-300"
              >
                ← Altre categorie
              </button>
            )}
          </div>
          
          {displayProducts.length === 0 ? (
            <p className="text-gray-200">{t.admin.scanner.noProducts}</p>
          ) : (
            <div className="space-y-3">
              {displayProducts.map((product) => {
                const cartItem = cart.find(item => item.productId === product.id)
                return (
                  <div
                    key={product.id}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 ${
                      cartItem
                        ? 'border-primary-400 bg-primary-500/20 shadow-lg shadow-primary-500/30'
                        : 'border-white/20 hover:border-white/40 hover:shadow-md bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-300 mt-1">{product.description}</div>
                        )}
                        {product.price && (
                          <div className="text-sm font-bold text-primary-300 mt-2">
                            €{product.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        {cartItem ? (
                          <>
                            <button
                              onClick={() => onUpdateQuantity(product.id, -1)}
                              className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-all duration-200 text-xl font-bold"
                            >
                              −
                            </button>
                            <span className="w-10 text-center text-white font-bold text-lg">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              className="w-10 h-10 flex items-center justify-center bg-green-500/20 hover:bg-green-500/40 text-white rounded-lg transition-all duration-200 text-xl font-bold"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onAddToCart(product.id)}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-200"
                          >
                            + Aggiungi
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

      {(!shouldShowMacroCategories || selectedCategory) && (
        <div className="mt-8 flex gap-3">
          {cart.length > 0 ? (
            <button
              onClick={onProceedToConfirmation}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105"
            >
              Conferma {getTotalItems()} prodotti →
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-4 bg-gray-500/50 text-gray-300 font-semibold rounded-xl cursor-not-allowed"
            >
              Seleziona prodotti
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md"
          >
            {t.admin.scanner.cancel}
          </button>
        </div>
      )}
    </div>
  )
}
