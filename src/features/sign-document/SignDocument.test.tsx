import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignDocument } from './SignDocument'

const { fetchMock, signMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  signMock: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  fetchSigningDocument: fetchMock,
  signDocumentWithLink: signMock,
}))

const document = {
  companyName: 'Acme Ltd',
  companyLogoUrl: null,
  employeeName: 'Ada Obi',
  title: 'Offer letter',
  body: 'Dear Ada Obi,',
}

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={['/sign/abc']}>
        <Routes>
          <Route path="/sign/:token" element={<SignDocument />} />
        </Routes>
      </MemoryRouter>
    </SWRConfig>,
  )

describe('SignDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps Sign off until the name is typed and the box is ticked, then confirms', async () => {
    fetchMock.mockResolvedValue(document)
    signMock.mockResolvedValue({ fileName: 'offer.pdf', pdfBase64: 'JVBERg==' })
    renderPage()

    const sign = await screen.findByRole('button', { name: 'Sign' })
    expect(sign.hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('Type your full name'), {
      target: { value: 'Ada Obi' },
    })
    expect(sign.hasAttribute('disabled')).toBe(true)
    fireEvent.click(
      screen.getByLabelText('I agree to sign this document electronically'),
    )
    fireEvent.click(sign)

    expect(
      await screen.findByText('A copy has been emailed to you.'),
    ).toBeTruthy()
    expect(signMock).toHaveBeenCalledWith('abc', 'Ada Obi')
  })

  it('explains a link that expired or was already used', async () => {
    fetchMock.mockRejectedValue({ response: { status: 410 } })
    renderPage()

    expect(
      await screen.findByText(/This link has expired or was already used/),
    ).toBeTruthy()
  })
})
