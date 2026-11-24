import { fireEvent, render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { MultiSelect } from './MultiSelect'

const Harness = () => {
  const [value, setValue] = useState<string[]>([])
  return (
    <MultiSelect
      name="role"
      value={value}
      onChange={setValue}
      options={[{ value: 'id-1', label: 'Data Analyst' }]}
      onCreateOption={(typed) => setValue((current) => [...current, typed])}
      searchable
    />
  )
}

describe('MultiSelect', () => {
  it('creates a typed option with Enter and shows it as a chip', () => {
    render(<Harness />)

    fireEvent.click(screen.getByText('Select options'))
    const search = screen.getByPlaceholderText('Search...')
    fireEvent.change(search, { target: { value: 'Solar Installer' } })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(
      screen.getByRole('button', { name: 'Remove Solar Installer' }),
    ).toBeTruthy()
  })
})
