import { describe, expect, it } from 'vitest'

import { appOrigin, buildJobShareUrl, buildShareTargets } from './shareLinks'

const JOB_ID = '0f4c1a2e-9b3d-4c7a-8e15-2d6f7b8c9a01'

describe('appOrigin', () => {
  it('is the primary www production origin', () => {
    expect(appOrigin).toBe('https://www.auxhr.com')
  })
})

describe('buildJobShareUrl', () => {
  it('builds the public job path on the canonical origin', () => {
    expect(buildJobShareUrl(JOB_ID)).toBe(
      `https://www.auxhr.com/job/postedjob/${JOB_ID}`,
    )
  })

  it('encodes the job id', () => {
    expect(buildJobShareUrl('a b/c')).toBe(
      'https://www.auxhr.com/job/postedjob/a%20b%2Fc',
    )
  })
})

describe('buildShareTargets', () => {
  const url = 'https://www.auxhr.com/job/postedjob/abc'
  const title = 'Senior Sales Executive at Acme & Co'
  const targets = buildShareTargets(url, title)

  it('encodes the shared url for every network', () => {
    const encoded = encodeURIComponent(url)

    expect(targets.facebook).toContain(encoded)
    expect(targets.x).toContain(encoded)
    expect(targets.linkedin).toContain(encoded)
    expect(targets.whatsapp).toContain(encodeURIComponent(url))
  })

  it('uses the current x and linkedin endpoints', () => {
    expect(targets.x).toContain('x.com/intent/post')
    expect(targets.x).not.toContain('twitter.com/share')
    expect(targets.linkedin).toContain('linkedin.com/sharing/share-offsite/')
    expect(targets.linkedin).not.toContain('shareArticle')
  })

  it('pre-fills the x post with the job title', () => {
    expect(targets.x).toContain(`text=${encodeURIComponent(title)}`)
  })

  it('puts the url last in the whatsapp message so it linkifies', () => {
    expect(targets.whatsapp).toBe(
      `https://wa.me/?text=${encodeURIComponent(
        `${title} ${url}?source=whatsapp`,
      )}`,
    )
  })

  it('tags each network link with its own source', () => {
    expect(targets.facebook).toContain(
      encodeURIComponent(`${url}?source=facebook`),
    )
    expect(targets.x).toContain(encodeURIComponent(`${url}?source=x`))
    expect(targets.linkedin).toContain(
      encodeURIComponent(`${url}?source=linkedin`),
    )
    expect(targets.whatsapp).toContain(
      encodeURIComponent(`${url}?source=whatsapp`),
    )
  })
})
