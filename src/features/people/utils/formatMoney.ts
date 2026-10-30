export const formatMoney = (currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export const formatCount = (value: number) => value.toLocaleString('en-NG')
