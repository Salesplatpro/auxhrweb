import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { CountBadge } from './CountBadge'

describe('CountBadge', () => {
  it('renders nothing for zero, a missing count or a negative one', () => {
    for (const item of [0, undefined, -3]) {
      const { container, unmount } = render(<CountBadge item={item} />)
      expect(container.textContent).toBe('')
      unmount()
    }
  })

  it('shows the count', () => {
    render(<CountBadge item={48} />)

    expect(screen.getByText('48')).toBeTruthy()
  })

  it('caps large counts at 99+', () => {
    render(<CountBadge item={1284} />)

    expect(screen.getByText('99+')).toBeTruthy()
  })
})
