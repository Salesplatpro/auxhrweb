import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { CvMatch } from './CvMatch'

describe('CvMatch', () => {
  afterEach(cleanup)

  it('flags a score below the job minimum without hiding it', () => {
    render(<CvMatch value={42.4} belowMinimum />)

    expect(screen.getByText('42%')).toBeTruthy()
    expect(screen.getByText('Below your CV minimum')).toBeTruthy()
  })

  it('shows no flag at or above the minimum', () => {
    render(<CvMatch value={80} belowMinimum={false} />)

    expect(screen.queryByText('Below your CV minimum')).toBeNull()
  })
})
