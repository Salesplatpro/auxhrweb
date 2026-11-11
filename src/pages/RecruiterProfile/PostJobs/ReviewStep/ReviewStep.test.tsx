import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewStep } from './ReviewStep'

const {
  updateMock,
  generateMock,
  navigateMock,
  notifyMock,
  jobQueryMock,
  payMock,
  usageMock,
  profileMock,
} = vi.hoisted(() => ({
  updateMock: vi.fn(),
  generateMock: vi.fn(),
  navigateMock: vi.fn(),
  notifyMock: vi.fn(),
  jobQueryMock: vi.fn(),
  payMock: vi.fn(),
  usageMock: vi.fn(),
  profileMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/redux/api/recruiter', () => ({
  useUpdateJobMutation: () => [updateMock, { isLoading: false }],
  useGenerateCompanyQuestionsMutation: () => [generateMock],
  useSalaryComparisonQuery: () => ({ data: undefined, isError: false }),
}))
vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: () => jobQueryMock(),
}))
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: profileMock() }),
}))
vi.mock('@/features/organizations/hooks/useOrganizationUsage', () => ({
  useOrganizationUsage: () => ({ usage: usageMock() }),
}))
vi.mock('../../MyJobPosts/useJobPayment', () => ({
  useJobPayment: () => ({ payForJob: payMock, payingJobId: null }),
}))
vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const job = (overrides: Record<string, unknown> = {}) => ({
  id: 'job-1',
  status: 'draft',
  role: { id: 'role-1', name: 'product designer' },
  jobBrief: '<p>Own payments</p>',
  requirements: '<p>Figma</p>',
  experienceLevel: '4-6 years',
  workMode: ['hybrid'],
  locationCountry: 'Nigeria',
  locationState: 'Lagos',
  locationCity: 'Lekki',
  currency: 'NGN',
  minSalary: 300000,
  maxSalary: 380000,
  compensationPeriod: 'monthly',
  skills: ['Figma'],
  goals: ['Ship checkout'],
  department: 'Design',
  employmentType: 'full_time',
  closesAt: null,
  shareOptions: true,
  aiConfig: {
    id: 'cfg-1',
    minPrescreeningScore: 60,
    cvSimilarity: true,
    minCvSimilarityScore: 65,
    personalizedAssessment: true,
    noPersonalizedQuestions: 5,
    problemSolvingAssessment: true,
    noOfProblemSolvingQuestions: 6,
    cultureFitAssessment: true,
    noOfCultureFitQuestions: 5,
    personalityEvaluation: false,
  },
  ...overrides,
})

const withJob = (value: unknown) =>
  jobQueryMock.mockReturnValue({
    data: { data: { job: value } },
    isLoading: false,
  })

const resolves = (value: unknown) => ({ unwrap: () => Promise.resolve(value) })

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
    profileMock.mockReturnValue({
      activeOrganizationId: 'org-1',
      activeOrganization: { name: 'Kosana', companyValues: ['We ship'] },
    })
    usageMock.mockReturnValue({
      billingPlan: 'pro',
      meters: [{ key: 'job_listings', used: 3, limit: 10 }],
    })
    generateMock.mockReturnValue(resolves({}))
  })

  it('shows the job details and every screening step that is on', () => {
    renderReview()
    expect(screen.getByText('Product Designer')).toBeTruthy()
    expect(screen.getByText('Design')).toBeTruthy()
    expect(screen.getByText('Lekki, Lagos · Hybrid')).toBeTruthy()
    expect(screen.getByText('Full time')).toBeTruthy()
    expect(screen.getByText('No closing date')).toBeTruthy()
    expect(screen.getByText('₦300,000 – ₦380,000 / month')).toBeTruthy()
    expect(screen.getByText('Yes, mentioned on the post')).toBeTruthy()
    expect(screen.getByText('AI reads every CV')).toBeTruthy()
    expect(screen.getByText('6 questions · 8 min')).toBeTruthy()
    expect(screen.getAllByText('On')).toHaveLength(5)
    expect(
      screen.getByText('Uses 1 of your 7 remaining job posts on the Pro plan.'),
    ).toBeTruthy()
  })

  it('lists what is ready to publish', () => {
    profileMock.mockReturnValue({
      activeOrganization: { name: 'Kosana', companyValues: [] },
    })
    renderReview()
    expect(screen.getByText('Job details complete')).toBeTruthy()
    expect(screen.getByText('Salary range added')).toBeTruthy()
    expect(screen.getByText('5 screening steps on')).toBeTruthy()
    expect(
      screen.getByText('Company values added for culture-fit').textContent,
    ).toContain('(to do)')
  })

  it('writes the test questions, publishes, and opens the live page', async () => {
    updateMock.mockReturnValue(
      resolves({ data: { job: { status: 'active' } } }),
    )
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    expect(await screen.findByText('Publishing your job...')).toBeTruthy()
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/postjob/job-1/live',
        { state: { justPublished: true } },
      ),
    )
    expect(generateMock).toHaveBeenCalledWith({
      type: 'problem-solving',
      jobId: 'job-1',
      count: 6,
    })
    expect(generateMock).toHaveBeenCalledWith({
      type: 'culture-fit',
      jobId: 'job-1',
      count: 5,
    })
    expect(updateMock).toHaveBeenCalledWith({
      jobId: 'job-1',
      data: { status: 'active' },
    })
  })

  it('does not write questions again when re-publishing a closed job', async () => {
    withJob(job({ status: 'closed' }))
    updateMock.mockReturnValue(
      resolves({ data: { job: { status: 'active' } } }),
    )
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
    expect(generateMock).not.toHaveBeenCalled()
  })

  it('stays as a draft when the questions cannot be written', async () => {
    generateMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: { message: 'AI is busy' } } }),
    })
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: /publish job/i }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith('error', 'AI is busy'),
    )
    expect(updateMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('asks for payment when the plan needs it, and starts the payment', async () => {
    updateMock.mockReturnValue(
      resolves({ data: { job: { status: 'pending_payment' } } }),
    )
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
    expect(
      screen.getByRole('link', { name: 'Set up' }).getAttribute('href'),
    ).toBe('/recruiterDashboard/postjob/job-1')
  })

  it('links back to each step', () => {
    renderReview()
    const hrefs = screen
      .getAllByRole('link', { name: 'Edit' })
      .map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual([
      '/recruiterDashboard/postjob/job-1/details',
      '/recruiterDashboard/postjob/job-1',
    ])
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
