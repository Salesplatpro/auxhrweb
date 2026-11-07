const MIN_MATCHES = 8
const MAX_MATCHES = 24

/** A stable number per user, so every screen shows the same count. */
export const matchTeaserCount = (userId?: string | null): number => {
  let hash = 0
  for (const char of userId ?? '') {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return MIN_MATCHES + (hash % (MAX_MATCHES - MIN_MATCHES + 1))
}
