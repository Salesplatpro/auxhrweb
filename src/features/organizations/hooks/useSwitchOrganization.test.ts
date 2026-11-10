import { beforeEach, describe, expect, it, vi } from 'vitest'

import { chatSessionsKey } from '@/features/messaging/services/messagingService'
import { notificationsKey } from '@/features/notifications/services/notificationService'
import { useScoutStore } from '@/features/scout/store/useScoutStore'

import { resetCompanyWorkspaceCaches } from './useSwitchOrganization'

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }))

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr')
  return { ...actual, mutate: mutateMock }
})

describe('resetCompanyWorkspaceCaches', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    mutateMock.mockResolvedValue(undefined)
  })

  it('refreshes the chat and notification caches that are not keyed by company', async () => {
    await resetCompanyWorkspaceCaches()

    expect(mutateMock).toHaveBeenCalledWith(chatSessionsKey)
    expect(mutateMock).toHaveBeenCalledWith(notificationsKey)
  })

  it('still clears company data when a refresh fails', async () => {
    mutateMock.mockRejectedValue(new Error('offline'))
    useScoutStore.getState().setSearchPage(3)

    await expect(resetCompanyWorkspaceCaches()).resolves.toBeUndefined()
    expect(useScoutStore.getState().page).toBe(0)
  })
})
