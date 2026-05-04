export default function StaticBackground() {
  return (
    <>
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900"></div>
      
      {/* Animated gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/50 via-blue-800/30 to-pink-800/40 animate-pulse" style={{ animationDuration: '8s' }}></div>
      
      {/* SVG Wave layers */}
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 800">
        <path fill="url(#wave1)" d="M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z" opacity="0.7">
          <animate attributeName="d" dur="20s" repeatCount="indefinite"
            values="M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z;
                    M0,280 C320,240 420,340 720,280 C1020,220 1120,320 1440,280 L1440,800 L0,800 Z;
                    M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z" />
        </path>
        <path fill="url(#wave2)" d="M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z" opacity="0.5">
          <animate attributeName="d" dur="15s" repeatCount="indefinite"
            values="M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z;
                    M0,350 C360,300 540,400 900,350 C1260,300 1440,400 1440,350 L1440,800 L0,800 Z;
                    M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z" />
        </path>
        <path fill="url(#wave3)" d="M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z" opacity="0.4">
          <animate attributeName="d" dur="25s" repeatCount="indefinite"
            values="M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z;
                    M0,460 C400,420 640,490 1000,460 C1360,430 1440,500 1440,460 L1440,800 L0,800 Z;
                    M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z" />
        </path>
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5"/>
          </linearGradient>
          <linearGradient id="wave3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4"/>
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}
