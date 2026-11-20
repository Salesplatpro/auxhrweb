import { CommissionBand } from '../types'

export interface PayoutLine {
  inside: number
  ratePercent: number
  amount: number
}

const round = (value: number) => Math.round(value * 100) / 100

/** Each band pays its rate on the sales that fall inside it. */
export const commissionPayout = (bands: CommissionBand[], sales: number) => {
  const lines: PayoutLine[] = bands
    .map((band) => {
      const inside = Math.max(
        0,
        Math.min(sales, band.toAmount ?? Infinity) - band.fromAmount,
      )
      return {
        inside,
        ratePercent: band.ratePercent,
        amount: round((inside * band.ratePercent) / 100),
      }
    })
    .filter((line) => line.inside > 0)

  return { lines, total: round(lines.reduce((sum, l) => sum + l.amount, 0)) }
}
