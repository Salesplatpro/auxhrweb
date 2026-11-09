import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

describe('SegmentedControl', () => {
  it('replaces the value in single mode', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        label="Work type"
        options={options}
        value={['remote']}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    expect(onChange).toHaveBeenCalledWith(['hybrid'])
  })

  it('adds and removes values in multiple mode without dropping others', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        multiple
        label="Work type"
        options={options}
        value={['remote', 'hybrid']}
        onChange={onChange}
      />,
    )
    expect(
      screen
        .getByRole('button', { name: 'Remote' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Remote' }))
    expect(onChange).toHaveBeenCalledWith(['hybrid'])
  })
})
