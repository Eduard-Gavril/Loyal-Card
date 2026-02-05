import { CameraPermission } from '@/types/scanner'

interface QRScannerProps {
  cameraPermission: CameraPermission
  onRequestPermission: () => void
  language: string
}

export default function QRScanner({ 
  cameraPermission, 
  onRequestPermission,
  language 
}: QRScannerProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-3 text-white flex items-center gap-2">
          <span className="text-4xl">📸</span>
          {language === 'ro' ? 'Încadrează codul QR' : 'Frame the QR Code'}
        </h2>
        <p className="text-gray-200">
          {language === 'ro' 
            ? 'Poziționează codul QR al clientului în cadru pentru a-l scana' 
            : 'Position the customer\'s QR code in the frame to scan it'}
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
          <p className="text-gray-300 mb-6">
            {language === 'ro' 
              ? 'Pentru a scana codurile QR, avem nevoie de acces la camera ta'
              : 'To scan QR codes, we need access to your camera'}
          </p>
          <button
            onClick={onRequestPermission}
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
          <p className="text-gray-300">
            {language === 'ro' ? 'Se solicită permisiunea...' : 'Requesting permission...'}
          </p>
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
  )
}
