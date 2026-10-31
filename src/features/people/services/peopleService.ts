import { httpClient } from '@/features/auth/services/httpClient'

import {
  AccessLogData,
  AccessLogQuery,
  Benefit,
  BenefitPayload,
  ChecklistItem,
  ChecklistTask,
  CommissionPlan,
  CommissionPlanPayload,
  CompanyProfile,
  CreateStaffPayload,
  CreateStaffResult,
  DocumentPreview,
  DocumentTemplate,
  Envelope,
  HeadcountCost,
  ImportCommitResult,
  ImportRowResult,
  ImportStaffRow,
  InviteStaffResult,
  JoinedStaff,
  MyWorkRecord,
  PayData,
  PayPackagePayload,
  PeopleAccess,
  SendDocumentResult,
  ShareGrant,
  ShareGrantPayload,
  SignedCopy,
  SigningDocument,
  StaffActivity,
  StaffDocument,
  StaffExportRow,
  StaffInvitePreview,
  StaffListData,
  StaffListQuery,
  StaffMember,
  StaffOption,
  UpdateStaffPayload,
} from '../types'

export const staffBase = (organizationId: string) =>
  `/organizations/${organizationId}/staff`

const unwrap = <T>(promise: Promise<{ data: Envelope<T> }>) =>
  promise.then((response) => response.data.data)

const compact = (params: Record<string, string | number>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== 0),
  )

export const toQueryString = (params: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(compact(params)).map(([key, value]) => [key, String(value)]),
  ).toString()

export const fetchPeopleAccess = (organizationId: string) =>
  unwrap<{ access: PeopleAccess }>(
    httpClient.get(`${staffBase(organizationId)}/access`),
  ).then((data) => data.access)

export const fetchStaffList = (organizationId: string, query: StaffListQuery) =>
  unwrap<StaffListData>(
    httpClient.get(staffBase(organizationId), {
      params: compact({ ...query }),
    }),
  )

export const fetchStaffOptions = (
  organizationId: string,
  includeEnded: boolean,
) =>
  unwrap<{ options: StaffOption[] }>(
    httpClient.get(`${staffBase(organizationId)}/options`, {
      params: includeEnded ? { includeEnded: true } : undefined,
    }),
  ).then((data) => data.options)

export const createStaff = (
  organizationId: string,
  payload: CreateStaffPayload,
) =>
  unwrap<CreateStaffResult>(httpClient.post(staffBase(organizationId), payload))

export const fetchStaffMember = (organizationId: string, staffId: string) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}`),
  ).then((data) => data.staff)

export const updateStaff = (
  organizationId: string,
  staffId: string,
  payload: UpdateStaffPayload,
) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.patch(`${staffBase(organizationId)}/${staffId}`, payload),
  ).then((data) => data.staff)

export const endStaff = (
  organizationId: string,
  staffId: string,
  endDate: string,
) =>
  unwrap<{ staff: StaffMember }>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/end`, {
      endDate,
    }),
  ).then((data) => data.staff)

export const inviteStaff = (organizationId: string, staffId: string) =>
  unwrap<InviteStaffResult>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/invite`),
  )

export const fetchStaffActivity = (organizationId: string, staffId: string) =>
  unwrap<{ activities: StaffActivity[] }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}/activity`),
  ).then((data) => data.activities)

export const fetchAccessLog = (organizationId: string, query: AccessLogQuery) =>
  unwrap<AccessLogData>(
    httpClient.get(`${staffBase(organizationId)}/access-log`, {
      params: compact({ ...query }),
    }),
  )

export const fetchStaffInvitePreview = (token: string) =>
  unwrap<{ invite: StaffInvitePreview }>(
    httpClient.get(`/staff-invites/${token}`),
  ).then((data) => data.invite)

export const acceptStaffInvite = (token: string) =>
  unwrap<{ joined: JoinedStaff }>(
    httpClient.post(`/staff-invites/${token}/accept`),
  ).then((data) => data.joined)

export const fetchPay = (organizationId: string, staffId: string) =>
  unwrap<PayData>(httpClient.get(`${staffBase(organizationId)}/${staffId}/pay`))

export const savePay = (
  organizationId: string,
  staffId: string,
  payload: PayPackagePayload,
) =>
  unwrap<PayData>(
    httpClient.put(`${staffBase(organizationId)}/${staffId}/pay`, payload),
  )

export const previewPayParagraph = (
  organizationId: string,
  payload: PayPackagePayload,
) =>
  unwrap<{ paragraph: string }>(
    httpClient.post(`${staffBase(organizationId)}/pay/preview`, payload),
  ).then((data) => data.paragraph)

export const addShareGrant = (
  organizationId: string,
  staffId: string,
  payload: ShareGrantPayload,
) =>
  unwrap<{ grant: ShareGrant }>(
    httpClient.post(
      `${staffBase(organizationId)}/${staffId}/share-grants`,
      payload,
    ),
  ).then((data) => data.grant)

export const deleteShareGrant = (
  organizationId: string,
  staffId: string,
  grantId: string,
) =>
  httpClient.delete(
    `${staffBase(organizationId)}/${staffId}/share-grants/${grantId}`,
  )

export const fetchBenefits = (organizationId: string) =>
  unwrap<{ benefits: Benefit[] }>(
    httpClient.get(`${staffBase(organizationId)}/benefits`),
  ).then((data) => data.benefits)

export const createBenefit = (
  organizationId: string,
  payload: BenefitPayload,
) =>
  unwrap<{ benefit: Benefit }>(
    httpClient.post(`${staffBase(organizationId)}/benefits`, payload),
  ).then((data) => data.benefit)

export const updateBenefit = (
  organizationId: string,
  benefitId: string,
  payload: BenefitPayload,
) =>
  unwrap<{ benefit: Benefit }>(
    httpClient.patch(
      `${staffBase(organizationId)}/benefits/${benefitId}`,
      payload,
    ),
  ).then((data) => data.benefit)

export const deleteBenefit = (organizationId: string, benefitId: string) =>
  httpClient.delete(`${staffBase(organizationId)}/benefits/${benefitId}`)

export const fetchCommissionPlans = (organizationId: string) =>
  unwrap<{ plans: CommissionPlan[] }>(
    httpClient.get(`${staffBase(organizationId)}/commission-plans`),
  ).then((data) => data.plans)

export const createCommissionPlan = (
  organizationId: string,
  payload: CommissionPlanPayload,
) =>
  unwrap<{ plan: CommissionPlan }>(
    httpClient.post(`${staffBase(organizationId)}/commission-plans`, payload),
  ).then((data) => data.plan)

export const updateCommissionPlan = (
  organizationId: string,
  planId: string,
  payload: CommissionPlanPayload,
) =>
  unwrap<{ plan: CommissionPlan }>(
    httpClient.put(
      `${staffBase(organizationId)}/commission-plans/${planId}`,
      payload,
    ),
  ).then((data) => data.plan)

export const deleteCommissionPlan = (organizationId: string, planId: string) =>
  httpClient.delete(`${staffBase(organizationId)}/commission-plans/${planId}`)

export const fetchHeadcountCost = (organizationId: string) =>
  unwrap<HeadcountCost>(
    httpClient.get(`${staffBase(organizationId)}/headcount-cost`),
  )

export const fetchStaffDocuments = (organizationId: string, staffId: string) =>
  unwrap<{ documents: StaffDocument[] }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}/documents`),
  ).then((data) => data.documents)

export const previewStaffDocument = (
  organizationId: string,
  staffId: string,
  template: DocumentTemplate,
) =>
  unwrap<{ preview: DocumentPreview }>(
    httpClient.get(
      `${staffBase(organizationId)}/${staffId}/documents/preview`,
      {
        params: { template },
      },
    ),
  ).then((data) => data.preview)

export const sendStaffDocument = (
  organizationId: string,
  staffId: string,
  template: DocumentTemplate,
) =>
  unwrap<SendDocumentResult>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/documents`, {
      template,
    }),
  )

export const resendStaffDocument = (
  organizationId: string,
  staffId: string,
  documentId: string,
) =>
  unwrap<SendDocumentResult>(
    httpClient.post(
      `${staffBase(organizationId)}/${staffId}/documents/${documentId}/resend`,
    ),
  )

export const downloadStaffDocument = (
  organizationId: string,
  staffId: string,
  documentId: string,
) =>
  httpClient.get<Blob>(
    `${staffBase(organizationId)}/${staffId}/documents/${documentId}/pdf`,
    { responseType: 'blob' },
  )

export const fetchSigningDocument = (token: string) =>
  unwrap<{ document: SigningDocument }>(
    httpClient.get(`/staff-documents/${token}`),
  ).then((data) => data.document)

export const signDocumentWithLink = (token: string, fullName: string) =>
  unwrap<{ signed: SignedCopy }>(
    httpClient.post(`/staff-documents/${token}/sign`, {
      fullName,
      agree: true,
    }),
  ).then((data) => data.signed)

export const fetchChecklistDefaults = (organizationId: string) =>
  unwrap<{ items: ChecklistItem[] }>(
    httpClient.get(`${staffBase(organizationId)}/checklist-defaults`),
  ).then((data) => data.items)

export const saveChecklistDefaults = (
  organizationId: string,
  items: ChecklistItem[],
) =>
  unwrap<{ items: ChecklistItem[] }>(
    httpClient.put(`${staffBase(organizationId)}/checklist-defaults`, {
      items,
    }),
  ).then((data) => data.items)

export const fetchChecklist = (organizationId: string, staffId: string) =>
  unwrap<{ tasks: ChecklistTask[] }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}/checklist`),
  ).then((data) => data.tasks)

export const addChecklistTask = (
  organizationId: string,
  staffId: string,
  task: { title: string; dueOn: string | null },
) =>
  unwrap<{ task: ChecklistTask }>(
    httpClient.post(`${staffBase(organizationId)}/${staffId}/checklist`, task),
  ).then((data) => data.task)

export const deleteChecklistTask = (
  organizationId: string,
  staffId: string,
  taskId: string,
) =>
  httpClient.delete(
    `${staffBase(organizationId)}/${staffId}/checklist/${taskId}`,
  )

const documentPath = (
  organizationId: string,
  staffId: string,
  documentId: string,
) => `${staffBase(organizationId)}/${staffId}/documents/${documentId}`

export const setDocumentNotarization = (
  organizationId: string,
  staffId: string,
  documentId: string,
  needsNotarization: boolean,
) =>
  unwrap<{ document: StaffDocument }>(
    httpClient.patch(documentPath(organizationId, staffId, documentId), {
      needsNotarization,
    }),
  ).then((data) => data.document)

export const uploadNotarizedScan = (
  organizationId: string,
  staffId: string,
  documentId: string,
  file: File,
) => {
  const form = new FormData()
  form.append('file', file)
  return unwrap<{ document: StaffDocument }>(
    httpClient.post(
      `${documentPath(organizationId, staffId, documentId)}/notarized-scan`,
      form,
    ),
  ).then((data) => data.document)
}

export const downloadNotarizedScan = (
  organizationId: string,
  staffId: string,
  documentId: string,
) =>
  httpClient.get<Blob>(
    `${documentPath(organizationId, staffId, documentId)}/notarized-scan`,
    { responseType: 'blob' },
  )

export const checkStaffImport = (
  organizationId: string,
  rows: ImportStaffRow[],
) =>
  unwrap<{ rows: ImportRowResult[] }>(
    httpClient.post(`${staffBase(organizationId)}/import`, {
      rows,
      commit: false,
    }),
  ).then((data) => data.rows)

export const commitStaffImport = (
  organizationId: string,
  rows: ImportStaffRow[],
) =>
  unwrap<ImportCommitResult>(
    httpClient.post(`${staffBase(organizationId)}/import`, {
      rows,
      commit: true,
    }),
  )

export const fetchStaffExport = (organizationId: string) =>
  unwrap<{ staff: StaffExportRow[] }>(
    httpClient.get(`${staffBase(organizationId)}/export`),
  ).then((data) => data.staff)

export const fetchCompanyProfile = (organizationId: string) =>
  unwrap<{ profile: CompanyProfile }>(
    httpClient.get(`${staffBase(organizationId)}/company-profile`),
  ).then((data) => data.profile)

export const saveCompanyProfile = (
  organizationId: string,
  profile: CompanyProfile,
) =>
  unwrap<{ profile: CompanyProfile }>(
    httpClient.put(`${staffBase(organizationId)}/company-profile`, profile),
  ).then((data) => data.profile)

export const fillCompanyProfileFromFile = (
  organizationId: string,
  file: File,
) => {
  const form = new FormData()
  form.append('file', file)
  return unwrap<{ profile: CompanyProfile }>(
    httpClient.post(
      `${staffBase(organizationId)}/company-profile/extract`,
      form,
    ),
  ).then((data) => data.profile)
}

export const MY_WORK_KEY = '/my-work'

export const fetchMyWork = () =>
  unwrap<{ records: MyWorkRecord[] }>(httpClient.get(MY_WORK_KEY)).then(
    (data) => data.records,
  )

export const fetchMyPay = (staffId: string) =>
  unwrap<PayData>(httpClient.get(`${MY_WORK_KEY}/${staffId}/pay`))

export const setMyTaskDone = (taskId: string, done: boolean) =>
  unwrap<{ task: ChecklistTask }>(
    httpClient.patch(`${MY_WORK_KEY}/tasks/${taskId}`, { done }),
  ).then((data) => data.task)

export const fetchMyDocument = (documentId: string) =>
  unwrap<{ document: SigningDocument }>(
    httpClient.get(`${MY_WORK_KEY}/documents/${documentId}`),
  ).then((data) => data.document)

export const signMyDocument = (documentId: string, fullName: string) =>
  unwrap<{ signed: SignedCopy }>(
    httpClient.post(`${MY_WORK_KEY}/documents/${documentId}/sign`, {
      fullName,
      agree: true,
    }),
  ).then((data) => data.signed)
