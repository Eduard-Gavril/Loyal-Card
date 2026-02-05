import { RewardRule } from '@/lib/supabase'

interface RewardRedemptionProps {
  rewardRules: RewardRule[]
  selectedReward: RewardRule | null
  processing: boolean
  error: string
  onSelectReward: (reward: RewardRule) => void
  onRedeem: () => void
  onCancel: () => void
  t: any
}

export default function RewardRedemption({
  rewardRules,
  selectedReward,
  processing,
  error,
  onSelectReward,
  onRedeem,
  onCancel,
  t
}: RewardRedemptionProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="text-2xl">🎁</span>
        {t.admin.scanner.selectReward}
      </h2>
      
      <div className="space-y-3">
        {rewardRules.map((rule) => (
          <button
            key={rule.id}
            onClick={() => onSelectReward(rule)}
            className={`w-full text-left p-5 rounded-xl transition-all duration-300 ${
              selectedReward?.id === rule.id
                ? 'bg-primary-500/30 border-2 border-primary-400 shadow-lg shadow-primary-500/30'
                : 'bg-white/5 border-2 border-white/20 hover:bg-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <div className="font-semibold text-white text-lg">{rule.name}</div>
                  <div className="text-sm text-white/60">
                    {t.admin.scanner.requiredStamps}: {rule.buy_count}
                  </div>
                </div>
              </div>
              {selectedReward?.id === rule.id && (
                <span className="text-2xl">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl">
          <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onRedeem}
          disabled={!selectedReward || processing}
          className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {t.admin.scanner.processing}
            </span>
          ) : (
            t.admin.scanner.redeemReward
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
