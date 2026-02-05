import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

interface QRCodeDisplayProps {
  clientId: string
  size?: number
}

export default function QRCodeDisplay({ clientId, size = 220 }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (clientId) {
      QRCode.toDataURL(clientId, {
        width: size,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      }).then(setQrDataUrl)
    }
  }, [clientId, size])

  if (!qrDataUrl) {
    return (
      <div 
        className="bg-white/20 rounded-2xl animate-pulse flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 blur-xl opacity-30 rounded-3xl"></div>
      <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
        <img 
          src={qrDataUrl} 
          alt="QR Code" 
          className="block"
          style={{ width: size, height: size }}
        />
      </div>
    </div>
  )
}
