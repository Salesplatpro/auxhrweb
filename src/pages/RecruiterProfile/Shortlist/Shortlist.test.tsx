import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Shortlist } from './Shortlist'

const { useGetRecruiterShortlistQueryMock } = vi.hoisted(() => ({
  useGetRecruiterShortlistQueryMock: vi.fn(),
}))

vi.mock('../../../redux/api/recruiter', () => ({
  useGetRecruiterShortlistQuery: useGetRecruiterShortlistQueryMock,
  useGetCampaignNameQuery: () => ({ data: undefined, isLoading: false }),
}))

const { access } = vi.hoisted(() => ({
  access: { organizationId: 'org-1', canManagePeople: true },
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => access,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { activeOrganization: { name: 'Acme Ltd', departments: [] } },
  }),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({ addStaff: vi.fn(), isSaving: false }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffOptions: () => ({ options: [], isLoading: false }),
}))

const shortlisted = {
  id: 'app-1',
  jobId: 'job-1',
  status: 'shortlisted',
  createdAt: '2026-01-01T00:00:00.000Z',
  role: { name: 'data analyst' },
  talent: {
    id: 't-1',
    firstName: 'Kelechi',
    lastName: 'Okoro',
    email: 'kelechi@example.com',
  },
}

beforeEach(() => {
  access.canManagePeople = true
})

const renderShortlist = () =>
  render(
    <MemoryRouter>
      <Shortlist />
    </MemoryRouter>,
  )

describe('Shortlist (job-application shortlisting — not Scout data)', () => {
  it('renders the real `applications` response shape, not the old campaigns/scouts shape', () => {
    useGetRecruiterShortlistQueryMock.mockReturnValue({
      data: {
        data: {
          applications: [
            {
              id: 'app-1',
              jobId: 'job-1',
              status: 'shortlisted',
              createdAt: '2026-01-01T00:00:00.000Z',
              role: { name: 'software engineer' },
              talent: { firstName: 'Ada', lastName: 'Lovelace' },
            },
          ],
        },
      },
      isLoading: false,
    })
    renderShortlist()

    expect(screen.getByText('Ada Lovelace')).toBeTruthy()
    expect(screen.getByText('Software Engineer')).toBeTruthy()
    expect(screen.getByText('Shortlisted')).toBeTruthy()
  })

  it('shows an empty state when there are no shortlisted applications', () => {
    useGetRecruiterShortlistQueryMock.mockReturnValue({
      data: { data: { applications: [] } },
      isLoading: false,
    })
    renderShortlist()

    expect(screen.getByText('No shortlisted applications yet')).toBeTruthy()
  })

  it('never reads the old campaigns/scouts keys even if the backend happened to include them', () => {
    useGetRecruiterShortlistQueryMock.mockReturnValue({
      data: {
        data: {
          applications: [],
          campaigns: [{ job: { role: { name: 'ghost' } } }],
          scouts: [{ cvName: 'ghost.pdf' }],
        },
      },
      isLoading: false,
    })
    renderShortlist()

    expect(screen.queryByText('ghost')).toBeNull()
    expect(screen.queryByText('ghost.pdf')).toBeNull()
    expect(screen.getByText('No shortlisted applications yet')).toBeTruthy()
  })

  it('opens Add employee filled in from the applicant', () => {
    useGetRecruiterShortlistQueryMock.mockReturnValue({
      data: { data: { applications: [shortlisted] } },
      isLoading: false,
    })
    renderShortlist()

    fireEvent.click(screen.getByRole('button', { name: 'Add as employee' }))

    const dialog = screen.getByRole('dialog', { name: 'Add employee' })
    expect(
      (within(dialog).getByLabelText(/Full name/) as HTMLInputElement).value,
    ).toBe('Kelechi Okoro')
    expect(
      (within(dialog).getByLabelText(/Job title/) as HTMLInputElement).value,
    ).toBe('Data Analyst')
  })

  it('hides Add as employee from recruiters who cannot manage people', () => {
    access.canManagePeople = false
    useGetRecruiterShortlistQueryMock.mockReturnValue({
      data: { data: { applications: [shortlisted] } },
      isLoading: false,
    })
    renderShortlist()

    expect(screen.queryByRole('button', { name: 'Add as employee' })).toBeNull()
  })
})
