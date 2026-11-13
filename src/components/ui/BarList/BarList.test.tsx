import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BarList } from './BarList'

const renderList = (props: React.ComponentProps<typeof BarList>) =>
  render(<BarList {...props} />, { wrapper: MemoryRouter })

describe('BarList', () => {
  it('lists each item with its count and share of the total', () => {
    renderList({
      ariaLabel: 'Jobs by status',
      items: [
        { key: 'active', label: 'Active', value: 3 },
        { key: 'closed', label: 'Closed', value: 1 },
      ],
    })

    expect(screen.getByRole('list', { name: 'Jobs by status' })).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
  })

  it('renders a link only for items with an href', () => {
    renderList({
      ariaLabel: 'Stages',
      items: [
        { key: 'a', label: 'Linked', value: 2, href: '/adminDashboard/jobs' },
        { key: 'b', label: 'Plain', value: 2 },
      ],
    })

    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('shows the empty label when every value is zero', () => {
    renderList({
      ariaLabel: 'Stuck',
      emptyLabel: 'Nothing is stuck right now',
      items: [{ key: 'a', label: 'A', value: 0 }],
    })

    expect(screen.getByText('Nothing is stuck right now')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('shows each item as a share of a given total, for a funnel', () => {
    renderList({
      ariaLabel: 'Pipeline',
      of: 200,
      items: [
        { key: 'applied', label: 'Applied', value: 200 },
        { key: 'matched', label: 'CV Matched', value: 50 },
      ],
    })

    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
  })

  it('shows only the percentage for items that are percentages', () => {
    renderList({
      ariaLabel: 'Skills',
      of: 100,
      valueDisplay: 'share',
      items: [{ key: 'ga4', label: 'GA4', value: 76 }],
    })

    expect(screen.getByText('76%')).toBeTruthy()
    expect(screen.queryByText('76')).toBeNull()
  })
})
