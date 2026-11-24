import { createApi } from '@reduxjs/toolkit/query/react'

import type {
  ApplicationGroup,
  CandidatePipeline,
  PayComparison,
  TalentApplications,
} from '@/features/talent-applications/types'

import { customBaseQuery } from '../../../utils/customBaseQuery'

export type CompanyAssessmentKind = 'problem-solving' | 'culture-fit'

export const talentApi = createApi({
  reducerPath: 'talentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Applications', 'Jobs', 'Roles'],
  endpoints: (builder) => ({
    fetchJobs: builder.query({
      query: (params?: {
        workMode?: string
        experienceLevel?: string
        employmentType?: string
        minMonthlySalary?: number
        postedWithin?: 'week'
        state?: string
        q?: string
        offset?: number
      }) => {
        const query = new URLSearchParams({
          limit: '10',
          offset: String(params?.offset ?? 0),
        })
        if (params?.workMode) query.set('workMode', params.workMode)
        if (params?.experienceLevel)
          query.set('experienceLevel', params.experienceLevel)
        if (params?.employmentType)
          query.set('employmentType', params.employmentType)
        if (params?.minMonthlySalary) {
          query.set('minMonthlySalary', String(params.minMonthlySalary))
          query.set('currency', 'NGN')
        }
        if (params?.postedWithin) query.set('postedWithin', params.postedWithin)
        if (params?.state) query.set('state', params.state)
        if (params?.q?.trim()) query.set('q', params.q.trim())

        return { url: `/jobs?${query.toString()}`, method: 'GET' }
      },
      providesTags: ['Jobs'],
    }),
    saveJob: builder.mutation<
      { saved: boolean },
      { jobId: string; saved: boolean }
    >({
      query: ({ jobId, saved }) => ({
        url: `/jobs/${jobId}/save`,
        method: saved ? 'PUT' : 'DELETE',
      }),
      invalidatesTags: ['Jobs'],
    }),
    individualJob: builder.query({
      query: (jobId) => ({
        url: `/jobs/${jobId}`,
        method: 'GET',
      }),
      providesTags: ['Jobs'],
    }),
    applyToJob: builder.mutation({
      query: ({ jobId, note }: { jobId: string; note?: string }) => ({
        url: `/jobs/applications/${jobId}`,
        method: 'PATCH',
        body: note ? { note } : {},
      }),
      invalidatesTags: ['Applications', 'Jobs'],
    }),
    payComparison: builder.query<PayComparison, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/pay-comparison`,
        method: 'GET',
      }),
      transformResponse: (response: { data: PayComparison }) => response.data,
    }),
    generatePersonalizedTest: builder.query({
      query: ({ jobId, talentId }) => ({
        url: `/questions/personalized`,
        method: 'POST',
        body: { jobId, talentId },
      }),
      providesTags: ['Applications'],
    }),
    postPersonalizedTest: builder.mutation({
      query: (testAnswer) => ({
        url: `/questions/answer/personalized`,
        method: 'POST',
        body: testAnswer,
      }),
      invalidatesTags: ['Applications'],
    }),
    personalityTest: builder.query({
      query: (jobId) => ({
        url: `/questions?limit=200&offset=0&jobId=${jobId}&questionType=personality`,
        method: 'GET',
      }),
      providesTags: ['Applications'],
    }),
    // Talent-safe (unlike POST /questions/personality, which is recruiter-only)
    // and idempotent — safe to call as a retry when generation hasn't happened
    // yet or appears to have failed.
    ensurePersonalityQuestions: builder.mutation({
      query: (jobId: string) => ({
        url: `/questions/personality/ensure`,
        method: 'POST',
        body: { jobId },
      }),
    }),
    // Problem-solving / culture-fit tests (plan Day 4-5). The candidate gets the
    // same set of questions every time; no criteria and no score come back.
    companyAssessmentQuestions: builder.query({
      query: ({
        jobId,
        type,
      }: {
        jobId: string
        type: CompanyAssessmentKind
      }) => ({
        url: `/questions/candidate/${type}?jobId=${jobId}`,
        method: 'GET',
      }),
    }),
    submitCompanyAssessmentAnswers: builder.mutation({
      query: ({
        jobId,
        type,
        answers,
      }: {
        jobId: string
        type: CompanyAssessmentKind
        answers: Record<string, number>
      }) => ({
        url: `/questions/answer/${type}`,
        method: 'POST',
        body: { jobId, answers },
      }),
      invalidatesTags: ['Applications'],
    }),
    postPersonalityTest: builder.mutation({
      query: (testAnswer) => ({
        url: `/questions/answer/personality`,
        method: 'POST',
        body: testAnswer,
      }),
      invalidatesTags: ['Applications'],
    }),
    allJobApplications: builder.query<
      TalentApplications,
      { group?: ApplicationGroup; limit?: number } | void
    >({
      query: (params) => {
        const query = new URLSearchParams({
          limit: String(params?.limit ?? 200),
          offset: '0',
        })
        if (params?.group) query.set('group', params.group)
        return { url: `/user/applications?${query.toString()}`, method: 'GET' }
      },
      transformResponse: (response: { data: TalentApplications }) =>
        response.data,
      providesTags: ['Applications'],
    }),
    applicationPipeline: builder.query<CandidatePipeline, string>({
      query: (applicationId) => ({
        url: `/user/applications/${applicationId}/pipeline`,
        method: 'GET',
      }),
      transformResponse: (response: { data: CandidatePipeline }) =>
        response.data,
      providesTags: ['Applications'],
    }),
    candidateInterview: builder.query({
      query: (interviewId: string) => ({
        url: `/interviews/${interviewId}`,
        method: 'GET',
      }),
    }),
    getRole: builder.query({
      query: () => ({
        url: `/roles?limit=1000`,
        method: 'GET',
      }),
      providesTags: ['Roles'],
    }),
  }),
})

export const {
  useFetchJobsQuery,
  useSaveJobMutation,
  useIndividualJobQuery,
  useApplyToJobMutation,
  usePayComparisonQuery,
  useGeneratePersonalizedTestQuery,
  usePostPersonalizedTestMutation,
  usePersonalityTestQuery,
  usePostPersonalityTestMutation,
  useEnsurePersonalityQuestionsMutation,
  useAllJobApplicationsQuery,
  useGetRoleQuery,
  useCandidateInterviewQuery,
  useApplicationPipelineQuery,
  useCompanyAssessmentQuestionsQuery,
  useSubmitCompanyAssessmentAnswersMutation,
} = talentApi
