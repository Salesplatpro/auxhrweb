import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DashboardShell } from './DashboardShell'

const renderShell = () =>
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route
          element={
            <DashboardShell
              header={<span>Header</span>}
              sidebar={() => <nav>Links</nav>}
            />
          }>
          <Route path="/home" element={<p>Page body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('DashboardShell', () => {
  it('renders the page inside the scrolling content area', () => {
    renderShell()

    const body = screen.getByText('Page body')
    expect(body.closest('[data-scroll-root]')).not.toBeNull()
  })

  it('opens the menu and closes it again with Escape', () => {
    renderShell()
    const menu = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(menu)
    expect(menu.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menu.getAttribute('aria-expanded')).toBe('false')
  })
})
