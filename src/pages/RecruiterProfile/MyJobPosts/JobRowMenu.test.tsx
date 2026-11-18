import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

import { JobRowMenu } from './JobRowMenu'

const { deleteJobMock, activateJobPaymentMock } = vi.hoisted(() => ({
  deleteJobMock: vi.fn(),
  activateJobPaymentMock: vi.fn(),
}))

vi.mock('@/redux/api/recruiter', () => ({
  useUpdateJobMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteJobMutation: () => [deleteJobMock, { isLoading: false }],
  useActivateJobPaymentMutation: () => [activateJobPaymentMock],
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

const job = (overrides: Partial<RecruiterJob> = {}) =>
  ({
    id: 'job-1',
    role: { name: 'sales lead' },
    status: 'active',
    paymentStatus: null,
    aiConfigId: 'cfg-1',
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-03T00:00:00Z',
    ...overrides,
  } as RecruiterJob)

const openMenu = (value: RecruiterJob) => {
  render(
    <MemoryRouter>
      <JobRowMenu job={value} />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: /actions for/i }))
}

describe('JobRowMenu', () => {
  beforeEach(() => {
    deleteJobMock.mockReset()
    activateJobPaymentMock.mockReset()
  })

  it('deletes the job after the recruiter confirms', async () => {
    deleteJobMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    openMenu(job())

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete job' }))

    expect(deleteJobMock).toHaveBeenCalledWith('job-1')
  })

  it('offers a retry for a job whose payment failed', () => {
    activateJobPaymentMock.mockReturnValue({
      unwrap: () => new Promise(() => undefined),
    })
    openMenu(job({ status: 'pending_payment', paymentStatus: 'failed' }))

    fireEvent.click(screen.getByRole('menuitem', { name: 'Retry payment' }))

    expect(activateJobPaymentMock).toHaveBeenCalledWith('job-1')
  })

  it('offers to pay for a job that has not been paid for yet', () => {
    openMenu(job({ status: 'pending_payment', paymentStatus: null }))

    expect(screen.getByRole('menuitem', { name: 'Pay now' })).toBeTruthy()
  })
})
