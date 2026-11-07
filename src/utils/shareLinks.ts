/**
 * Canonical public origin for links that leave the app — social share targets
 * and copied job links.
 *
 * Deliberately not window.location.origin: these URLs are consumed by third
 * parties, so a localhost origin yields a link that is dead the moment it is
 * pasted, and a Vercel preview origin sits behind deployment protection, so a
 * crawler fetching it gets a 401 and renders no preview card at all.
 *
 * Deliberately not configurable either: it must be the primary Vercel domain.
 * auxhr.com redirects here, so an apex origin sends crawlers through a
 * redirect whose og:url then points back at it — Facebook and LinkedIn treat
 * that as a circular redirect and render no card.
 *
 * Must stay in agreement with SITE_ORIGIN in api/job-page.ts and the og:url in
 * index.html.
 */
export const appOrigin = 'https://www.auxhr.com'

export const buildJobShareUrl = (jobId: string): string =>
  `${appOrigin}/job/postedjob/${encodeURIComponent(jobId)}`

export type ShareNetwork = 'facebook' | 'x' | 'linkedin' | 'whatsapp'

export const buildShareTargets = (
  url: string,
  title: string,
): Record<ShareNetwork, string> => {
  const tagged = (network: ShareNetwork) =>
    `${url}${url.includes('?') ? '&' : '?'}source=${network}`
  const encodedTitle = encodeURIComponent(title)

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      tagged('facebook'),
    )}`,
    x: `https://x.com/intent/post?url=${encodeURIComponent(
      tagged('x'),
    )}&text=${encodedTitle}`,
    // share-offsite is LinkedIn's current endpoint; the older shareArticle one
    // silently fails unless it is also passed mini=true.
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      tagged('linkedin'),
    )}`,
    // WhatsApp has no separate url param, and its linkifier only builds a
    // preview card when the URL is the last thing in the message.
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `${title} ${tagged('whatsapp')}`,
    )}`,
  }
}
