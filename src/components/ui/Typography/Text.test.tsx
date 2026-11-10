import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { Text } from './Text'

describe('Text', () => {
  it('renders its children', () => {
    render(<Text>Hello world</Text>)

    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('renders as a div by default', () => {
    const { container } = render(<Text>Hello world</Text>)

    expect(container.querySelector('div')?.textContent).toBe('Hello world')
  })

  it('renders as the element passed via "as"', () => {
    const { container } = render(<Text as="p">Hello world</Text>)

    expect(container.querySelector('p')?.textContent).toBe('Hello world')
  })

  it('applies size, color and weight classes', () => {
    render(
      <Text size="fs-3xl" color="hero" weight="bolder">
        Hello world
      </Text>,
    )

    const element = screen.getByText('Hello world')
    expect(element.className).toContain('fs-3xl')
    expect(element.className).toContain('hero')
    expect(element.className).toContain('bolder')
  })

  it('applies the muted color', () => {
    render(<Text color="muted">Hello world</Text>)

    expect(screen.getByText('Hello world').className).toContain('muted')
  })

  it('merges a custom className with its own', () => {
    render(<Text className="custom-class">Hello world</Text>)

    expect(screen.getByText('Hello world').className).toContain('custom-class')
  })
})
