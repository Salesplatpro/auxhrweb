import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/features/auth/services/httpClient'
import { notify } from '@/utils/toastNotifications'

import { openScoutCandidateCv } from './scoutService'

vi.mock('@/features/auth/services/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

const blobOf = (content: string) =>
  Object.assign(new Blob([content]), { text: async () => content })

describe('openScoutCandidateCv', () => {
  let cvWindow: { close: ReturnType<typeof vi.fn>; location: { href: string } }

  beforeEach(() => {
    vi.clearAllMocks()
    cvWindow = { close: vi.fn(), location: { href: '' } }
    vi.spyOn(window, 'open').mockReturnValue(cvWindow as unknown as Window)
    URL.createObjectURL = vi.fn(() => 'blob:cv')
  })

  it('sends the new tab to the file', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: new Blob(['%PDF-']) })

    await openScoutCandidateCv('candidate-1')

    expect(cvWindow.location.href).toBe('blob:cv')
    expect(cvWindow.close).not.toHaveBeenCalled()
  })

  it("closes the tab and shows the server's reason when the CV can't open", async () => {
    vi.mocked(httpClient.get).mockRejectedValue({
      response: {
        data: blobOf(
          JSON.stringify({
            error: { message: "This CV file can't be opened." },
          }),
        ),
      },
    })

    await openScoutCandidateCv('candidate-1')

    expect(cvWindow.close).toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(
      'error',
      "This CV file can't be opened.",
    )
  })
})
