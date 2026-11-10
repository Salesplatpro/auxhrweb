import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { JobStatusControl } from './JobStatusControl'

const { updateJobMock } = vi.hoisted(() => ({
  updateJobMock: vi.fn(),
}))

vi.mock('@/redux/api/recruiter', () => ({
  useUpdateJobMutation: () => [updateJobMock, { isLoading: false }],
}))

const renderControl = (
  status = 'suspended',
  aiConfigId: string | null = 'config-1',
) =>
  render(
    <MemoryRouter>
      <JobStatusControl jobId="job-1" status={status} aiConfigId={aiConfigId} />
    </MemoryRouter>,
  )

describe('JobStatusControl', () => {
  it('does not render a separate "Update Status" button', () => {
    renderControl()
    expect(screen.queryByText('Update Status')).toBeNull()
  })

  it('saves the new status immediately when a different option is selected, with no confirm step', async () => {
    updateJobMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    renderControl('suspended')

    const select = screen.getByRole('button', { name: /suspended/i })
    fireEvent.click(select)
    const activeOption = await screen.findByText('Active')
    fireEvent.click(activeOption)

    await waitFor(() => {
      expect(updateJobMock).toHaveBeenCalledWith({
        jobId: 'job-1',
        data: { status: 'active' },
      })
    })
  })

  it('shows the job as awaiting payment when activation is parked for payment', async () => {
    updateJobMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ data: { job: { status: 'pending_payment' } } }),
    })
    renderControl('draft')

    fireEvent.click(screen.getByRole('button', { name: /draft/i }))
    fireEvent.click(await screen.findByText('Active'))

    expect(await screen.findByText('Awaiting payment')).toBeTruthy()
  })

  it('reverts to the previous status if the update fails', async () => {
    updateJobMock.mockReturnValue({
      unwrap: () => Promise.reject(new Error('nope')),
    })
    renderControl('suspended')

    const select = screen.getByRole('button', { name: /suspended/i })
    fireEvent.click(select)
    const activeOption = await screen.findByText('Active')
    fireEvent.click(activeOption)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /suspended/i })).toBeTruthy()
    })
  })

  it('omits "Active" from the status options when aiConfigId is missing', () => {
    renderControl('draft', null)

    const select = screen.getByRole('button', { name: /draft/i })
    fireEvent.click(select)

    expect(screen.queryByText('Active')).toBeNull()
    expect(
      screen.getByText(
        'Add an AI screening configuration before activating this job.',
      ),
    ).toBeTruthy()
  })

  it('includes "Active" in the status options when aiConfigId is present', async () => {
    renderControl('draft', 'config-1')

    const select = screen.getByRole('button', { name: /draft/i })
    fireEvent.click(select)

    expect(await screen.findByText('Active')).toBeTruthy()
    expect(
      screen.queryByText(
        'Add an AI screening configuration before activating this job.',
      ),
    ).toBeNull()
  })

  it('does not offer a delete-job action', () => {
    renderControl()
    expect(screen.queryByText('Delete Job')).toBeNull()
    expect(screen.queryByText('Delete this job')).toBeNull()
  })
})
