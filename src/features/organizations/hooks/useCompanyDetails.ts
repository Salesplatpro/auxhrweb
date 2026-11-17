import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { useProfile } from '@/features/profile/hooks/useProfile'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  addDepartment,
  fetchJobFeed,
  jobFeedKey,
  removeDepartment,
  updateMember,
  updateOrganization,
} from '../services/organizationService'
import { OrganizationMember } from '../types'
import { useMyOrganizations } from './useMyOrganizations'
import { organizationMembersKey } from './useOrganizationMembers'

const useRefreshOrganizations = () => {
  const { mutate: mutateProfile } = useProfile()
  const { mutate: mutateOrganizations } = useMyOrganizations()
  return () => Promise.all([mutateOrganizations(), mutateProfile()])
}

export const useDepartments = (organizationId: string) => {
  const refresh = useRefreshOrganizations()
  const [isSaving, setIsSaving] = useState(false)

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setIsSaving(true)
    try {
      await action()
      await refresh()
      return true
    } catch (error) {
      notify('error', getErrorMessage(error, fallback))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isSaving,
    add: (name: string) =>
      run(
        () => addDepartment(organizationId, name),
        "Couldn't add the department",
      ),
    remove: (name: string) =>
      run(
        () => removeDepartment(organizationId, name),
        "Couldn't remove the department",
      ),
  }
}

export const useSetMemberTitle = (organizationId: string) => {
  const { mutate } = useSWRConfig()
  const [isSaving, setIsSaving] = useState(false)

  const setTitle = async (member: OrganizationMember, title: string) => {
    setIsSaving(true)
    try {
      const updated = await updateMember(organizationId, member.id, {
        title: title.trim() || null,
      })
      await mutate<OrganizationMember[]>(
        organizationMembersKey(organizationId),
        (current) =>
          (current ?? []).map((row) =>
            row.id === member.id ? { ...row, title: updated.title } : row,
          ),
        { revalidate: false },
      )
      notify('success', 'Job title saved')
      return true
    } catch (error) {
      notify('error', getErrorMessage(error, "Couldn't save the job title"))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return { setTitle, isSaving }
}

export const useJobFeed = (organizationId: string) => {
  const refresh = useRefreshOrganizations()
  const { data, error, isLoading, mutate } = useSWR(
    jobFeedKey(organizationId),
    () => fetchJobFeed(organizationId),
  )
  const [isToggling, setIsToggling] = useState(false)

  const setEnabled = async (enabled: boolean) => {
    setIsToggling(true)
    try {
      await mutate(
        async () => {
          await updateOrganization(organizationId, {
            indeedFeedEnabled: enabled,
          })
          return fetchJobFeed(organizationId)
        },
        {
          optimisticData: (current) =>
            current
              ? { ...current, enabled }
              : { enabled, url: null, openJobs: 0, updatedAt: null },
          rollbackOnError: true,
          revalidate: false,
        },
      )
      await refresh()
      return true
    } catch (err) {
      notify('error', getErrorMessage(err, "Couldn't change the job feed"))
      return false
    } finally {
      setIsToggling(false)
    }
  }

  return { feed: data ?? null, error, isLoading, isToggling, setEnabled }
}
