import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CvFile } from './CvFile'

describe('CvFile', () => {
  it('renders a button that calls onOpen', () => {
    const onOpen = vi.fn()
    render(<CvFile fileName="resume.pdf" onOpen={onOpen} />)

    screen.getByText('resume.pdf').click()
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('renders a non-clickable file name when onOpen is omitted', () => {
    render(<CvFile fileName="resume.pdf" replaceInputId="cv" />)

    expect(screen.getByText('resume.pdf').tagName).toBe('SPAN')
    expect(screen.getByText('Replace').getAttribute('for')).toBe('cv')
  })

  it('does not render a "Replace" label when replaceInputId is omitted', () => {
    render(<CvFile fileName="resume.pdf" onOpen={vi.fn()} />)
    expect(screen.queryByText('Replace')).toBeNull()
  })
})
