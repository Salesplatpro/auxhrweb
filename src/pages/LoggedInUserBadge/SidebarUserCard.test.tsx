import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SidebarUserCard } from './SidebarUserCard'

const state = vi.hoisted(() => ({ role: 'recruiter' }))

vi.mock('./useUserIdentity', () => ({
  useUserIdentity: () => ({
    role: state.role,
    profile: { activeOrganization: { name: 'Kosana Tech Ltd' } },
    firstName: 'Philip',
    lastName: 'Kosana',
    fullName: 'Philip Kosana',
    imageUrl: null,
    roleLabel:
      state.role === 'recruiter' ? 'Recruiter · Owner' : 'Product Designer',
  }),
}))

vi.mock('./UserMenu', () => ({
  UserMenu: ({ placement }: { placement: string }) => (
    <div role="menu" data-placement={placement} />
  ),
}))

const renderCard = () =>
  render(
    <MemoryRouter>
      <SidebarUserCard />
    </MemoryRouter>,
  )

describe('SidebarUserCard', () => {
  beforeEach(() => {
    state.role = 'recruiter'
  })

  it('shows a recruiter with their company', () => {
    renderCard()

    expect(screen.getByText('Philip Kosana')).toBeTruthy()
    expect(screen.getByText('Kosana Tech Ltd')).toBeTruthy()
  })

  it('shows talent with their role', () => {
    state.role = 'talent'
    renderCard()

    expect(screen.getByText('Product Designer')).toBeTruthy()
  })

  it('opens the account menu above the card and closes it on an outside click', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /Account menu/ }))

    expect(screen.getByRole('menu').getAttribute('data-placement')).toBe(
      'above',
    )

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
