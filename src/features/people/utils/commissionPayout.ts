import { CommissionTier } from '../types'

export const commissionPayout = (
  tiers: CommissionTier[],
  target: number,
  actual: number,
) => {
  if (target <= 0)
    return { attainmentPercent: null, tierIndex: null, payout: 0 }
  const attainmentPercent = (actual / target) * 100
  if (actual <= 0) return { attainmentPercent, tierIndex: null, payout: 0 }

  const tierIndex = tiers.findIndex(
    (tier) =>
      attainmentPercent >= tier.fromPercent &&
      (tier.toPercent === null || attainmentPercent < tier.toPercent),
  )
  const tier = tiers[tierIndex]
  if (!tier) return { attainmentPercent, tierIndex: null, payout: 0 }

  const payout = (actual * tier.ratePercent * (tier.boost ?? 1)) / 100
  return {
    attainmentPercent,
    tierIndex,
    payout: Math.round(payout * 100) / 100,
  }
}
