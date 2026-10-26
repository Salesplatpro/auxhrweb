import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyBanner } from './CompanyBanner'

const peopleAccess = vi.hoisted(() => ({
  isOwner: false,
  canManagePeople: false,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: undefined }),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => peopleAccess,
}))

const renderBanner = (onNavigate?: () => void) => {
  render(
    <MemoryRouter>
      <CompanyBanner onNavigate={onNavigate} />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByText('No company yet'))
}

describe('CompanyBanner', () => {
  beforeEach(() => {
    peopleAccess.isOwner = false
    peopleAccess.canManagePeople = false
  })

  it('hides the people links from users without access', () => {
    renderBanner()
    expect(screen.getByText('View plan')).toBeTruthy()
    expect(screen.queryByText('Employees')).toBeNull()
    expect(screen.queryByText('Access log')).toBeNull()
  })

  it('shows Employees to people managers but not the access log', () => {
    peopleAccess.canManagePeople = true
    renderBanner()
    expect(screen.getByText('Employees')).toBeTruthy()
    expect(screen.queryByText('Access log')).toBeNull()
  })

  it('shows both people links to the owner', () => {
    peopleAccess.canManagePeople = true
    peopleAccess.isOwner = true
    renderBanner()
    expect(screen.getByText('Employees')).toBeTruthy()
    expect(screen.getByText('Access log')).toBeTruthy()
  })

  it('closes the menu and reports navigation when a row is picked', () => {
    peopleAccess.canManagePeople = true
    const onNavigate = vi.fn()
    renderBanner(onNavigate)
    fireEvent.click(screen.getByText('Employees'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Employees')).toBeNull()
  })
})
