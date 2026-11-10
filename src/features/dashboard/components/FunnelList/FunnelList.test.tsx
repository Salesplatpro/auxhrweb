import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { FunnelList } from './FunnelList'

describe('FunnelList', () => {
  it('shows each stage as a share of the first one', () => {
    render(
      <FunnelList
        steps={[
          { key: 'applied', label: 'Applied', value: 200 },
          { key: 'cv', label: 'CV Matched', value: 50 },
        ]}
      />,
    )

    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
  })

  it('shows 0% rather than NaN when nothing was applied for', () => {
    render(
      <FunnelList
        steps={[
          { key: 'applied', label: 'Applied', value: 0 },
          { key: 'cv', label: 'CV Matched', value: 0 },
        ]}
      />,
    )

    expect(screen.queryByText(/NaN/)).toBeNull()
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })

  it('still renders a stage that has more than the one before it', () => {
    render(
      <FunnelList
        steps={[
          { key: 'applied', label: 'Applied', value: 10 },
          { key: 'cv', label: 'CV Matched', value: 2 },
          { key: 'pre', label: 'Pre-Screened', value: 6 },
        ]}
      />,
    )

    expect(screen.getByText('60%')).toBeTruthy()
  })
})
