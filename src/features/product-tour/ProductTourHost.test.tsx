import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductTourHost } from './ProductTourHost'
import { useTourStore } from './useTourStore'

const { fetchOnboardingMock, profileRef } = vi.hoisted(() => ({
  fetchOnboardingMock: vi.fn(),
  profileRef: { current: null as Record<string, unknown> | null },
}))

vi.mock('@/features/profile/services/profileService', () => ({
  ONBOARDING_ENDPOINT: '/user/me/onboarding',
  fetchOnboarding: fetchOnboardingMock,
}))
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: profileRef.current }),
}))
vi.mock('./tourSteps', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tourSteps')>()),
  STAGE_TOURS: {
    create_company: [
      {
        title: 'Set up your company',
        body: 'Add your details',
        route: '/recruiterDashboard/guide',
      },
    ],
    post_job: [{ title: 'Post a job', body: 'Describe the role' }],
  },
}))

const LocationProbe = () => <p data-testid="path">{useLocation().pathname}</p>

const renderHost = ({
  path = '/recruiterDashboard/dashboard',
  blocked,
}: { path?: string; blocked?: boolean } = {}) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[path]}>
        <ProductTourHost audience="recruiter" blocked={blocked} />
        <LocationProbe />
      </MemoryRouter>
    </SWRConfig>,
  )

const respondWith = (stage: string) =>
  fetchOnboardingMock.mockResolvedValue({
    data: { onboarding: { role: 'recruiter', stage } },
  })

const recruiter = { id: 'user-1', userRole: 'recruiter' }

describe('ProductTourHost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTourStore.setState({ active: null, paused: [] })
    window.localStorage.clear()
    profileRef.current = { ...recruiter }
    respondWith('create_company')
  })

  it('starts the tour for the stage the user is stuck on', async () => {
    renderHost()
    expect(
      await screen.findByRole('dialog', { name: /set up your company/i }),
    ).toBeTruthy()
  })

  it('cannot be skipped, only paused', async () => {
    renderHost()
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /skip tour/i })).toBeNull()
    expect(screen.getByRole('button', { name: /pause/i })).toBeTruthy()
  })

  it('takes the user to the step page', async () => {
    renderHost()
    await screen.findByRole('dialog')
    await waitFor(() =>
      expect(screen.getByTestId('path').textContent).toBe(
        '/recruiterDashboard/guide',
      ),
    )
  })

  it.each(['active', 'publish_job', 'verify_email'])(
    'shows nothing at the %s stage',
    async (stage) => {
      respondWith(stage)
      renderHost()
      await waitFor(() => expect(fetchOnboardingMock).toHaveBeenCalled())
      expect(screen.queryByRole('dialog')).toBeNull()
    },
  )

  it('does not ask before the profile has loaded', () => {
    profileRef.current = null
    renderHost()
    expect(fetchOnboardingMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not run for a user with another role', () => {
    profileRef.current = { id: 'user-1', userRole: 'talent' }
    renderHost()
    expect(fetchOnboardingMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('waits while it is blocked', async () => {
    renderHost({ blocked: true })
    await waitFor(() => expect(fetchOnboardingMock).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stays closed for the rest of the session once paused', async () => {
    renderHost()
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(useTourStore.getState().paused).toEqual(['recruiter:create_company'])
  })

  it('still shows the next stage after a pause on an earlier one', async () => {
    useTourStore.setState({ paused: ['recruiter:create_company'] })
    respondWith('post_job')
    renderHost()
    expect(
      await screen.findByRole('dialog', { name: /post a job/i }),
    ).toBeTruthy()
  })

  it('replays the overview on request and lets it be skipped', async () => {
    respondWith('active')
    renderHost({ path: '/recruiterDashboard/guide' })

    act(() => useTourStore.getState().start('recruiter'))
    expect(
      screen.getByRole('dialog', { name: /welcome to auxhr/i }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /skip tour/i }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ignores a replay started for the other role', () => {
    respondWith('active')
    renderHost({ path: '/recruiterDashboard/guide' })
    act(() => useTourStore.getState().start('talent'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  describe('page tours', () => {
    const JOBS_PAGE = '/recruiterDashboard/myJobPosts'

    it('shows a page tour the first time an active user opens the page', async () => {
      respondWith('active')
      renderHost({ path: JOBS_PAGE })
      expect(
        await screen.findByRole('dialog', { name: 'Your jobs' }),
      ).toBeTruthy()
    })

    it('does not show it again once it was closed', async () => {
      respondWith('active')
      renderHost({ path: JOBS_PAGE })
      await screen.findByRole('dialog', { name: 'Your jobs' })
      fireEvent.click(screen.getByRole('button', { name: /skip tour/i }))

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(window.localStorage.getItem('auxhr-page-tours-seen')).toContain(
        'recruiter-my-job-posts',
      )
    })

    it('stays away from a page the user has seen', async () => {
      window.localStorage.setItem(
        'auxhr-page-tours-seen',
        JSON.stringify(['recruiter-my-job-posts']),
      )
      respondWith('active')
      renderHost({ path: JOBS_PAGE })
      await waitFor(() => expect(fetchOnboardingMock).toHaveBeenCalled())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('waits while setup steps are still pending', async () => {
      respondWith('post_job')
      useTourStore.setState({ paused: ['recruiter:post_job'] })
      renderHost({ path: JOBS_PAGE })
      await waitFor(() => expect(fetchOnboardingMock).toHaveBeenCalled())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not show before the stage is known', () => {
      profileRef.current = null
      renderHost({ path: JOBS_PAGE })
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('replays just this page on request', async () => {
      respondWith('active')
      window.localStorage.setItem(
        'auxhr-page-tours-seen',
        JSON.stringify(['recruiter-my-job-posts']),
      )
      renderHost({ path: JOBS_PAGE })
      await waitFor(() => expect(fetchOnboardingMock).toHaveBeenCalled())

      act(() => useTourStore.getState().start('recruiter', 'page'))
      expect(screen.getByRole('dialog', { name: 'Your jobs' })).toBeTruthy()
    })
  })
})
