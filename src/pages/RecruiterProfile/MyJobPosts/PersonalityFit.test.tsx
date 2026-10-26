import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

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
})
