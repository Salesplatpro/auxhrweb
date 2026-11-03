import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/features/auth/services/httpClient'

import { Unsubscribe } from './Unsubscribe'

vi.mock('@/features/auth/services/httpClient', () => ({
  httpClient: { post: vi.fn() },
}))

const renderPage = (path = '/unsubscribe?token=abc.def') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Unsubscribe />
    </MemoryRouter>,
  )

describe('Unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks first, and does nothing just from opening the link', () => {
    renderPage()

    expect(screen.getByText('Stop reminder emails?')).toBeTruthy()
    expect(httpClient.post).not.toHaveBeenCalled()
  })

  it('unsubscribes when confirmed', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({})
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    expect(await screen.findByText("You're unsubscribed")).toBeTruthy()
    expect(httpClient.post).toHaveBeenCalledWith(
      '/email-preferences/unsubscribe',
      null,
      { params: { token: 'abc.def' } },
    )
  })

  it("shows the server's reason when a link is refused", async () => {
    vi.mocked(httpClient.post).mockRejectedValue({
      response: { data: { error: { message: "This link isn't valid" } } },
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    await waitFor(() =>
      expect(screen.getByText("This link isn't valid")).toBeTruthy(),
    )
  })

  it('explains a link with no token', () => {
    renderPage('/unsubscribe')

    expect(screen.getByText("This link isn't complete")).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
