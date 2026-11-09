import { Country } from 'country-state-city'

export type DialCountry = {
  iso: string
  name: string
  flag: string
  dial: string
}

export const DEFAULT_PHONE_COUNTRY = 'NG'

const PREFERRED_FOR_SHARED_DIAL: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '44': 'GB',
}

const DIALS_KEEPING_TRUNK_ZERO = new Set(['39', '378', '379'])

let dialCountries: DialCountry[] | null = null

export const getDialCountries = (): DialCountry[] => {
  if (!dialCountries) {
    dialCountries = Country.getAllCountries()
      .map((country) => ({
        iso: country.isoCode,
        name: country.name,
        flag: country.flag,
        dial: country.phonecode.replace(/\D/g, ''),
      }))
      .filter((country) => country.dial.length > 0)
  }
  return dialCountries
}

export const dialFor = (iso: string): string =>
  getDialCountries().find((country) => country.iso === iso)?.dial ?? ''

export type ParsedPhone = { iso: string; national: string }

export const parsePhone = (
  value: string | null | undefined,
  fallbackIso: string = DEFAULT_PHONE_COUNTRY,
): ParsedPhone => {
  const trimmed = (value ?? '').trim()
  if (!trimmed.startsWith('+')) return { iso: fallbackIso, national: trimmed }

  const digits = trimmed.replace(/\D/g, '')
  const matches = getDialCountries().filter((country) =>
    digits.startsWith(country.dial),
  )
  if (matches.length === 0) return { iso: fallbackIso, national: trimmed }

  const longest = Math.max(...matches.map((country) => country.dial.length))
  const best = matches.filter((country) => country.dial.length === longest)
  const dial = best[0].dial
  const chosen =
    best.find((country) => country.iso === fallbackIso) ??
    best.find((country) => country.iso === PREFERRED_FOR_SHARED_DIAL[dial]) ??
    best[0]

  return { iso: chosen.iso, national: digits.slice(longest) }
}

export const buildPhone = (iso: string, national: string): string => {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  return `+${dialFor(iso)}${digits}`
}

const groupDigits = (digits: string): string =>
  [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(' ')

export const phoneLeadingZeroMessage = (
  value: string | null | undefined,
): string | undefined => {
  if (!value?.trim().startsWith('+')) return undefined
  const { iso, national } = parsePhone(value)
  const dial = dialFor(iso)
  if (!national.startsWith('0') || DIALS_KEEPING_TRUNK_ZERO.has(dial)) {
    return undefined
  }
  return `Remove the first 0. After +${dial} it should read ${groupDigits(
    national.replace(/^0+/, ''),
  )}.`
}
