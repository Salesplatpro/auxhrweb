export const formatMoney = (currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export const formatCount = (value: number) => value.toLocaleString('en-NG')

export const formatCurrency = (currency: string, amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
