import { httpClient } from '@/features/auth/services/httpClient'
import { downloadBlobResponse } from '@/utils/downloadBlob'
import { SingleJobDetails } from '@/utils/recruiterJobPostsTypes'

export type ApplicationDecision = 'rejected' | 'shortlisted'

export const applicationKey = (applicationId: string) =>
  `/applications/${applicationId}`

export const fetchApplication = (applicationId: string) =>
  httpClient
    .get(applicationKey(applicationId))
    .then((response) => response.data)

export const updateApplicationStatus = (
  applicationId: string,
  status: ApplicationDecision,
) =>
  httpClient
    .patch(`${applicationKey(applicationId)}/status`, { status })
    .then((response) => response.data)

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

export const fetchJobApplications = (jobId: string) =>
  httpClient
    .get<{
      data: {
        applications: SingleJobDetails[]
        aiConfig: JobAiConfigThresholds | null
      }
    }>(jobApplicationsKey(jobId))
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
