import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffMember } from '@/features/people/types'

import { DocumentsTab } from './DocumentsTab'

const { previewMock, sendDocumentMock } = vi.hoisted(() => ({
  previewMock: vi.fn(),
  sendDocumentMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffDocuments: () => ({ documents: [], isLoading: false }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    sendDocument: sendDocumentMock,
    resendDocument: vi.fn(),
    downloadDocument: vi.fn(),
    isSaving: false,
  }),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  previewStaffDocument: previewMock,
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  status: 'active',
} as StaffMember

const openTemplate = async (label: RegExp) => {
  render(
    <MemoryRouter>
      <DocumentsTab staff={staff} organizationId="org-1" />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'New document' }))
  fireEvent.click(screen.getByLabelText(label))
  return screen.getByRole('button', { name: 'Send for signing' })
}

describe('DocumentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks sending until pay is set up', async () => {
    previewMock.mockResolvedValue({
      title: 'Offer letter',
      body: 'Dear Ada Obi,',
      missing: ['pay'],
    })
    const send = await openTemplate(/Offer letter/)

    expect(await screen.findByText(/No pay set up yet/)).toBeTruthy()
    expect(send.hasAttribute('disabled')).toBe(true)
  })

  it('previews the document and confirms before sending', async () => {
    previewMock.mockResolvedValue({
      title: 'Confidentiality agreement',
      body: 'This confidentiality agreement is between Acme Ltd and Ada Obi.',
      missing: [],
    })
    sendDocumentMock.mockResolvedValue({ emailSent: true })
    const send = await openTemplate(/Confidentiality agreement/)

    expect(
      await screen.findByText(/This confidentiality agreement is between/),
    ).toBeTruthy()
    fireEvent.click(send)
    expect(screen.getByText('Ada will get an email to sign this.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(sendDocumentMock).toHaveBeenCalledWith(staff, 'nda')
  })
})
