import { CartItem } from '@/types/scanner'

interface CartConfirmationProps {
  cart: CartItem[]
  processing: boolean
  error: string
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemoveItem: (productId: string) => void
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
  t: any
}

export default function CartConfirmation({
  cart,
  processing,
  error,
  onUpdateQuantity,
  onRemoveItem,
  onConfirm,
  onBack,
  onCancel,
  t
}: CartConfirmationProps) {
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          {t.scanner.orderSummary}
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all duration-300"
        >
          {t.scanner.edit}
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div
            key={item.productId}
            className="p-4 bg-white/5 border-2 border-white/20 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-white">{item.productName}</div>
                {item.price && (
                  <div className="text-sm text-primary-300 mt-1">
                    €{item.price.toFixed(2)} × {item.quantity} = €{(item.price * item.quantity).toFixed(2)}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.productId, -1)}
                  className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-white rounded-lg transition-all duration-200 text-lg font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center text-white font-bold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.productId, 1)}
                  className="w-8 h-8 flex items-center justify-center bg-green-500/20 hover:bg-green-500/40 text-white rounded-lg transition-all duration-200 text-lg font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="w-8 h-8 flex items-center justify-center bg-red-500/30 hover:bg-red-500/50 text-red-200 rounded-lg transition-all duration-200 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="p-4 bg-primary-500/20 border-2 border-primary-400/50 rounded-xl mb-6">
        <div className="flex justify-between items-center text-white">
          <span className="font-semibold">{t.scanner.totalProducts}</span>
          <span className="text-2xl font-bold">{getTotalItems()}</span>
        </div>
        {cart.some(item => item.price) && (
          <div className="flex justify-between items-center text-primary-200 mt-2">
            <span>{t.scanner.totalPrice}</span>
            <span className="font-bold">
              €{getTotalPrice().toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
          <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={cart.length === 0 || processing}
          className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
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
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50"
        >
          {t.admin.scanner.cancel}
        </button>
      </div>
    </div>
  )
}
