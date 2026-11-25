import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TalentJobDetail from './TalentJobDetail'

const { jobMock, applyMock, payMock, profileMock, assessmentMock } = vi.hoisted(
  () => ({
    jobMock: vi.fn(),
    applyMock: vi.fn(),
    payMock: vi.fn(),
    profileMock: vi.fn(),
    assessmentMock: vi.fn(),
  }),
)

vi.mock('@/features/pre-assessment/hooks', () => ({
  usePreAssessment: () => assessmentMock(),
}))

vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: () => jobMock(),
  useApplyToJobMutation: () => [applyMock, { isLoading: false }],
  usePayComparisonQuery: () => payMock(),
  useSaveJobMutation: () => [vi.fn(), { isLoading: false }],
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => profileMock(),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

const JOB = {
  id: 'job1',
  status: 'active',
  role: { name: 'Product Designer' },
  createdAt: new Date().toISOString(),
  requirements: '<ul><li>3+ years designing apps</li><li>A portfolio</li></ul>',
  skills: ['Figma'],
  experienceLevel: '4-6 years',
  employmentType: 'full_time',
  workMode: ['hybrid'],
  locationCity: 'Lekki',
  locationState: 'Lagos',
  minSalary: 300000,
  maxSalary: 380000,
  currency: 'NGN',
  compensationPeriod: 'monthly',
  closesAt: '2026-11-24',
  hasApplied: false,
  isSaved: false,
  screening: [
    { key: 'skills_test', questionCount: null, minutes: 10 },
    { key: 'problem_solving', questionCount: 8, minutes: 11 },
  ],
  organization: { name: 'Kosana Tech Ltd' },
  company: { mission: 'Payment tools for small shops', staffSize: '51–200' },
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/talentDashboard/job/job1']}>
      <Routes>
        <Route
          path="/talentDashboard/job/:jobId"
          element={<TalentJobDetail />}
        />
        <Route
          path="/talentDashboard/applications/:id/sent"
          element={<p>sent page</p>}
        />
        <Route
          path="/talentDashboard/applications/:id"
          element={<p>pipeline page</p>}
        />
        <Route path="/talentDashboard/talentQuiz" element={<p>quiz page</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('talent job page', () => {
  afterEach(cleanup)

  beforeEach(() => {
    jobMock.mockReturnValue({ data: { data: { job: JOB } }, isLoading: false })
    payMock.mockReturnValue({
      data: {
        available: true,
        count: 12,
        low: 250000,
        middle: 340000,
        high: 400000,
        area: 'Lagos',
        job: {
          minSalary: 300000,
          maxSalary: 380000,
          currency: 'NGN',
          compensationPeriod: 'monthly',
        },
      },
    })
    profileMock.mockReturnValue({
      profile: {
        cvFileName: 'Amaka_CV.pdf',
        cvUploadedAt: '2026-10-12T00:00:00Z',
      },
    })
    assessmentMock.mockReturnValue({
      assessment: { status: 'completed', hasValidScore: true },
      isLoading: false,
    })
    applyMock.mockReset()
  })

  it('shows the role, its tags, requirements, the company, screening and pay', () => {
    renderPage()

    expect(screen.getByText('Mid-level (4–6 years)')).toBeTruthy()
    expect(screen.getByText('Closes 24 Nov')).toBeTruthy()
    expect(screen.getByText('3+ years designing apps')).toBeTruthy()
    expect(
      screen.getByText('Payment tools for small shops · 51–200 staff'),
    ).toBeTruthy()
    expect(screen.getByText('Problem-solving test · 11 min')).toBeTruthy()
    expect(
      screen.getByText(
        /Around the middle for similar Product Designer jobs in Lagos/,
      ).textContent,
    ).toContain('(₦250k–₦400k, based on 12 jobs)')
  })

  it('applies with a trimmed note and opens the sent page', async () => {
    applyMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { application: { id: 'app1' } } }),
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }))
    fireEvent.change(screen.getByLabelText(/Short note to Kosana Tech Ltd/), {
      target: { value: '  I built a merchant app.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }))

    await waitFor(() => expect(screen.getByText('sent page')).toBeTruthy())
    expect(applyMock).toHaveBeenCalledWith({
      jobId: 'job1',
      note: 'I built a merchant app.',
    })
  })

  it('never applies without a CV on the profile', () => {
    profileMock.mockReturnValue({ profile: { cvFileName: null } })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }))

    expect(applyMock).not.toHaveBeenCalled()
    expect(screen.getByText(/before applying/)).toBeTruthy()
  })

  it('sends a talent without a pre-assessment score to take it instead of applying', () => {
    assessmentMock.mockReturnValue({
      assessment: { status: 'pending', hasValidScore: false },
      isLoading: false,
    })
    renderPage()

    expect(screen.queryByRole('button', { name: 'Apply now' })).toBeNull()
    expect(
      screen.getByText(/Take the pre-assessment once to apply/),
    ).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Take your pre-assessment' }),
    )
    expect(screen.getByText('quiz page')).toBeTruthy()
  })

  it('points to the pre-assessment when the server says it is still needed', async () => {
    applyMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { error: { code: 'PRE_ASSESSMENT_REQUIRED', message: 'x' } },
        }),
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'pre-assessment' })).toBeTruthy(),
    )
  })

  it('names the first test after the skills test as the next step', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Apply now' }))

    expect(
      screen.getByText(
        /After you apply you'll take a 11-minute problem-solving test/,
      ),
    ).toBeTruthy()
  })

  it('sends someone who already applied to their application instead', () => {
    jobMock.mockReturnValue({
      data: {
        data: { job: { ...JOB, hasApplied: true, applicationId: 'app1' } },
      },
      isLoading: false,
    })
    renderPage()

    expect(screen.queryByRole('button', { name: 'Apply now' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'View application' }))
    expect(screen.getByText('pipeline page')).toBeTruthy()
  })
})
