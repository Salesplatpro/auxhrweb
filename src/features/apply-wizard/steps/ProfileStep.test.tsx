import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileStep from './ProfileStep'

const { refetchMock, notifyMock } = vi.hoisted(() => ({
  refetchMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/features/pre-assessment/hooks', () => ({
  usePreAssessment: () => ({ refetch: refetchMock }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

vi.mock('@/features/profile/components/ProfileCompletionForm', () => ({
  PROFILE_INCOMPLETE_MESSAGE: 'Complete your profile to continue.',
  ProfileCompletionForm: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={() => void onComplete()}>Continue</button>
  ),
}))

const renderStep = () =>
  render(
    <MemoryRouter initialEntries={['/apply/job-1/profile']}>
      <Routes>
        <Route path="/apply/:jobId/profile" element={<ProfileStep />} />
        <Route path="/apply/:jobId/prescreen" element={<p>Prescreen page</p>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('apply wizard ProfileStep', () => {
  it('moves on to prescreening once the profile is complete', async () => {
    refetchMock.mockResolvedValue(false)
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.getByText('Prescreen page')).toBeTruthy())
  })

  it('stays on the profile step when prescreening still sees it as incomplete', async () => {
    refetchMock.mockResolvedValue(true)
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(notifyMock).toHaveBeenCalled())
    expect(screen.queryByText('Prescreen page')).toBeNull()
  })
})
