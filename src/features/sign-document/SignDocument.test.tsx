import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignDocument } from './SignDocument'

const { fetchMock, signMock, declineMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  signMock: vi.fn(),
  declineMock: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  fetchSigningDocument: fetchMock,
  signDocumentWithLink: signMock,
  declineDocumentWithLink: declineMock,
}))

const document = {
  companyName: 'Acme Ltd',
  companyLogoUrl: null,
  companyEmail: 'hello@acme.ng',
  employeeName: 'Ada Obi',
  title: 'Offer letter',
  dateLabel: '6 November 2026',
  body: 'Dear Ada Obi,\n\nWe are pleased to offer you the position.',
  signatory: 'Tunde Bakare, Head of People',
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

const fillAndSign = async () => {
  fireEvent.change(await screen.findByLabelText('Type your full name'), {
    target: { value: 'Ada Obi' },
  })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Sign' }))
}

describe('SignDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the whole document with its date and both signature lines', async () => {
    fetchMock.mockResolvedValue(document)
    renderPage()

    expect(await screen.findByText('Offer letter for Ada Obi')).toBeTruthy()
    expect(
      screen.getByText('Read the whole document, then sign at the bottom.'),
    ).toBeTruthy()
    expect(screen.getByText('6 November 2026')).toBeTruthy()
    expect(
      screen.getByText('We are pleased to offer you the position.'),
    ).toBeTruthy()
    expect(screen.getByText('Tunde Bakare, Head of People')).toBeTruthy()
    expect(screen.getByText('Ada Obi · Date')).toBeTruthy()
  })

  it('says the copy is on its way and hides Download when it is not stored yet', async () => {
    fetchMock.mockResolvedValue(document)
    signMock.mockResolvedValue({
      fileName: 'offer.pdf',
      pdfBase64: null,
      copyPending: true,
    })
    renderPage()
    await fillAndSign()

    expect(await screen.findByText(/on its way by email/)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Download signed copy' }),
    ).toBeNull()
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
      await screen.findByText('Signed. A copy has been emailed to you.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Download signed copy' }),
    ).toBeTruthy()
    expect(signMock).toHaveBeenCalledWith('abc', 'Ada Obi')
  })

  it('lets the employee decline after confirming', async () => {
    fetchMock.mockResolvedValue(document)
    declineMock.mockResolvedValue(undefined)
    renderPage()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Decline to sign' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => expect(declineMock).toHaveBeenCalledWith('abc'))
    expect(await screen.findByText('You declined to sign')).toBeTruthy()
  })

  it('explains a link that expired and offers to email the company', async () => {
    fetchMock.mockRejectedValue({
      response: {
        status: 410,
        data: {
          error: {
            details: {
              documentTitle: 'Offer letter',
              companyName: 'Acme Ltd',
              companyEmail: 'hello@acme.ng',
            },
          },
        },
      },
    })
    renderPage()

    expect(await screen.findByText('This link no longer works')).toBeTruthy()
    expect(
      screen.getByText(/Ask Acme Ltd to send your offer letter again/),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Email Acme Ltd' })).toBeTruthy()
  })

  it('still explains a link that no longer exists, without a company', async () => {
    fetchMock.mockRejectedValue({ response: { status: 404 } })
    renderPage()
    expect(await screen.findByText('This link no longer works')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Email/ })).toBeNull()
  })
})
