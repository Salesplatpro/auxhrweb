import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { SideBar } from './SideBar'

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { userRole: 'recruiter' } }),
}))

const renderSideBar = (ui: React.ReactElement, path = '/') =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('SideBar', () => {
  it('renders each section under its label, in order', () => {
    renderSideBar(
      <SideBar
        sections={[
          {
            label: 'Hiring',
            items: [{ name: 'Dashboard', icon: null, link: '/a' }],
          },
          {
            label: 'Workspace',
            items: [{ name: 'Settings', icon: null, link: '/b' }],
          },
        ]}
      />,
    )

    const text = document.body.textContent ?? ''
    expect(text.indexOf('Hiring')).toBeLessThan(text.indexOf('Dashboard'))
    expect(text.indexOf('Dashboard')).toBeLessThan(text.indexOf('Workspace'))
    expect(text.indexOf('Workspace')).toBeLessThan(text.indexOf('Settings'))
  })

  it('renders a section without a label, as the admin uses', () => {
    renderSideBar(
      <SideBar
        sections={[{ items: [{ name: 'Overview', icon: null, link: '/a' }] }]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Overview' })).toBeTruthy()
  })

  it('shows counts, hides zero counts and shows a tag', () => {
    renderSideBar(
      <SideBar
        sections={[
          {
            items: [
              { name: 'Applications', icon: null, link: '/a', count: 48 },
              { name: 'Chats', icon: null, link: '/b', count: 0 },
              { name: 'My work', icon: null, link: '/c', tag: 'New' },
            ],
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('link', { name: /Applications/ }).textContent,
    ).toContain('48')
    expect(screen.getByRole('link', { name: /Chats/ }).textContent).toBe(
      'Chats',
    )
    expect(screen.getByText('New')).toBeTruthy()
  })

  it('marks only the current page as active', () => {
    renderSideBar(
      <SideBar
        sections={[
          {
            items: [
              {
                name: 'Dashboard',
                icon: null,
                link: '/recruiterDashboard/dashboard',
              },
              {
                name: 'Applications',
                icon: null,
                link: '/recruiterDashboard/dashboard/allapplications',
              },
            ],
          },
        ]}
      />,
      '/recruiterDashboard/dashboard/allapplications',
    )

    expect(
      screen.getByRole('link', { name: 'Applications' }).className,
    ).toContain('active')
    expect(
      screen.getByRole('link', { name: 'Dashboard' }).className,
    ).not.toContain('active')
  })

  it('renders the slots around the nav', () => {
    renderSideBar(
      <SideBar
        sections={[]}
        topSlot={<div>Company card</div>}
        promoSlot={<div>Plan card</div>}
        footerSlot={<div>User card</div>}
      />,
    )

    for (const slot of ['Company card', 'Plan card', 'User card']) {
      expect(screen.getByText(slot)).toBeTruthy()
    }
  })
})
