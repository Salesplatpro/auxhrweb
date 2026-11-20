import { CommissionFrequency, CommissionPaidOn } from '../types'

export const PAID_ON_LABELS: Record<CommissionPaidOn, string> = {
  yearly_sales: 'Yearly sales',
  product_revenue: 'Product revenue',
  renewals: 'Renewals',
}

export const FREQUENCY_LABELS: Record<CommissionFrequency, string> = {
  monthly: 'Every month',
  quarterly: 'Every quarter',
  yearly: 'Every year',
}

export const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))
