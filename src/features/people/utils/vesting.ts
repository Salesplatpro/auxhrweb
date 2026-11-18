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

export type VestingStage = 'before-cliff' | 'vesting' | 'fully-owned'

export const vestingStage = (
  grant: VestingSchedule,
  today: string,
): VestingStage => {
  const owned = vestedSharesOn(grant, today)
  if (owned >= grant.shares) return 'fully-owned'
  return owned === 0 ? 'before-cliff' : 'vesting'
}

/** The next date more shares become theirs, and how many; null once all are owned. */
export const nextVest = (
  grant: VestingSchedule,
  today: string,
): { date: string; shares: number } | null => {
  const owned = vestedSharesOn(grant, today)
  if (owned >= grant.shares) return null
  for (let month = 1; month <= grant.vestingMonths; month++) {
    const date = addMonths(grant.grantedOn, month)
    if (date <= today) continue
    const shares = vestedSharesOn(grant, date) - owned
    if (shares > 0) return { date, shares }
  }
  return null
}

/** What the Add grant drawer promises: the first lot, the monthly lot and the end. */
export const vestingPreview = (grant: VestingSchedule) => {
  const firstMonth = Math.max(grant.cliffMonths, 1)
  const firstDate = addMonths(grant.grantedOn, firstMonth)
  return {
    firstDate,
    firstShares: vestedSharesOn(grant, firstDate),
    afterCliff: grant.cliffMonths > 0,
    monthlyShares:
      firstMonth < grant.vestingMonths
        ? Math.round(grant.shares / grant.vestingMonths)
        : 0,
    fullyOwnedDate: addMonths(grant.grantedOn, grant.vestingMonths),
  }
}
