interface ScanResultProps {
  success: boolean
  message: string
  onReset: () => void
  t: any
}

export default function ScanResult({
  success,
  message,
  onReset,
  t
}: ScanResultProps) {
  return (
    <div className="text-center py-8">
      <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
        success 
          ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/50' 
          : 'bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-500/50'
      }`}>
        <span className="text-5xl text-white">
          {success ? '✓' : '✗'}
        </span>
      </div>
      
      <h3 className={`text-2xl font-bold mb-3 ${success ? 'text-green-300' : 'text-red-300'}`}>
        {success ? t.admin.scanner.success : t.admin.scanner.error}
      </h3>
      
      <p className="text-white/80 text-lg mb-8 max-w-sm mx-auto">
        {message}
      </p>
      
      <button
        onClick={onReset}
        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border-2 border-white/30 transition-all duration-300 hover:border-white/50 hover:shadow-lg"
      >
        {t.admin.scanner.scanAnother}
      </button>
    </div>
  )
}
