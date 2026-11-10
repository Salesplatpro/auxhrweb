import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTourStore } from '@/features/product-tour'

import { LoggedInUserBadge } from './LoggedInUserBadge'

const { navigateMock, authState, orgState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  authState: {
    user: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      userRole: 'talent' as string | undefined,
    },
    logout: vi.fn(),
  },
  orgState: { billingPlan: 'pay_per_use' as string, ownerId: 'u1' },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      id: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      emailVerifiedAt: '2026-01-01T00:00:00.000Z',
      activeOrganization: {
        id: 'org-1',
        ownerId: orgState.ownerId,
        name: 'Ada Co',
        status: 'verified',
        billingPlan: orgState.billingPlan,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({
    unReadCount: 0,
    notifications: [],
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('@/features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: () => ({ markAsRead: vi.fn() }),
}))

vi.mock('@/features/notifications/hooks/useMarkAllNotificationsRead', () => ({
  useMarkAllNotificationsRead: () => ({
    markAllAsRead: vi.fn(),
    isMarkingAll: false,
  }),
}))

const renderBadge = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LoggedInUserBadge />
    </MemoryRouter>,
  )

describe('LoggedInUserBadge', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    authState.logout.mockReset()
    authState.user.userRole = 'talent'
    orgState.billingPlan = 'pay_per_use'
    orgState.ownerId = 'u1'
    useTourStore.getState().stop()
  })

  it('keeps the notifications open when a dialog from them is clicked', () => {
    renderBadge()
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeTruthy()

    const modal = document.createElement('div')
    modal.className = 'react-responsive-modal-root'
    document.body.appendChild(modal)
    fireEvent.mouseDown(modal)
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).toBeNull()
    modal.remove()
  })

  it('navigates to the change-password route from the account menu', () => {
    renderBadge()

    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Change password/ }))

    expect(navigateMock).toHaveBeenCalledWith(
      '/talentDashboard/change-password',
    )
  })

  it('uses the recruiter change-password route for recruiters', () => {
    authState.user.userRole = 'recruiter'
    renderBadge()

    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Change password/ }))

    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/change-password',
    )
  })

  it('does not show change password for admin', () => {
    authState.user.userRole = 'admin'
    renderBadge()

    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))

    expect(
      screen.queryByRole('menuitem', { name: /Change password/ }),
    ).toBeNull()
  })

  it('labels the company owner under their name', () => {
    authState.user.userRole = 'recruiter'
    renderBadge()

    expect(screen.getByText('Recruiter · Owner')).toBeTruthy()
  })

  it('labels a teammate who does not own the company as a recruiter', () => {
    authState.user.userRole = 'recruiter'
    orgState.ownerId = 'someone-else'
    renderBadge()

    expect(screen.getByText('Recruiter')).toBeTruthy()
    expect(screen.queryByText('Recruiter · Owner')).toBeNull()
  })

  it('keeps the real plan name in the account menu and never says Free', () => {
    authState.user.userRole = 'recruiter'
    orgState.billingPlan = 'sme_basic'
    renderBadge()

    expect(screen.queryByText(/Free/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    expect(screen.getByText('Sme Basic')).toBeTruthy()
  })

  describe('tour entry', () => {
    const openMenu = () =>
      fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))

    it('starts the page tour when the current page has one', () => {
      renderBadge('/talentDashboard/chat')
      openMenu()
      fireEvent.click(screen.getByRole('menuitem', { name: /Tour this page/ }))

      expect(useTourStore.getState().active).toEqual({
        role: 'talent',
        scope: 'page',
      })
    })

    it('starts the overview tour on a page without its own', () => {
      authState.user.userRole = 'recruiter'
      renderBadge('/recruiterDashboard/profile')
      openMenu()
      fireEvent.click(screen.getByRole('menuitem', { name: /Take the tour/ }))

      expect(useTourStore.getState().active).toEqual({ role: 'recruiter' })
    })

    it('is not offered to admins', () => {
      authState.user.userRole = 'admin'
      renderBadge()
      openMenu()

      expect(screen.queryByRole('menuitem', { name: /tour/i })).toBeNull()
    })
  })
})
