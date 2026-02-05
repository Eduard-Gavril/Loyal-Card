interface StampsVisualizationProps {
  currentStamps: number
  totalStamps: number
  rewardIcon?: string
  rewardName?: string
  size?: 'sm' | 'md' | 'lg'
  t: any
}

export default function StampsVisualization({
  currentStamps,
  totalStamps,
  rewardIcon = '🎁',
  rewardName,
  size = 'md',
  t
}: StampsVisualizationProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl'
  }

  const containerClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  }

  return (
    <div className="w-full">
      {rewardName && (
        <div className="text-center mb-3">
          <span className="text-2xl mr-2">{rewardIcon}</span>
          <span className="text-white font-medium">{rewardName}</span>
        </div>
      )}
      
      <div className={`flex flex-wrap justify-center ${containerClasses[size]}`}>
        {Array.from({ length: totalStamps }).map((_, index) => (
          <div
            key={index}
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 ${
              index < currentStamps
                ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-md shadow-primary-500/50'
                : 'bg-white/10 border border-white/20'
            }`}
          >
            {index < currentStamps ? (
              <span className="text-white">☕</span>
            ) : (
              <span className="text-white/30">○</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mt-3 text-white/70 text-sm">
        {currentStamps} / {totalStamps} {t.clientCard.stamps}
        {currentStamps >= totalStamps && (
          <span className="ml-2 text-green-400 font-medium">{t.clientCard.rewardUnlocked}</span>
        )}
      </div>
    </div>
  )
}
