import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminOrganization } from '@/features/admin/types'

import OrganizationDetail from './OrganizationDetail'

const mocks = vi.hoisted(() => ({
  fetchAdminOrganization: vi.fn(),
  fetchAdminJobs: vi.fn(),
  changeAdminOrganizationOwner: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/features/admin/services/adminService', () => ({
  fetchAdminOrganization: mocks.fetchAdminOrganization,
  fetchAdminJobs: mocks.fetchAdminJobs,
  changeAdminOrganizationOwner: mocks.changeAdminOrganizationOwner,
  verifyAdminOrganization: vi.fn(),
  rejectAdminOrganization: vi.fn(),
  deleteAdminOrganization: vi.fn(),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: mocks.notify }))

const organization: AdminOrganization = {
  id: 'org-1',
  name: 'Acme Ltd',
  status: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  owner: {
    id: 'u-1',
    firstName: 'Olu',
    lastName: 'Owner',
    email: 'olu@acme.com',
  },
  members: [
    {
      id: 'm-1',
      userId: 'u-1',
      organizationId: 'org-1',
      workEmail: 'olu@acme.com',
      role: 'owner',
      createdAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: 'u-1',
        firstName: 'Olu',
        lastName: 'Owner',
        email: 'olu@acme.com',
      },
    },
    {
      id: 'm-2',
      userId: 'u-2',
      organizationId: 'org-1',
      workEmail: 'nia@acme.com',
      role: 'member',
      createdAt: '2026-01-02T00:00:00.000Z',
      user: {
        id: 'u-2',
        firstName: 'Nia',
        lastName: 'Next',
        email: 'nia@acme.com',
      },
    },
  ],
  ownershipTransfers: [],
  activeSubscription: null,
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/organizations/org-1']}>
      <Routes>
        <Route
          path="/organizations/:organizationId"
          element={<OrganizationDetail />}
        />
      </Routes>
    </MemoryRouter>,
  )

const openDrawer = async () =>
  fireEvent.click(await screen.findByRole('button', { name: 'Change creator' }))

describe('OrganizationDetail — changing the creator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchAdminOrganization.mockResolvedValue(organization)
    mocks.fetchAdminJobs.mockResolvedValue({ jobs: [], total: 0 })
  })

  it('offers teammates only, and needs both a person and a reason', async () => {
    renderPage()
    await openDrawer()

    expect(screen.getByRole('radio', { name: 'Nia Next' })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: 'Olu Owner' })).toBeNull()

    const confirm = screen
      .getAllByRole('button', { name: 'Change creator' })
      .at(-1) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: 'Nia Next' }))
    expect(confirm.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Why is the creator changing?'), {
      target: { value: '  Founder left.  ' },
    })
    expect(confirm.disabled).toBe(false)
  })

  it('saves the change and reloads the page', async () => {
    mocks.changeAdminOrganizationOwner.mockResolvedValue({})
    renderPage()
    await openDrawer()
    fireEvent.click(screen.getByRole('radio', { name: 'Nia Next' }))
    fireEvent.change(screen.getByLabelText('Why is the creator changing?'), {
      target: { value: 'Founder left.' },
    })
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Change creator' }).at(-1)!,
    )

    await waitFor(() =>
      expect(mocks.changeAdminOrganizationOwner).toHaveBeenCalledWith('org-1', {
        newOwnerUserId: 'u-2',
        reason: 'Founder left.',
      }),
    )
    await waitFor(() =>
      expect(mocks.fetchAdminOrganization).toHaveBeenCalledTimes(2),
    )
  })

  it('warns that an active plan stays on the old card', async () => {
    mocks.fetchAdminOrganization.mockResolvedValue({
      ...organization,
      activeSubscription: { planName: 'Pro', nextPaymentDate: null },
    })
    renderPage()
    await openDrawer()

    expect(
      screen.getByText(/Pro stays on the previous creator's card/),
    ).toBeTruthy()
  })

  it('explains when there is nobody to pick', async () => {
    mocks.fetchAdminOrganization.mockResolvedValue({
      ...organization,
      members: [organization.members![0]!],
    })
    renderPage()
    await openDrawer()

    expect(screen.getByText(/has no other teammates/)).toBeTruthy()
  })

  it('shows past changes', async () => {
    mocks.fetchAdminOrganization.mockResolvedValue({
      ...organization,
      ownershipTransfers: [
        {
          id: 't-1',
          fromName: 'Ada Former',
          toName: 'Olu Owner',
          reason: 'Founder left.',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    })
    renderPage()

    expect(await screen.findByText(/Ada Former to Olu Owner/)).toBeTruthy()
    expect(screen.getByText(/Founder left\./)).toBeTruthy()
  })
})
