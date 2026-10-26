import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import CompanyAssessments from './CompanyAssessments'

vi.mock('./CompanyAssessmentTest', () => ({
  default: ({
    type,
    submitted,
    jobId,
  }: {
    type: string
    submitted?: boolean
    jobId: string
  }) => (
    <div data-testid={`test-${type}`}>
      {jobId}:{submitted ? 'done' : 'open'}
    </div>
  ),
}))

describe('CompanyAssessments (job page section)', () => {
  it('shows nothing before the candidate has applied', () => {
    const { container } = render(
      <CompanyAssessments jobId="job-1" application={null} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('offers both tests once applied, marking the ones already submitted', () => {
    render(
      <CompanyAssessments
        jobId="job-1"
        application={{
          id: 'app-1',
          problemSolvingSubmitted: true,
          cultureFitSubmitted: false,
        }}
      />,
    )
    expect(screen.getByTestId('test-problem-solving').textContent).toBe(
      'job-1:done',
    )
    expect(screen.getByTestId('test-culture-fit').textContent).toBe(
      'job-1:open',
    )
  })
})
