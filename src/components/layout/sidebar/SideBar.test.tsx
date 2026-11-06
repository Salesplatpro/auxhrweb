import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { SideBar } from './SideBar'

const { auth } = vi.hoisted(() => ({ auth: { userRole: 'recruiter' } }))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { userRole: auth.userRole } }),
}))

describe('SideBar', () => {
  it('renders footer links above the support link', () => {
    render(
      <MemoryRouter>
        <SideBar
          sideBarData={[{ name: 'Dashboard', icon: null, link: '/a' }]}
          footerItems={[{ name: 'Guide', icon: null, link: '/guide' }]}
        />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link').map((link) => link.textContent)
    expect(links.indexOf('Guide')).toBeGreaterThan(links.indexOf('Dashboard'))
    expect(links.indexOf('Guide')).toBeLessThan(
      links.findIndex((text) => text?.includes('Help & support')),
    )
  })

  it('works without footer links', () => {
    render(
      <MemoryRouter>
        <SideBar sideBarData={[]} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Guide')).toBeNull()
    expect(screen.getByText('Help & support')).toBeTruthy()
  })

  it('links a recruiter to the recruiter support page', () => {
    render(
      <MemoryRouter>
        <SideBar sideBarData={[]} />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('link', { name: /Help & support/ }).getAttribute('href'),
    ).toBe('/recruiterDashboard/support')
  })

  it('gives the admin no support link, because the admin answers support', () => {
    auth.userRole = 'admin'
    render(
      <MemoryRouter>
        <SideBar sideBarData={[]} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Help & support')).toBeNull()
    auth.userRole = 'recruiter'
  })
})
