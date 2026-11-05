import { describe, expect, it } from 'vitest'

import { withBlobError } from './blobError'
import { getErrorMessage } from './getErrorMessage'

const blobOf = (content: string) =>
  Object.assign(new Blob([content]), { text: async () => content })

const failure = (data: unknown) => Promise.reject({ response: { data } })

const failureFrom = async (request: Promise<unknown>) =>
  withBlobError(request).then(
    () => null,
    (error: unknown) => error,
  )

describe('withBlobError', () => {
  it('passes a successful response through', async () => {
    await expect(withBlobError(Promise.resolve('file'))).resolves.toBe('file')
  })

  it("surfaces the server's message from a blob error body", async () => {
    const body = blobOf(
      JSON.stringify({ error: { message: 'Still being prepared' } }),
    )
    const error = await failureFrom(failure(body))
    expect(getErrorMessage(error, 'fallback')).toBe('Still being prepared')
  })

  it('falls back when the blob is not JSON, such as a proxy error page', async () => {
    const error = await failureFrom(failure(blobOf('<html>524</html>')))
    expect(getErrorMessage(error, 'fallback')).toBe('fallback')
  })

  it('rethrows network errors with no response', async () => {
    const original = new Error('Network Error')
    await expect(withBlobError(Promise.reject(original))).rejects.toBe(original)
  })
})
