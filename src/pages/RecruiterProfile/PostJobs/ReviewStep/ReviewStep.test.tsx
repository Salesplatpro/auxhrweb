import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewStep } from './ReviewStep'

const { updateMock, navigateMock, notifyMock, jobQueryMock, payMock } =
  vi.hoisted(() => ({
    updateMock: vi.fn(),
    navigateMock: vi.fn(),
    notifyMock: vi.fn(),
    jobQueryMock: vi.fn(),
    payMock: vi.fn(),
  }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/redux/api/recruiter', () => ({
  useUpdateJobMutation: () => [updateMock, { isLoading: false }],
}))
vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: () => jobQueryMock(),
}))
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { activeOrganization: { name: 'Acme' } } }),
}))
vi.mock('../../MyJobPosts/useJobPayment', () => ({
  useJobPayment: () => ({
    payForJob: payMock,
    payingJobId: null,
    canPay: vi.fn(),
  }),
}))
vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const job = (overrides: Record<string, unknown> = {}) => ({
  id: 'job-1',
  status: 'draft',
  role: { id: 'role-1', name: 'engineer' },
  jobBrief: '<p>Build APIs</p>',
  requirements: '<p>Go</p>',
  workMode: ['remote'],
  skills: ['Go'],
  goals: [],
  aiConfig: {
    id: 'cfg-1',
    minPrescreeningScore: 60,
    cvSimilarity: true,
    minCvSimilarityScore: 65,
    personalizedAssessment: true,
    noPersonalizedQuestions: 5,
    personalityEvaluation: false,
  },
  ...overrides,
})

const withJob = (value: unknown) =>
  jobQueryMock.mockReturnValue({
    data: { data: { job: value } },
    isLoading: false,
  })

const renderReview = () =>
  render(
    <MemoryRouter>
      <ReviewStep jobId="job-1" />
    </MemoryRouter>,
  )

describe('ReviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    withJob(job())
  })

  it('shows the job post and the candidate journey', () => {
    renderReview()
    expect(screen.getByText('Engineer')).toBeTruthy()
    expect(screen.getByText('Build APIs')).toBeTruthy()
    expect(screen.getByText('5 written questions')).toBeTruthy()
    expect(screen.queryByText(/of 8 done/)).toBeNull()
  })

  it('publishes a job and goes to Job Posts when it goes live', async () => {
    updateMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { job: { status: 'active' } } }),
    })
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/myJobPosts',
      ),
    )
    expect(updateMock).toHaveBeenCalledWith({
      jobId: 'job-1',
      data: { status: 'active' },
    })
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      expect.stringMatching(/live/i),
    )
  })

  it('asks for payment when the plan needs it, and starts the payment', async () => {
    updateMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ data: { job: { status: 'pending_payment' } } }),
    })
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    expect(await screen.findByText(/pay to publish/i)).toBeTruthy()
    expect(navigateMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /pay and publish/i }))
    expect(payMock).toHaveBeenCalledWith('job-1')
  })

  it('offers payment straight away for a job already waiting for it', () => {
    withJob(job({ status: 'pending_payment' }))
    renderReview()
    expect(
      screen.getByRole('button', { name: /pay and publish/i }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: /publish job/i })).toBeNull()
  })

  it('shows the error and stays when publishing fails', async () => {
    updateMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: {
            error: {
              message:
                'This job cannot be activated until an AI configuration is added',
            },
          },
        }),
    })
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/AI configuration/),
      ),
    )
    expect(navigateMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /publish job/i })).toBeTruthy()
  })

  it('saves as a draft without publishing', () => {
    renderReview()
    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }))
    expect(updateMock).not.toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/recruiterDashboard/myJobPosts')
  })

  it('cannot publish before screening is set up', () => {
    withJob(job({ aiConfig: null }))
    renderReview()
    expect(
      screen
        .getByRole('button', { name: /publish job/i })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /set up screening/i }))
    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/postjob/job-1',
    )
  })

  it('links back to each step', () => {
    renderReview()
    fireEvent.click(screen.getByRole('button', { name: /edit details/i }))
    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/postjob/job-1/details',
    )
    fireEvent.click(screen.getByRole('button', { name: /edit screening/i }))
    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/postjob/job-1',
    )
  })

  it('says when the job is already live', () => {
    withJob(job({ status: 'active' }))
    renderReview()
    expect(screen.getByText(/this job is live/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /publish job/i })).toBeNull()
  })

  it('handles a job that could not be loaded', () => {
    jobQueryMock.mockReturnValue({ data: undefined, isLoading: false })
    renderReview()
    expect(screen.getByText(/couldn.t load this job/i)).toBeTruthy()
  })
})
