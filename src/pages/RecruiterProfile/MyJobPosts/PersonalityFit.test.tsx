import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PersonalityFit } from './PersonalityFit'

describe('PersonalityFit (recruiter candidate panel, Day 6)', () => {
  it("shows the AI's personality fit score and its reason", () => {
    render(
      <PersonalityFit
        application={{
          personalityFitScore: 78,
          personalityFitReason: 'Plans ahead, which suits the reporting work.',
        }}
      />,
    )
    expect(screen.getByText('Personality fit')).toBeTruthy()
    expect(screen.getByText('78%')).toBeTruthy()
    expect(
      screen.getByText('Plans ahead, which suits the reporting work.'),
    ).toBeTruthy()
  })

  it('rounds the score to a whole percent', () => {
    render(
      <PersonalityFit
        application={{ personalityFitScore: 66.6, personalityFitReason: 'x' }}
      />,
    )
    expect(screen.getByText('67%')).toBeTruthy()
  })

  it('renders nothing before the personality check has a fit', () => {
    const { container } = render(
      <PersonalityFit
        application={{ personalityFitScore: null, personalityFitReason: null }}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('offers a retry when the type is saved but the fit is missing', async () => {
    let finish!: () => void
    const onRetry = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    )
    render(
      <PersonalityFit
        application={{ mbtiType: 'INTJ', personalityFitScore: null }}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText("The fit hasn't been worked out yet.")).toBeTruthy()

    const button = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(true),
    )
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)

    finish()
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false),
    )
  })

  it('says the fit is being worked out instead of offering a retry', () => {
    render(
      <PersonalityFit
        application={{
          mbtiType: 'INTJ',
          personalityFitScore: null,
          personalityFitPending: true,
        }}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByText('Working out the fit…')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('shows no retry button on a read-only view', () => {
    render(
      <PersonalityFit
        application={{ mbtiType: 'INTJ', personalityFitScore: null }}
      />,
    )
    expect(screen.getByText("The fit hasn't been worked out yet.")).toBeTruthy()
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })
})
