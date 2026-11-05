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

const renderGuard = (level?: 'any' | 'manage' | 'creator') =>
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<RequirePeopleAccess level={level} />}>
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
    hasPeopleAccess: false,
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

    expect(screen.getByText("You don't have access to this")).toBeTruthy()
    expect(screen.getByText("Ask your company's creator.")).toBeTruthy()
    expect(screen.queryByText('People content')).toBeNull()
  })

  it('lets through someone who can manage people', () => {
    access({ canManagePeople: true, hasPeopleAccess: true })
    renderGuard()

    expect(screen.getByText('People content')).toBeTruthy()
  })

  it('shows neither the page nor the refusal while access is loading', () => {
    access({ isLoading: true })
    renderGuard()

    expect(screen.queryByText('People content')).toBeNull()
    expect(screen.queryByText("You don't have access to this")).toBeNull()
  })
})

describe('RequirePeopleAccess levels', () => {
  it('lets an assigned teammate reach the employee pages only', () => {
    access({ hasPeopleAccess: true, assignedCount: 1 })

    const { unmount } = renderGuard('any')
    expect(screen.getByText('People content')).toBeTruthy()
    unmount()

    renderGuard('manage')
    expect(screen.queryByText('People content')).toBeNull()
  })

  it('keeps creator pages from a member who can manage people', () => {
    access({ canManagePeople: true, hasPeopleAccess: true })

    const { unmount } = renderGuard('manage')
    expect(screen.getByText('People content')).toBeTruthy()
    unmount()

    renderGuard('creator')
    expect(screen.getByText("You don't have access to this")).toBeTruthy()
    expect(screen.queryByText('People content')).toBeNull()
  })

  it('lets the creator through', () => {
    access({ isOwner: true, canManagePeople: true, hasPeopleAccess: true })
    renderGuard('creator')

    expect(screen.getByText('People content')).toBeTruthy()
  })
})
