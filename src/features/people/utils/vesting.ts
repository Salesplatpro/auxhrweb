interface VestingSchedule {
  shares: number
  grantedOn: string
  cliffMonths: number
  vestingMonths: number
}

const parts = (dateOnly: string) =>
  dateOnly.split('-').map(Number) as [number, number, number]

const addMonths = (dateOnly: string, months: number) => {
  const [year, month, day] = parts(dateOnly)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

const monthsElapsed = (grantedOn: string, onDate: string) => {
  const [fromYear, fromMonth] = parts(grantedOn)
  const [toYear, toMonth] = parts(onDate)
  const months = (toYear - fromYear) * 12 + (toMonth - fromMonth)
  return addMonths(grantedOn, months) <= onDate ? months : months - 1
}

export const vestedSharesOn = (grant: VestingSchedule, onDate: string) => {
  const months = monthsElapsed(grant.grantedOn, onDate)
  if (months < grant.cliffMonths || months <= 0) return 0
  const vestedMonths = Math.min(months, grant.vestingMonths)
  return Math.floor((grant.shares * vestedMonths) / grant.vestingMonths)
}

export const vestingDates = (grant: VestingSchedule) => ({
  cliffDate: addMonths(grant.grantedOn, grant.cliffMonths),
  fullyVestedDate: addMonths(grant.grantedOn, grant.vestingMonths),
})
