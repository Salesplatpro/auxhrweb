import useSWR from 'swr'

export type DisplayCurrency = 'NGN' | 'USD'

const GEO_TIMEOUT_MS = 1500

const fetchCountry = async (): Promise<string | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS)
  try {
    const res = await fetch('/api/geo', { signal: controller.signal })
    if (!res.ok) return null
    const body = (await res.json()) as { country?: string | null }
    return body.country ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Naira for visitors in Nigeria and dollars for everyone else. Billing is always in naira, so
 * anything unknown (no header, a slow or failed lookup, local dev) shows naira.
 */
export const useDisplayCurrency = (): {
  currency: DisplayCurrency
  isLoading: boolean
} => {
  const { data, isLoading } = useSWR('visitor-country', fetchCountry, {
    dedupingInterval: Infinity,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  })
  return { currency: data && data !== 'NG' ? 'USD' : 'NGN', isLoading }
}
