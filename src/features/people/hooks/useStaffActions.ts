import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  addShareGrant,
  createBenefit,
  createStaff,
  deleteBenefit,
  deleteShareGrant,
  endStaff,
  inviteStaff,
  savePay,
  staffBase,
  updateBenefit,
  updateStaff,
} from '../services/peopleService'
import {
  Benefit,
  BenefitPayload,
  CreateStaffPayload,
  PayData,
  PayPackagePayload,
  ShareGrantPayload,
  StaffMember,
  UpdateStaffPayload,
} from '../types'
import {
  benefitsKey,
  staffActivityKey,
  staffMemberKey,
  staffOptionsKeyPrefix,
  staffPayKey,
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

  const updatePayCache = (
    orgId: string,
    staffId: string,
    change: (pay: PayData) => PayData,
  ) =>
    mutate<PayData>(
      staffPayKey(orgId, staffId),
      (pay) => (pay ? change(pay) : pay),
      { revalidate: false },
    )

  const savePayPackage = async (
    staffId: string,
    payload: PayPackagePayload,
  ) => {
    const pay = await run(async (orgId) => {
      const saved = await savePay(orgId, staffId, payload)
      await mutate(staffPayKey(orgId, staffId), saved, { revalidate: false })
      await mutate(staffActivityKey(orgId, staffId))
      return saved
    }, 'Could not save pay')
    if (pay) notify('success', 'Pay saved')
    return pay
  }

  const addGrant = async (staffId: string, payload: ShareGrantPayload) => {
    const grant = await run(async (orgId) => {
      const created = await addShareGrant(orgId, staffId, payload)
      await updatePayCache(orgId, staffId, (pay) => ({
        ...pay,
        grants: [created, ...pay.grants],
      }))
      await mutate(staffActivityKey(orgId, staffId))
      return created
    }, 'Could not add this grant')
    if (grant) notify('success', 'Share grant added')
    return grant
  }

  const removeGrant = async (staffId: string, grantId: string) => {
    const removed = await run(async (orgId) => {
      await deleteShareGrant(orgId, staffId, grantId)
      await updatePayCache(orgId, staffId, (pay) => ({
        ...pay,
        grants: pay.grants.filter((grant) => grant.id !== grantId),
      }))
      await mutate(staffActivityKey(orgId, staffId))
      return true
    }, 'Could not remove this grant')
    if (removed) notify('success', 'Share grant removed')
    return removed
  }

  const saveBenefit = async (payload: BenefitPayload, benefitId?: string) => {
    const benefit = await run(async (orgId) => {
      const saved = benefitId
        ? await updateBenefit(orgId, benefitId, payload)
        : await createBenefit(orgId, payload)
      await mutate<Benefit[]>(
        benefitsKey(orgId),
        (benefits = []) =>
          [...benefits.filter((item) => item.id !== saved.id), saved].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        { revalidate: false },
      )
      return saved
    }, 'Could not save this benefit')
    if (benefit)
      notify('success', benefitId ? 'Benefit saved' : 'Benefit added')
    return benefit
  }

  const removeBenefit = async (benefit: Benefit) => {
    const removed = await run(async (orgId) => {
      await deleteBenefit(orgId, benefit.id)
      await mutate<Benefit[]>(
        benefitsKey(orgId),
        (benefits = []) => benefits.filter((item) => item.id !== benefit.id),
        { revalidate: false },
      )
      return true
    }, 'Could not delete this benefit')
    if (removed) notify('success', `${benefit.name} deleted`)
    return removed
  }

  return {
    addStaff,
    saveStaff,
    endEmployment,
    sendInvite,
    savePayPackage,
    addGrant,
    removeGrant,
    saveBenefit,
    removeBenefit,
    isSaving,
  }
}
