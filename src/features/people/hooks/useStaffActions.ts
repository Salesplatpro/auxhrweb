import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { downloadBlobResponse } from '@/utils/downloadBlob'
import { exportRowsToCsv } from '@/utils/exportRowsToCsv'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  addChecklistTask,
  addShareGrant,
  checkStaffImport,
  commitStaffImport,
  createBenefit,
  createCommissionPlan,
  createStaff,
  deleteBenefit,
  deleteChecklistTask,
  deleteCommissionPlan,
  deleteShareGrant,
  downloadNotarizedScan,
  downloadStaffDocument,
  endStaff,
  fetchStaffExport,
  fillCompanyProfileFromFile,
  inviteStaff,
  resendStaffDocument,
  saveChecklistDefaults,
  saveCompanyProfile,
  savePay,
  sendStaffDocument,
  setDocumentNotarization,
  staffBase,
  updateBenefit,
  updateCommissionPlan,
  updateStaff,
  uploadNotarizedScan,
} from '../services/peopleService'
import {
  Benefit,
  BenefitPayload,
  ChecklistItem,
  ChecklistTask,
  CommissionPlan,
  CommissionPlanPayload,
  CompanyProfile,
  CreateStaffPayload,
  DocumentTemplate,
  ImportStaffRow,
  PayData,
  PayPackagePayload,
  SendDocumentResult,
  ShareGrantPayload,
  StaffDocument,
  StaffMember,
  UpdateStaffPayload,
} from '../types'
import {
  benefitsKey,
  checklistDefaultsKey,
  checklistKey,
  commissionPlansKey,
  companyProfileKey,
  staffActivityKey,
  staffDocumentsKey,
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

  const saveCommissionPlan = async (
    payload: CommissionPlanPayload,
    planId?: string,
  ) => {
    const plan = await run(async (orgId) => {
      const saved = planId
        ? await updateCommissionPlan(orgId, planId, payload)
        : await createCommissionPlan(orgId, payload)
      await mutate<CommissionPlan[]>(
        commissionPlansKey(orgId),
        (plans = []) =>
          [...plans.filter((item) => item.id !== saved.id), saved].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        { revalidate: false },
      )
      return saved
    }, 'Could not save this plan')
    if (plan) notify('success', 'Commission plan saved')
    return plan
  }

  const removeCommissionPlan = async (plan: CommissionPlan) => {
    const removed = await run(async (orgId) => {
      await deleteCommissionPlan(orgId, plan.id)
      await mutate<CommissionPlan[]>(
        commissionPlansKey(orgId),
        (plans = []) => plans.filter((item) => item.id !== plan.id),
        { revalidate: false },
      )
      return true
    }, 'Could not delete this plan')
    if (removed) notify('success', `${plan.name} deleted`)
    return removed
  }

  const cacheDocument = async (
    orgId: string,
    staffId: string,
    document: StaffDocument,
  ) => {
    await mutate<StaffDocument[]>(
      staffDocumentsKey(orgId, staffId),
      (documents = []) => [
        document,
        ...documents.filter((item) => item.id !== document.id),
      ],
      { revalidate: false },
    )
    await mutate(staffActivityKey(orgId, staffId))
  }

  const notifySent = (result: SendDocumentResult | null, email: string) => {
    if (!result) return
    if (result.emailSent) {
      notify('success', `Sent to ${email} for signing`)
    } else {
      notify(
        'warning',
        "Saved, but the email didn't go out. Use Send again to retry.",
        { autoClose: 6000 },
      )
    }
  }

  const sendDocument = async (
    staff: StaffMember,
    template: DocumentTemplate,
  ) => {
    const result = await run(async (orgId) => {
      const sent = await sendStaffDocument(orgId, staff.id, template)
      await cacheDocument(orgId, staff.id, sent.document)
      return sent
    }, 'Could not send this document')
    notifySent(result, staff.email)
    return result
  }

  const resendDocument = async (staff: StaffMember, documentId: string) => {
    const result = await run(async (orgId) => {
      const sent = await resendStaffDocument(orgId, staff.id, documentId)
      await cacheDocument(orgId, staff.id, sent.document)
      return sent
    }, 'Could not send this document again')
    notifySent(result, staff.email)
    return result
  }

  const downloadDocument = (staffId: string, document: StaffDocument) =>
    run(async (orgId) => {
      const response = await downloadStaffDocument(orgId, staffId, document.id)
      downloadBlobResponse(
        response.data,
        response.headers['content-disposition'],
        `${document.title}.pdf`,
      )
      return true
    }, 'Could not download this document')

  const addTask = async (
    staffId: string,
    task: { title: string; dueOn: string | null },
  ) => {
    const created = await run(async (orgId) => {
      const saved = await addChecklistTask(orgId, staffId, task)
      await mutate<ChecklistTask[]>(checklistKey(orgId, staffId))
      return saved
    }, 'Could not add this task')
    if (created) notify('success', 'Task added')
    return created
  }

  const removeTask = (staffId: string, taskId: string) =>
    run(async (orgId) => {
      await deleteChecklistTask(orgId, staffId, taskId)
      await mutate<ChecklistTask[]>(
        checklistKey(orgId, staffId),
        (tasks = []) => tasks.filter((task) => task.id !== taskId),
        { revalidate: false },
      )
      return true
    }, 'Could not remove this task')

  const saveDefaultChecklist = async (items: ChecklistItem[]) => {
    const saved = await run(async (orgId) => {
      const result = await saveChecklistDefaults(orgId, items)
      await mutate(checklistDefaultsKey(orgId), result, { revalidate: false })
      return result
    }, 'Could not save the default checklist')
    if (saved) notify('success', 'Default checklist saved')
    return saved
  }

  const setNotarization = (
    staffId: string,
    documentId: string,
    needsNotarization: boolean,
  ) =>
    run(async (orgId) => {
      const document = await setDocumentNotarization(
        orgId,
        staffId,
        documentId,
        needsNotarization,
      )
      await cacheDocument(orgId, staffId, document)
      return document
    }, 'Could not update this document')

  const attachNotarizedScan = async (
    staffId: string,
    documentId: string,
    file: File,
  ) => {
    const document = await run(async (orgId) => {
      const updated = await uploadNotarizedScan(
        orgId,
        staffId,
        documentId,
        file,
      )
      await cacheDocument(orgId, staffId, updated)
      return updated
    }, 'Could not upload the notarized copy')
    if (document) notify('success', 'Notarized copy attached')
    return document
  }

  const downloadScan = (staffId: string, document: StaffDocument) =>
    run(async (orgId) => {
      const response = await downloadNotarizedScan(orgId, staffId, document.id)
      downloadBlobResponse(
        response.data,
        response.headers['content-disposition'],
        `${document.title} notarized`,
      )
      return true
    }, 'Could not download the notarized copy')

  const checkImport = (rows: ImportStaffRow[]) =>
    run((orgId) => checkStaffImport(orgId, rows), 'Could not check this file')

  const importStaff = (rows: ImportStaffRow[]) =>
    run(async (orgId) => {
      const result = await commitStaffImport(orgId, rows)
      await refreshLists(orgId)
      return result
    }, 'Could not import these staff')

  const exportStaffCsv = () =>
    run(async (orgId) => {
      const staff = await fetchStaffExport(orgId)
      exportRowsToCsv(
        [
          'Email',
          'Full name',
          'Job title',
          'Department',
          'Manager email',
          'Start date',
          'Status',
          'Hired through',
        ],
        staff.map((person) => [
          person.email,
          person.fullName,
          person.jobTitle,
          person.department ?? '',
          person.managerEmail ?? '',
          person.startDate,
          person.status,
          person.hiredThroughAuxhr ? 'AuxHR' : 'Outside',
        ]),
        'staff.csv',
      )
      return true
    }, 'Could not export your staff')

  const saveProfile = async (profile: CompanyProfile) => {
    const saved = await run(async (orgId) => {
      const result = await saveCompanyProfile(orgId, profile)
      await mutate(companyProfileKey(orgId), result, { revalidate: false })
      return result
    }, 'Could not save the company profile')
    if (saved) notify('success', 'Company profile saved')
    return saved
  }

  const fillProfileFromFile = (file: File) =>
    run(
      (orgId) => fillCompanyProfileFromFile(orgId, file),
      'Could not read this document',
    )

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
    saveCommissionPlan,
    removeCommissionPlan,
    sendDocument,
    resendDocument,
    downloadDocument,
    addTask,
    removeTask,
    saveDefaultChecklist,
    setNotarization,
    attachNotarizedScan,
    downloadScan,
    checkImport,
    importStaff,
    exportStaffCsv,
    saveProfile,
    fillProfileFromFile,
    isSaving,
  }
}
