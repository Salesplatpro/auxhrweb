const quarterOfDate = (date: Date) => {
  const lagos = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
  }).format(date)
  const [year, month] = lagos.split('-').map(Number) as [number, number]
  return { year, number: Math.floor((month - 1) / 3) + 1 }
}

/** Matches the server, which works in Lagos time. */
export const currentQuarter = (now: Date = new Date()) => {
  const { year, number } = quarterOfDate(now)
  return `${year}-Q${number}`
}

/** The chosen quarter and the two either side, so a past or next quarter is one click away. */
export const nearbyQuarters = (quarter: string) => {
  const year = Number(quarter.slice(0, 4))
  const number = Number(quarter.slice(6))
  const index = year * 4 + (number - 1)
  return [-2, -1, 0, 1, 2].map((offset) => {
    const value = index + offset
    return `${Math.floor(value / 4)}-Q${(value % 4) + 1}`
  })
}
