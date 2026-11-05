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
  orgState: { billingPlan: 'pay_per_use' as string },
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
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      emailVerifiedAt: '2026-01-01T00:00:00.000Z',
      activeOrganization: {
        id: 'org-1',
        ownerId: 'u1',
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

  // The trigger pill used to hardcode "Paid" while the dropdown showed the real plan name,
  // so an org on sme_basic read as two different things in the same header.
  it('shows the real plan name in the trigger pill for a paid recruiter', () => {
    authState.user.userRole = 'recruiter'
    orgState.billingPlan = 'sme_basic'
    renderBadge()

    expect(screen.getByText('Sme Basic')).toBeTruthy()
    expect(screen.queryByText('Paid')).toBeNull()
  })

  it('shows no paid pill for a pay-per-use recruiter, and never says Free', () => {
    authState.user.userRole = 'recruiter'
    renderBadge()

    expect(screen.queryByText(/Free/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }))
    expect(screen.getByText('Pay per Use')).toBeTruthy()
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
