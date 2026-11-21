import { httpClient } from '@/features/auth/services/httpClient'

import type {
  CompanyQuestion,
  JobWithWaitingReferees,
} from './companyQuestions'
import type { Envelope } from './types'

const base = (organizationId: string) =>
  `/organizations/${organizationId}/reference-questions`

export const companyQuestionsKey = base

export const waitingJobsKey = (organizationId: string) =>
  `${base(organizationId)}/jobs`

export const fetchCompanyQuestions = (organizationId: string) =>
  httpClient
    .get<Envelope<{ questions: CompanyQuestion[] }>>(base(organizationId))
    .then((response) => response.data.data.questions)

export const saveCompanyQuestions = (
  organizationId: string,
  questions: CompanyQuestion[],
) =>
  httpClient
    .put<Envelope<{ questions: CompanyQuestion[] }>>(base(organizationId), {
      questions,
    })
    .then((response) => response.data.data.questions)

export const generateCompanyQuestions = (
  organizationId: string,
  count: number,
) =>
  httpClient
    .post<Envelope<{ questions: CompanyQuestion[] }>>(
      `${base(organizationId)}/generate`,
      { count },
    )
    .then((response) => response.data.data.questions)

export const fetchWaitingJobs = (organizationId: string) =>
  httpClient
    .get<Envelope<{ jobs: JobWithWaitingReferees[] }>>(
      waitingJobsKey(organizationId),
    )
    .then((response) => response.data.data.jobs)

export const sendCompanyQuestions = (
  organizationId: string,
  jobIds: string[],
) =>
  httpClient
    .post<Envelope<{ sent: number; failed: number }>>(
      `${base(organizationId)}/send`,
      { jobIds },
    )
    .then((response) => response.data.data)
