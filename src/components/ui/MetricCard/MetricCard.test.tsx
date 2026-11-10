import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { MetricCard } from './MetricCard'

const renderCard = (props: React.ComponentProps<typeof MetricCard>) =>
  render(<MetricCard {...props} />, { wrapper: MemoryRouter })

describe('MetricCard', () => {
  it('shows the label, value and hint', () => {
    renderCard({ label: 'Talents', value: '1,240', hint: '+36 in 30 days' })

    expect(screen.getByText('Talents')).toBeTruthy()
    expect(screen.getByText('1,240')).toBeTruthy()
    expect(screen.getByText('+36 in 30 days')).toBeTruthy()
  })

  it('shows a signed delta with the comparison label', () => {
    renderCard({
      label: 'Talents',
      value: '10',
      delta: 12,
      deltaLabel: 'vs previous 30 days',
    })

    expect(screen.getByText('+12%')).toBeTruthy()
    expect(screen.getByText('vs previous 30 days')).toBeTruthy()
  })

  it('shows a negative delta without a plus sign', () => {
    renderCard({ label: 'Talents', value: '10', delta: -8 })

    expect(screen.getByText('-8%')).toBeTruthy()
  })

  it('shows a count delta without a percent sign', () => {
    renderCard({
      label: 'Active jobs',
      value: '12',
      delta: 2,
      deltaFormat: 'count',
    })

    expect(screen.getByText('+2')).toBeTruthy()
    expect(screen.queryByText('+2%')).toBeNull()
  })

  it('shows an icon beside the label', () => {
    renderCard({
      label: 'Active jobs',
      value: '12',
      icon: <svg data-testid="metric-icon" />,
    })

    expect(screen.getByTestId('metric-icon')).toBeTruthy()
  })

  it('omits the delta when it cannot be computed', () => {
    renderCard({ label: 'Talents', value: '10', delta: null })

    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('hides the value while loading', () => {
    renderCard({ label: 'Talents', value: '10', loading: true })

    expect(screen.queryByText('10')).toBeNull()
  })

  it('links to the detail page when given a destination', () => {
    renderCard({ label: 'Jobs', value: '3', to: '/adminDashboard/jobs' })

    expect(
      screen
        .getByRole('link', { name: 'Jobs: view details' })
        .getAttribute('href'),
    ).toBe('/adminDashboard/jobs')
  })
})
