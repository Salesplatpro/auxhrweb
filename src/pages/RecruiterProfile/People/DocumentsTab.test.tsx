import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffDocument, StaffMember } from '@/features/people/types'

import { DocumentsTab } from './DocumentsTab'

const mocks = vi.hoisted(() => ({
  documents: [] as StaffDocument[],
  previewMock: vi.fn(),
  saveDraft: vi.fn(),
  navigate: vi.fn(),
  setNotarization: vi.fn(),
  downloadDocument: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffDocuments: () => ({
    documents: mocks.documents,
    isLoading: false,
    hasError: false,
  }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    saveDraft: mocks.saveDraft,
    resendDocument: vi.fn(),
    downloadDocument: mocks.downloadDocument,
    retryCopy: vi.fn(),
    deleteDraft: vi.fn(),
    setNotarization: mocks.setNotarization,
    attachNotarizedScan: vi.fn(),
    downloadScan: vi.fn(),
    isSaving: false,
  }),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  previewStaffDocument: mocks.previewMock,
}))

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mocks.navigate,
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  email: 'ada@kosanatech.ng',
  status: 'active',
} as StaffMember

const doc = (overrides: Partial<StaffDocument>): StaffDocument => ({
  id: 'd-1',
  template: 'offer_letter',
  title: 'Offer letter',
  status: 'signed',
  displayStatus: 'signed',
  fields: null,
  createdAt: '2026-11-03T08:00:00Z',
  sentAt: '2026-11-03T09:00:00Z',
  openedAt: '2026-11-04T10:00:00Z',
  signedAt: '2026-11-04T10:30:00Z',
  declinedAt: null,
  signerName: 'Ada Obi',
  sentByName: 'Tunde Bakare',
  linkExpiresAt: null,
  needsNotarization: false,
  notarizedAt: null,
  notarizedScanName: null,
  notarizedByName: null,
  checkCode: null,
  copyStatus: 'done',
  ...overrides,
})

const renderTab = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentsTab staff={staff} organizationId="org-1" />
    </MemoryRouter>,
  )

const PREVIEW = {
  title: 'Offer letter',
  body: 'Dear Ada Obi,',
  missing: [] as string[],
  facts: {
    startDate: '2025-02-03',
    jobTitle: 'Product Designer',
    managerName: 'Tunde Bakare',
    monthlyPay: 'NGN 450,000',
  },
}

describe('DocumentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.documents = []
  })

  it('shows every status the way it is drawn', () => {
    mocks.documents = [
      doc({ id: '1', title: 'Offer letter' }),
      doc({
        id: '2',
        title: 'NDA',
        status: 'signed',
        displayStatus: 'to_notarize',
        needsNotarization: true,
      }),
      doc({
        id: '3',
        title: 'Work-ownership agreement',
        status: 'draft',
        displayStatus: 'draft',
        sentAt: null,
      }),
      doc({
        id: '4',
        title: 'Pay agreement',
        status: 'declined',
        displayStatus: 'declined',
        declinedAt: '2026-11-02T10:00:00Z',
      }),
      doc({
        id: '5',
        title: 'Sent one',
        status: 'sent',
        displayStatus: 'sent',
        signedAt: null,
      }),
    ]
    renderTab()
    for (const label of [
      'Signed',
      'To notarize',
      'Draft',
      'Declined',
      'Sent',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('5 documents · 2 signed')).toBeTruthy()
  })

  it('opens the history of a signed document with a download button', () => {
    mocks.documents = [doc({})]
    renderTab()
    fireEvent.click(screen.getByRole('button', { name: /Offer letter/ }))
    expect(screen.getByText('Offer letter · history')).toBeTruthy()
    expect(
      screen.getByText('Tunde Bakare sent it to ada@kosanatech.ng'),
    ).toBeTruthy()
    expect(screen.getByText('Ada opened the link')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Download signed copy' }),
    )
    expect(mocks.downloadDocument).toHaveBeenCalled()
  })

  it('shows the notarization panel with the uploaded scan', () => {
    mocks.documents = [
      doc({
        title: 'Non-disclosure agreement',
        template: 'nda',
        displayStatus: 'notarized',
        needsNotarization: true,
        notarizedAt: '2026-11-09T10:00:00Z',
        notarizedScanName: 'nda_notarized.pdf',
        notarizedByName: 'Tunde Bakare',
      }),
    ]
    renderTab()
    fireEvent.click(
      screen.getByRole('button', { name: /Non-disclosure agreement/ }),
    )
    expect(
      screen.getByText('Non-disclosure agreement · notarization'),
    ).toBeTruthy()
    expect(screen.getByText('nda_notarized.pdf')).toBeTruthy()
    expect(
      screen.getByText('Scan uploaded by Tunde Bakare on 9 Nov 2026'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy()
    expect(screen.getByText('Replace scan')).toBeTruthy()
  })

  it('fills the new document form from the preview, shows what the letter will say, then saves a draft', async () => {
    mocks.previewMock.mockResolvedValue(PREVIEW)
    mocks.saveDraft.mockResolvedValue({
      document: { id: 'd-9' },
      preview: PREVIEW,
    })
    renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'New document' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose a template' }))
    fireEvent.click(screen.getByText('Offer letter'))

    expect(await screen.findByDisplayValue('Product Designer')).toBeTruthy()
    expect(screen.getByDisplayValue('2025-02-03')).toBeTruthy()
    expect(screen.getByDisplayValue('NGN 450,000')).toBeTruthy()
    expect(
      screen.getByText('Offer letter for Ada Obi, Product Designer'),
    ).toBeTruthy()
    expect(
      screen.getByText('Starts 3 Feb 2025, reports to Tunde Bakare'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await waitFor(() =>
      expect(mocks.saveDraft).toHaveBeenCalledWith(staff, 'offer_letter', {
        startDate: '2025-02-03',
        jobTitle: 'Product Designer',
        managerName: 'Tunde Bakare',
      }),
    )
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith(
        '/recruiterDashboard/people/employees/s-1/documents/d-9',
      ),
    )
  })

  it('says when no pay is set up, on offer letters only', async () => {
    mocks.previewMock.mockResolvedValue({
      ...PREVIEW,
      missing: ['pay'],
      facts: { ...PREVIEW.facts, monthlyPay: null },
    })
    renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'New document' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose a template' }))
    fireEvent.click(screen.getByText('Offer letter'))
    expect(
      await screen.findByText(/No pay set up yet. Set up pay first/),
    ).toBeTruthy()
    expect(screen.getByText('Pay paragraph: no pay set up yet')).toBeTruthy()
    const box = screen.getByLabelText('Monthly pay') as HTMLInputElement
    expect(box.value).toBe('Not set up')
    expect(box.disabled).toBe(true)
  })

  it('opens the drawer on the draft named in the address', async () => {
    mocks.previewMock.mockResolvedValue(PREVIEW)
    mocks.documents = [
      doc({
        id: 'd-5',
        status: 'draft',
        displayStatus: 'draft',
        sentAt: null,
        fields: { jobTitle: 'Lead Designer' },
      }),
    ]
    renderTab('/?edit=d-5')
    expect(await screen.findByDisplayValue('Lead Designer')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.getByDisplayValue('2025-02-03')).toBeTruthy()
  })
})
