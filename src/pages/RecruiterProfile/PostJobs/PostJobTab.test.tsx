import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PostJobTab from './PostJobTab'

const { jobQueryMock } = vi.hoisted(() => ({ jobQueryMock: vi.fn() }))

vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: (...args: unknown[]) => jobQueryMock(...args),
}))

vi.mock('./PostJob', () => ({
  default: ({ jobId }: { jobId?: string }) => (
    <p>Details step for {jobId ?? 'a new job'}</p>
  ),
}))

vi.mock('./AiConfig/AiConfig', () => ({
  default: () => <p>Screening step</p>,
}))

vi.mock('./ReviewStep/ReviewStep', () => ({
  ReviewStep: ({ jobId }: { jobId: string }) => <p>Review step {jobId}</p>,
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/recruiterDashboard/postjob" element={<PostJobTab />} />
        <Route
          path="/recruiterDashboard/postjob/:jobId"
          element={<PostJobTab step="screening" />}
        />
        <Route
          path="/recruiterDashboard/postjob/:jobId/details"
          element={<PostJobTab step="details" />}
        />
        <Route
          path="/recruiterDashboard/postjob/:jobId/review"
          element={<PostJobTab step="review" />}
        />
      </Routes>
    </MemoryRouter>,
  )

const currentStep = () =>
  screen
    .getByRole('navigation', { name: 'Post a job progress' })
    .querySelector('[aria-current="step"]')?.textContent

describe('PostJobTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jobQueryMock.mockReturnValue({
      data: { data: { job: { role: { name: 'product designer' } } } },
    })
  })

  it('opens a new job on Job details', () => {
    renderAt('/recruiterDashboard/postjob')
    expect(screen.getByText('Details step for a new job')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Post a job' })).toBeTruthy()
    expect(currentStep()).toContain('Job details')
    expect(jobQueryMock).toHaveBeenCalledWith(undefined, { skip: true })
  })

  it('shows the screening step with the role in the subtitle', () => {
    renderAt('/recruiterDashboard/postjob/job-1')
    expect(screen.getByText('Screening step')).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        name: 'How should applicants be screened?',
      }),
    ).toBeTruthy()
    expect(
      screen.getByText(/^Product Designer · Turn on the steps/),
    ).toBeTruthy()
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText(
        'AI Configuration',
      ),
    ).toBeTruthy()
    expect(currentStep()).toContain('AI Configuration')
  })

  it('edits the details of a saved job', () => {
    renderAt('/recruiterDashboard/postjob/job-1/details')
    expect(screen.getByText('Details step for job-1')).toBeTruthy()
  })

  it('moves between the steps of a saved job from the stepper', () => {
    renderAt('/recruiterDashboard/postjob/job-1/review')
    expect(screen.getByText('Review step job-1')).toBeTruthy()
    expect(screen.getByText('Check everything, then publish.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /ai configuration/i }))
    expect(screen.getByText('Screening step')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /job details/i }))
    expect(screen.getByText('Details step for job-1')).toBeTruthy()
  })

  it('does not let a new job jump ahead', () => {
    renderAt('/recruiterDashboard/postjob')
    expect(
      screen.queryByRole('button', { name: /ai configuration/i }),
    ).toBeNull()
  })
})
