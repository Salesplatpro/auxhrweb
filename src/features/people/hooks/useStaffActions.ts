import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  createStaff,
  endStaff,
  inviteStaff,
  staffBase,
  updateStaff,
} from '../services/peopleService'
import { CreateStaffPayload, StaffMember, UpdateStaffPayload } from '../types'
import {
  staffActivityKey,
  staffMemberKey,
  staffOptionsKeyPrefix,
} from './useStaffData'

const EMAIL_NOT_SENT =
  "Saved, but the invite email didn't go out. Open their page to resend it."

export const useStaffActions = (organizationId: string | null) => {
  const { mutate } = useSWRConfig()
  const [isSaving, setIsSaving] = useState(false)

  const isListKey = (orgId: string, key: unknown) =>
    typeof key === 'string' &&
    (key.startsWith(`${staffBase(orgId)}?`) ||
      key.startsWith(staffOptionsKeyPrefix(orgId)))

  /** Returns null after telling the user why, so callers only handle the happy path. */
  const run = async <T>(
    action: (orgId: string) => Promise<T>,
    failure: string,
  ): Promise<T | null> => {
    if (!organizationId) return null
    setIsSaving(true)
    try {
      return await action(organizationId)
    } catch (error) {
      notify('error', getErrorMessage(error, failure))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const refreshLists = (orgId: string) => mutate((key) => isListKey(orgId, key))

  /** The response already is the new record, so it is cached instead of re-fetched: a re-fetch would count as another view in the access log. */
  const cacheChange = async (orgId: string, staff: StaffMember) => {
    await mutate(staffMemberKey(orgId, staff.id), staff, { revalidate: false })
    await mutate(staffActivityKey(orgId, staff.id))
    await refreshLists(orgId)
  }

  const addStaff = async (payload: CreateStaffPayload) => {
    const result = await run(async (orgId) => {
      const created = await createStaff(orgId, payload)
      await refreshLists(orgId)
      return created
    }, 'Could not add this person')
    if (!result) return null

    if (result.inviteEmailSent === false) {
      notify('warning', EMAIL_NOT_SENT, { autoClose: 6000 })
    } else if (result.inviteEmailSent) {
      notify(
        'success',
        `${result.staff.fullName} added. Invite sent to ${result.staff.email}.`,
      )
    } else {
      notify('success', `${result.staff.fullName} added`)
    }
    return result
  }

  const saveStaff = async (staffId: string, payload: UpdateStaffPayload) => {
    const staff = await run(async (orgId) => {
      const updated = await updateStaff(orgId, staffId, payload)
      await cacheChange(orgId, updated)
      return updated
    }, 'Could not save these changes')
    if (staff) notify('success', 'Details saved')
    return staff
  }

  const endEmployment = async (staffId: string, endDate: string) => {
    const staff = await run(async (orgId) => {
      const ended = await endStaff(orgId, staffId, endDate)
      await cacheChange(orgId, ended)
      return ended
    }, 'Could not end employment')
    if (staff) notify('success', `${staff.fullName}'s employment has ended`)
    return staff
  }

  const sendInvite = async (staffId: string) => {
    const result = await run(async (orgId) => {
      const sent = await inviteStaff(orgId, staffId)
      await cacheChange(orgId, sent.staff)
      return sent
    }, 'Could not send the invite')
    if (!result) return null

    if (result.inviteEmailSent) {
      notify('success', `Invite sent to ${result.staff.email}`)
    } else {
      notify('warning', EMAIL_NOT_SENT, { autoClose: 6000 })
    }
    return result
  }

  return { addStaff, saveStaff, endEmployment, sendInvite, isSaving }
}
