import { httpClient } from '@/features/auth/services/httpClient'
import { withBlobError } from '@/utils/blobError'
import { downloadBlobResponse } from '@/utils/downloadBlob'

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
  CompletionRequest,
  CompletionReviewResult,
  CreateStaffPayload,
  CreateStaffResult,
  DevelopmentItem,
  DevelopmentPayload,
  DocumentCheck,
  DocumentPreview,
  DocumentTemplate,
  EfficiencyTip,
  Envelope,
  Goal,
  GoalPayload,
  HeadcountCost,
  HrAssignee,
  ImportCommitResult,
  ImportRowResult,
  ImportStaffRow,
  InviteStaffResult,
  JobDescription,
  JoinedStaff,
  ManagedPerformance,
  MonthlyFeedback,
  MyPerformance,
  MyTeamData,
  MyWorkRecord,
  OrgChartData,
  PayData,
  PayPackagePayload,
  PeopleAccess,
  QuarterGoal,
  QuarterGoalPayload,
  QuarterlyReviewData,
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
  WeeklyReport,
  WeeklyReportText,
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

export const fetchHrAssignees = (organizationId: string, staffId: string) =>
  unwrap<{ assignees: HrAssignee[] }>(
    httpClient.get(`${staffBase(organizationId)}/${staffId}/hr`),
  ).then((data) => data.assignees)

export const fetchAssignedStaffIds = (
  organizationId: string,
  assigneeUserId: string,
) =>
  unwrap<{ assignedStaffIds: string[] }>(
    httpClient.get(`${staffBase(organizationId)}/hr-assignments`, {
      params: { assigneeUserId },
    }),
  ).then((data) => data.assignedStaffIds)

export const saveHrAssignments = (
  organizationId: string,
  input: { assigneeUserId: string; add: string[]; remove: string[] },
) =>
  unwrap<{ assignedStaffIds: string[] }>(
    httpClient.put(`${staffBase(organizationId)}/hr-assignments`, input),
  ).then((data) => data.assignedStaffIds)

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
  withBlobError(
    httpClient.get<Blob>(
      `${staffBase(organizationId)}/${staffId}/documents/${documentId}/pdf`,
      { responseType: 'blob' },
    ),
  )

export const retryDocumentCopy = (
  organizationId: string,
  staffId: string,
  documentId: string,
) =>
  unwrap<{ document: StaffDocument }>(
    httpClient.post(
      `${staffBase(
        organizationId,
      )}/${staffId}/documents/${documentId}/finalize`,
    ),
  ).then((data) => data.document)

export const checkSignedDocumentCode = (
  documentId: string,
  checkCode: string,
) =>
  unwrap<{ check: DocumentCheck }>(
    httpClient.post('/document-checks', { documentId, checkCode }),
  ).then((data) => data.check)

export const checkSignedDocumentFile = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return unwrap<{ check: DocumentCheck }>(
    httpClient.post('/document-checks/file', body),
  ).then((data) => data.check)
}

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
  withBlobError(
    httpClient.get<Blob>(
      `${documentPath(organizationId, staffId, documentId)}/notarized-scan`,
      { responseType: 'blob' },
    ),
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

export const submitCompletionRequest = (staffId: string, form: FormData) =>
  unwrap<{ request: CompletionRequest }>(
    httpClient.post(`${MY_WORK_KEY}/${staffId}/completion-requests`, form),
  ).then((data) => data.request)

export const withdrawCompletionRequest = (staffId: string, requestId: string) =>
  httpClient.delete(
    `${MY_WORK_KEY}/${staffId}/completion-requests/${requestId}`,
  )

const downloadEvidenceFrom = async (
  url: string,
  file: { name: string },
): Promise<void> => {
  const response = await withBlobError(
    httpClient.get(url, { responseType: 'blob' }),
  )
  downloadBlobResponse(response.data as Blob, undefined, file.name)
}

export const downloadMyEvidence = (
  staffId: string,
  requestId: string,
  file: { id: string; name: string },
) =>
  downloadEvidenceFrom(
    `${MY_WORK_KEY}/${staffId}/completion-requests/${requestId}/files/${file.id}`,
    file,
  )

export const downloadEvidence = (
  base: string,
  requestId: string,
  file: { id: string; name: string },
) =>
  downloadEvidenceFrom(
    `${base}/completion-requests/${requestId}/files/${file.id}`,
    file,
  )

export const approveCompletion = (
  base: string,
  requestId: string,
  input: { version?: number; note: string | null },
) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/completion-requests/${requestId}/approve`, input),
  )

export const returnCompletion = (
  base: string,
  requestId: string,
  note: string,
) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/completion-requests/${requestId}/return`, {
      note,
    }),
  )

export const completeGoal = (base: string, goalId: string, version: number) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/goals/${goalId}/complete`, { version }),
  )

export const reopenGoal = (base: string, goalId: string) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/goals/${goalId}/reopen`),
  )

export const fetchScopedTasks = (base: string) =>
  unwrap<{ tasks: ChecklistTask[] }>(httpClient.get(`${base}/tasks`)).then(
    (data) => data.tasks,
  )

export const completeTask = (base: string, taskId: string) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/tasks/${taskId}/complete`),
  )

export const reopenTask = (base: string, taskId: string) =>
  unwrap<CompletionReviewResult>(
    httpClient.post(`${base}/tasks/${taskId}/reopen`),
  )

export const fetchMyDocument = (documentId: string) =>
  unwrap<{ document: SigningDocument }>(
    httpClient.get(`${MY_WORK_KEY}/documents/${documentId}`),
  ).then((data) => data.document)

export const downloadMySignedDocument = (documentId: string) =>
  withBlobError(
    httpClient.get<Blob>(`${MY_WORK_KEY}/documents/${documentId}/pdf`, {
      responseType: 'blob',
    }),
  )

export const signMyDocument = (documentId: string, fullName: string) =>
  unwrap<{ signed: SignedCopy }>(
    httpClient.post(`${MY_WORK_KEY}/documents/${documentId}/sign`, {
      fullName,
      agree: true,
    }),
  ).then((data) => data.signed)

/** Longer than the server's own limit, so a slow AI call is reported instead of waiting forever. */
const AI_TIMEOUT = { timeout: 90_000 }

export const hrPerformanceBase = (organizationId: string, staffId: string) =>
  `${staffBase(organizationId)}/${staffId}/performance`

export const teamPerformanceBase = (managerStaffId: string, staffId: string) =>
  `${MY_WORK_KEY}/${managerStaffId}/team/${staffId}`

export const myPerformanceKey = (staffId: string) =>
  `${MY_WORK_KEY}/${staffId}/performance`

export const fetchPerformance = (base: string) =>
  unwrap<{ performance: ManagedPerformance }>(httpClient.get(base)).then(
    (data) => data.performance,
  )

export const fetchMyPerformance = (staffId: string) =>
  unwrap<{ performance: MyPerformance }>(
    httpClient.get(myPerformanceKey(staffId)),
  ).then((data) => data.performance)

export const fetchMyTeam = (managerStaffId: string) =>
  unwrap<MyTeamData>(httpClient.get(`${MY_WORK_KEY}/${managerStaffId}/team`))

export const writeJobDescription = (organizationId: string, staffId: string) =>
  unwrap<{ draft: { body: string } }>(
    httpClient.post(
      `${staffBase(organizationId)}/${staffId}/job-description/write`,
      undefined,
      AI_TIMEOUT,
    ),
  ).then((data) => data.draft)

export const saveJobDescription = (
  organizationId: string,
  staffId: string,
  body: string,
  version: number | null,
) =>
  unwrap<{ jobDescription: JobDescription }>(
    httpClient.put(`${staffBase(organizationId)}/${staffId}/job-description`, {
      body,
      version,
    }),
  ).then((data) => data.jobDescription)

export const addGoal = (base: string, goal: GoalPayload) =>
  unwrap<{ goal: Goal }>(httpClient.post(`${base}/goals`, goal)).then(
    (data) => data.goal,
  )

export const editGoal = (
  base: string,
  goalId: string,
  goal: GoalPayload,
  version: number,
) =>
  unwrap<{ goal: Goal }>(
    httpClient.patch(`${base}/goals/${goalId}`, { ...goal, version }),
  ).then((data) => data.goal)

export const approveGoal = (base: string, goalId: string, version: number) =>
  unwrap<{ goal: Goal }>(
    httpClient.post(`${base}/goals/${goalId}/approve`, { version }),
  ).then((data) => data.goal)

export const removeGoal = (base: string, goalId: string) =>
  httpClient.delete(`${base}/goals/${goalId}`)

export const suggestGoals = (base: string) =>
  unwrap<{ goals: Goal[] }>(
    httpClient.post(`${base}/goals/suggest`, undefined, AI_TIMEOUT),
  ).then((data) => data.goals)

export const setMyGoalProgress = (
  staffId: string,
  goalId: string,
  progress: number,
) =>
  unwrap<{ goal: Goal }>(
    httpClient.patch(`${MY_WORK_KEY}/${staffId}/goals/${goalId}/progress`, {
      progress,
    }),
  ).then((data) => data.goal)

export const fetchReports = (base: string, offset: number, limit = 10) =>
  unwrap<{ items: WeeklyReport[]; total: number }>(
    httpClient.get(`${base}/reports?limit=${limit}&offset=${offset}`),
  )

export const fetchMyReports = (staffId: string, offset: number, limit = 10) =>
  fetchReports(`${MY_WORK_KEY}/${staffId}`, offset, limit)

export const saveReportNote = (
  base: string,
  reportId: string,
  note: string,
  textVersion: number,
  noteVersion: number,
) =>
  unwrap<{ report: WeeklyReport }>(
    httpClient.put(`${base}/reports/${reportId}/note`, {
      note,
      textVersion,
      noteVersion,
    }),
  ).then((data) => data.report)

export const submitMyReport = (
  staffId: string,
  weekStart: string,
  text: WeeklyReportText,
) =>
  unwrap<{ report: WeeklyReport }>(
    httpClient.put(`${MY_WORK_KEY}/${staffId}/reports/${weekStart}`, text),
  ).then((data) => data.report)

export const requestMyAdvice = (staffId: string, reportId: string) =>
  unwrap<{ report: WeeklyReport }>(
    httpClient.post(
      `${MY_WORK_KEY}/${staffId}/reports/${reportId}/advice`,
      undefined,
      AI_TIMEOUT,
    ),
  ).then((data) => data.report)

export const addDevelopmentItem = (base: string, item: DevelopmentPayload) =>
  unwrap<{ item: DevelopmentItem }>(
    httpClient.post(`${base}/development`, item),
  ).then((data) => data.item)

export const editDevelopmentItem = (
  base: string,
  item: DevelopmentItem,
  status: DevelopmentItem['status'],
) =>
  unwrap<{ item: DevelopmentItem }>(
    httpClient.patch(`${base}/development/${item.id}`, {
      weakArea: item.weakArea,
      action: item.action,
      dueOn: item.dueOn,
      status,
      version: item.version,
    }),
  ).then((data) => data.item)

export const removeDevelopmentItem = (base: string, itemId: string) =>
  httpClient.delete(`${base}/development/${itemId}`)

export const suggestDevelopmentItems = (base: string) =>
  unwrap<{ items: DevelopmentItem[] }>(
    httpClient.post(`${base}/development/suggest`, undefined, AI_TIMEOUT),
  ).then((data) => data.items)

export const setMyDevelopmentDone = (
  staffId: string,
  itemId: string,
  done: boolean,
) =>
  unwrap<{ item: DevelopmentItem }>(
    httpClient.patch(`${MY_WORK_KEY}/${staffId}/development/${itemId}`, {
      done,
    }),
  ).then((data) => data.item)

export const saveFeedback = (
  base: string,
  month: string,
  feedback: { rating: number; notes: string; version: number | null },
) =>
  unwrap<{ feedback: MonthlyFeedback }>(
    httpClient.put(`${base}/feedback/${month}`, feedback),
  ).then((data) => data.feedback)

export const requestEfficiencyTip = (base: string) =>
  unwrap<{ tip: EfficiencyTip }>(
    httpClient.post(`${base}/efficiency-tip`, undefined, AI_TIMEOUT),
  ).then((data) => data.tip)

export const orgChartKey = (organizationId: string) =>
  `${staffBase(organizationId)}/org-chart`

export const fetchOrgChart = (organizationId: string) =>
  unwrap<OrgChartData>(httpClient.get(orgChartKey(organizationId)))

export const quarterlyReviewKey = (organizationId: string, quarter: string) =>
  `${staffBase(organizationId)}/quarterly-review?quarter=${quarter}`

export const fetchQuarterlyReview = (organizationId: string, quarter: string) =>
  unwrap<QuarterlyReviewData>(
    httpClient.get(quarterlyReviewKey(organizationId, quarter)),
  )

export const saveQuarterGoal = (
  organizationId: string,
  payload: QuarterGoalPayload,
) =>
  unwrap<{ goal: QuarterGoal }>(
    httpClient.put(
      `${staffBase(organizationId)}/quarterly-review/goal`,
      payload,
    ),
  ).then((data) => data.goal)
