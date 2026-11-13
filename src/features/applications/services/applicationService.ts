import { httpClient } from '@/features/auth/services/httpClient'
import { downloadBlobResponse } from '@/utils/downloadBlob'
import {
  BoardColumn,
  InterviewProgress,
  JobSummary,
  NextStep,
  SingleJobDetails,
} from '@/utils/recruiterJobPostsTypes'

export type ApplicationDecision = 'rejected' | 'shortlisted'

export const applicationKey = (applicationId: string) =>
  `/applications/${applicationId}`

export const fetchApplication = (applicationId: string) =>
  httpClient
    .get(applicationKey(applicationId))
    .then((response) => response.data)

export interface DecisionEmail {
  send: boolean
  body: string
}

export const updateApplicationStatus = (
  applicationId: string,
  status: ApplicationDecision,
  email?: DecisionEmail,
) =>
  httpClient
    .patch(`${applicationKey(applicationId)}/status`, { status, email })
    .then((response) => response.data)

export interface AdvanceResult {
  nextStep: NextStep
  interview: 'invited' | 'ready' | 'failed' | 'skipped' | null
}

/** Move forward: shortlists, and starts the recorded interview when it is next. */
export const advanceApplication = (
  applicationId: string,
  sendInterviewInvite: boolean,
) =>
  httpClient
    .post<{ data: AdvanceResult }>(`${applicationKey(applicationId)}/advance`, {
      sendInterviewInvite,
    })
    .then((response) => response.data.data)

export const bulkUpdateApplicationStatus = (
  applicationIds: string[],
  status: ApplicationDecision,
) =>
  httpClient
    .patch('/applications/status', { applicationIds, status })
    .then((response) => response.data)

export const jobApplicationsKey = (jobId: string) =>
  `/jobs/applications/${jobId}`

export interface JobAiConfigThresholds {
  cvSimilarity: boolean
  minCvSimilarityScore: number | null
  minPrescreeningScore: number | null
}

export interface JobApplicationsQuery {
  limit?: number
  offset?: number
  q?: string
  source?: string
  sort?: 'aiMatch' | 'dateApplied' | 'cvSimilarity'
  boardColumn?: BoardColumn
  interview?: InterviewProgress
  applicationStatus?: string
  matchVerdict?: string
}

export const fetchJobApplications = (
  jobId: string,
  query: JobApplicationsQuery = {},
) =>
  httpClient
    .get<{
      data: {
        applications: SingleJobDetails[]
        total: number
        aiConfig: JobAiConfigThresholds | null
      }
    }>(jobApplicationsKey(jobId), { params: query })
    .then((response) => response.data)

export const jobSummaryKey = (jobId: string) => `/jobs/${jobId}/summary`

export const fetchJobSummary = (jobId: string) =>
  httpClient
    .get<{ data: JobSummary }>(jobSummaryKey(jobId))
    .then((response) => response.data.data)

/** A private interview recording, as a blob the player can seek through. */
export const fetchInterviewRecording = (
  interviewId: string,
  questionId: string,
) =>
  httpClient
    .get<Blob>(`/interviews/${interviewId}/questions/${questionId}/recording`, {
      responseType: 'blob',
    })
    .then((response) => response.data)

export interface RetryVerdictsResult {
  attempted: number
  succeeded: number
  failed: number
}

export const retryMissingVerdicts = (
  jobId: string,
  applicationIds?: string[],
) =>
  httpClient
    .post<{ data: RetryVerdictsResult }>(
      `/jobs/${jobId}/retry-verdicts`,
      applicationIds ? { applicationIds } : undefined,
    )
    .then((response) => response.data.data)

export const retryCvSimilarityScore = (jobId: string, applicationId: string) =>
  httpClient
    .post(`/jobs/${jobId}/applications/${applicationId}/cv-score`)
    .then((response) => response.data)

/** Asks the AI again for a personality fit that is missing on an application. */
export const retryPersonalityFit = (applicationId: string) =>
  httpClient
    .post(`${applicationKey(applicationId)}/personality-fit`)
    .then((response) => response.data)

/** Downloads an evidence-based AI fit report PDF for one candidate. */
export const downloadCandidateFitReport = async (
  jobId: string,
  applicationId: string,
  talentName: string,
) => {
  const response = await httpClient.get(
    `/jobs/${jobId}/applications/${applicationId}/report`,
    { responseType: 'blob' },
  )
  downloadBlobResponse(
    response.data as Blob,
    response.headers['content-disposition'],
    `fit-report-${talentName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`,
  )
}

/** Downloads one evidence-based AI fit report PDF covering several candidates. */
export const downloadBulkFitReport = async (
  jobId: string,
  applicationIds: string[],
) => {
  const response = await httpClient.post(
    `/jobs/${jobId}/applications/report`,
    { applicationIds },
    { responseType: 'blob' },
  )
  downloadBlobResponse(
    response.data as Blob,
    response.headers['content-disposition'],
    `fit-report-${applicationIds.length}-candidates.pdf`,
  )
}

export interface ApplicantMessageDraft {
  applicationId: string
  talentId: string
  talentName: string
  subject?: string
  body?: string
  error?: string
}

/** AI-drafts a personalized outreach message per selected candidate, grounded in their own match evidence. */
export const draftApplicantMessages = (
  jobId: string,
  applicationIds: string[],
  intent?: string,
) =>
  httpClient
    .post<{ data: { drafts: ApplicantMessageDraft[] } }>(
      `/jobs/${jobId}/applicants/messages/draft`,
      { applicationIds, intent },
    )
    .then((response) => response.data.data.drafts)
