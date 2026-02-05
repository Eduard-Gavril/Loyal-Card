interface LoyaltyProgressCardProps {
  ruleName: string
  rewardName: string
  rewardIcon?: string
  currentStamps: number
  stampsRequired: number
  rewardsEarned: number
  onCollectReward?: () => void
  t: any
}

export default function LoyaltyProgressCard({
  ruleName,
  rewardName,
  rewardIcon = '🎁',
  currentStamps,
  stampsRequired,
  rewardsEarned,
  onCollectReward,
  t
}: LoyaltyProgressCardProps) {
  const progressPercentage = Math.min((currentStamps / stampsRequired) * 100, 100)
  const hasRewards = rewardsEarned > 0

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{rewardIcon}</span>
          <div>
            <h3 className="font-semibold text-white">{ruleName}</h3>
            <p className="text-sm text-white/60">{rewardName}</p>
          </div>
        </div>
        {hasRewards && (
          <div className="bg-green-500/20 border border-green-400/50 rounded-full px-3 py-1">
            <span className="text-green-300 text-sm font-medium">
              🎁 {rewardsEarned} {t.clientCard?.rewardsAvailableLabel || t.card?.rewards || 'rewards'}
            </span>
          </div>
        )}
      </div>

      {/* Stamps visualization */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {Array.from({ length: stampsRequired }).map((_, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              index < currentStamps
                ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-md shadow-primary-500/50 scale-110'
                : 'bg-white/10 border border-white/20'
            }`}
          >
            {index < currentStamps ? (
              <span className="text-white text-sm">☕</span>
            ) : (
              <span className="text-white/30 text-xs">○</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
        {progressPercentage === 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 animate-pulse" />
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/60">
          {currentStamps} / {stampsRequired} {t.clientCard?.stamps || t.card?.stamps || 'stamps'}
        </span>
        <span className="text-white/60">
          {stampsRequired - currentStamps} {t.clientCard?.toNextReward || 'to next reward'}
        </span>
      </div>

      {/* Collect button */}
      {hasRewards && onCollectReward && (
        <button
          onClick={onCollectReward}
          className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
        >
          🎁 {t.clientCard?.collectReward || 'Collect Reward'}
        </button>
      )}
    </div>
  )
}
