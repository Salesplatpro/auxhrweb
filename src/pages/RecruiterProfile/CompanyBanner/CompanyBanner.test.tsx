import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyBanner } from './CompanyBanner'

const peopleAccess = vi.hoisted(() => ({
  isOwner: false,
  canManagePeople: false,
  hasPeopleAccess: false,
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
    peopleAccess.hasPeopleAccess = false
  })

  it('hides the people links from users without access', () => {
    renderBanner()
    expect(screen.getByText('View plan')).toBeTruthy()
    expect(screen.queryByText('Employees')).toBeNull()
    expect(screen.queryByText('Access log')).toBeNull()
  })

  it('shows an assigned teammate only Employees', () => {
    peopleAccess.hasPeopleAccess = true
    renderBanner()
    expect(screen.getByText('Employees')).toBeTruthy()
    for (const hidden of [
      'Org chart',
      'Quarterly review',
      'Benefits',
      'Access log',
    ]) {
      expect(screen.queryByText(hidden)).toBeNull()
    }
  })

  it('shows company-wide links to people managers, but no pay or access log', () => {
    peopleAccess.canManagePeople = true
    peopleAccess.hasPeopleAccess = true
    renderBanner()
    expect(screen.getByText('Employees')).toBeTruthy()
    expect(screen.getByText('Org chart')).toBeTruthy()
    for (const hidden of [
      'Benefits',
      'Commission plans',
      'Headcount cost',
      'Access log',
    ]) {
      expect(screen.queryByText(hidden)).toBeNull()
    }
  })

  it('shows everything to the creator', () => {
    peopleAccess.canManagePeople = true
    peopleAccess.hasPeopleAccess = true
    peopleAccess.isOwner = true
    renderBanner()
    for (const link of [
      'Employees',
      'Org chart',
      'Benefits',
      'Headcount cost',
      'Access log',
    ]) {
      expect(screen.getByText(link)).toBeTruthy()
    }
  })

  it('closes the menu and reports navigation when a row is picked', () => {
    peopleAccess.hasPeopleAccess = true
    const onNavigate = vi.fn()
    renderBanner(onNavigate)
    fireEvent.click(screen.getByText('Employees'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Employees')).toBeNull()
  })
})
