import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RequirePeopleAccess from './RequirePeopleAccess'

const { usePeopleAccessMock } = vi.hoisted(() => ({
  usePeopleAccessMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: usePeopleAccessMock,
}))

const renderGuard = (ownerOnly = false) =>
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<RequirePeopleAccess ownerOnly={ownerOnly} />}>
          <Route index element={<p>People content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

const access = (overrides: Record<string, unknown>) =>
  usePeopleAccessMock.mockReturnValue({
    isLoading: false,
    isOwner: false,
    canManagePeople: false,
    organizationId: 'org-1',
    ...overrides,
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RequirePeopleAccess', () => {
  it('shows the no-access screen to a recruiter without the setting', () => {
    access({})
    renderGuard()

    expect(screen.getByText("You don't have access to People")).toBeTruthy()
    expect(screen.getByText('Ask your company owner.')).toBeTruthy()
    expect(screen.queryByText('People content')).toBeNull()
  })

  it('lets through someone who can manage people', () => {
    access({ canManagePeople: true })
    renderGuard()

    expect(screen.getByText('People content')).toBeTruthy()
  })

  it('shows neither the page nor the refusal while access is loading', () => {
    access({ isLoading: true })
    renderGuard()

    expect(screen.queryByText('People content')).toBeNull()
    expect(screen.queryByText("You don't have access to People")).toBeNull()
  })
})

describe('RequirePeopleAccess ownerOnly', () => {
  it('refuses a member who can manage people but is not the owner', () => {
    access({ canManagePeople: true })
    renderGuard(true)

    expect(screen.getByText("You don't have access to People")).toBeTruthy()
    expect(screen.queryByText('People content')).toBeNull()
  })

  it('lets the owner through', () => {
    access({ isOwner: true, canManagePeople: true })
    renderGuard(true)

    expect(screen.getByText('People content')).toBeTruthy()
  })
})
