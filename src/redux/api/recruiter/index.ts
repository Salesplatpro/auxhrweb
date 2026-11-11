import { createApi } from '@reduxjs/toolkit/query/react'

import type {
  CampaignListResponse,
  CampaignResponse,
  RunDetailResponse,
  RunListResponse,
  RunResponse,
  ShortlistResponse,
  TalentSearchResponse,
} from '../../../features/scout/types'
import { customBaseQuery } from '../../../utils/customBaseQuery'
import type { RecruiterJobsData } from '../../../utils/recruiterJobPostsTypes'

export type RecruiterJobsQuery = {
  limit?: number
  offset?: number
  status?: string
  q?: string
  state?: string
  workMode?: string
  experienceLevel?: string
  employmentType?: string
  sort?: 'asc' | 'desc'
}

export type SalaryComparisonQuery = {
  roleId: string
  experienceLevel: string
  currency: string
  compensationPeriod: string
  locationCity?: string
  locationState?: string
  locationCountry?: string
  excludeJobId?: string
}

export type SalaryComparison =
  | { available: false }
  | {
      available: true
      count: number
      low: number
      middle: number
      high: number
      currency: string
      compensationPeriod: string
    }

/** Body the campaign create/update endpoints accept. */
type ScoutCampaignPayload = {
  name: string
  role: string
  jobBrief: string
  recruiterGuide: string
  shortlistSize: number
  experienceLevel?: string | null
  mustHaveSkills?: string[] | null
  niceToHaveSkills?: string[] | null
  workMode?: string | null
  locationCountry?: string | null
  locationState?: string | null
  locationCity?: string | null
}

type TalentSearchPayload = {
  description: string
  roleId?: string | null
  experienceLevel?: string | null
  workMode?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  limit?: number
  offset?: number
}

export const recruiterApi = createApi({
  reducerPath: 'recruiterApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Recruiter', 'RecruiterJob', 'ScoutJob', 'ScoutRun', 'AiConfig'],
  endpoints: (builder) => ({
    jobPostCreation: builder.mutation({
      query: (data) => ({
        url: `/jobs`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'RecruiterJob', id: 'LIST' }],
    }),
    generateJobField: builder.mutation({
      query: (data) => ({
        url: `/jobs/generate/field`,
        method: 'POST',
        body: data,
      }),
    }),
    fetchDashboard: builder.query({
      query: () => ({ url: '/recruiter/dashboard', method: 'GET' }),
    }),
    fetchAllApplications: builder.query({
      query: () => ({
        url: `/recruiter/applications`,
        method: 'GET',
      }),
    }),

    aiConfig: builder.mutation({
      query: (data) => ({
        url: `/ai-config`,
        method: 'POST',
        body: data,
      }),
      // Creating a config links it onto the job (aiConfigId) — refresh job
      // lists/detail so the "Active" status option becomes available.
      invalidatesTags: [
        { type: 'RecruiterJob', id: 'LIST' },
        { type: 'AiConfig', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Job detail / edit pages load via talentApi.individualJob
          const { talentApi } = await import('../talent')
          dispatch(talentApi.util.invalidateTags(['Jobs']))
        } catch {
          // mutation failed — leave caches alone
        }
      },
    }),

    getAiConfig: builder.query({
      query: (aiConfigId: string) => ({
        url: `/ai-config/${aiConfigId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, aiConfigId) => [
        { type: 'AiConfig', id: aiConfigId },
      ],
    }),

    getAiConfigs: builder.query({
      query: () => ({
        url: `/ai-config`,
        method: 'GET',
      }),
      providesTags: [{ type: 'AiConfig', id: 'LIST' }],
    }),

    patchAiConfig: builder.mutation({
      query: ({ aiConfigId, data }) => ({
        url: `/ai-config/${aiConfigId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { aiConfigId }) => [
        { type: 'RecruiterJob', id: 'LIST' },
        { type: 'AiConfig', id: aiConfigId },
        { type: 'AiConfig', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          const { talentApi } = await import('../talent')
          dispatch(talentApi.util.invalidateTags(['Jobs']))
        } catch {
          // mutation failed — leave caches alone
        }
      },
    }),
    fetchRecruiterJobPost: builder.query<
      { data: RecruiterJobsData },
      RecruiterJobsQuery
    >({
      query: ({ limit = 10, offset = 0, ...filters } = {}) => {
        const queryParams = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        })
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value)
        })
        return `/jobs/me?${queryParams.toString()}`
      },
      providesTags: (result) => [
        ...(result?.data.jobs ?? []).map((job) => ({
          type: 'RecruiterJob' as const,
          id: job.id,
        })),
        { type: 'RecruiterJob' as const, id: 'LIST' },
      ],
    }),
    salaryComparison: builder.query<
      { data: SalaryComparison },
      SalaryComparisonQuery
    >({
      query: (params) => ({
        url: '/jobs/salary-comparison',
        method: 'GET',
        params,
      }),
    }),
    generateCompanyQuestions: builder.mutation<
      unknown,
      { type: 'problem-solving' | 'culture-fit'; jobId: string; count: number }
    >({
      query: ({ type, jobId, count }) => ({
        url: `/questions/${type}`,
        method: 'POST',
        body: { jobId, count },
      }),
    }),
    genJpPersonality: builder.mutation({
      query: (data) => ({
        url: `/questions/personality`,
        method: 'POST',
        body: data,
      }),
    }),
    deletePersonalityQuestion: builder.mutation({
      query: (questionId: string) => ({
        url: `/questions/${questionId}`,
        method: 'DELETE',
      }),
    }),
    createScoutCampaign: builder.mutation<
      CampaignResponse,
      Partial<ScoutCampaignPayload>
    >({
      query: (data) => ({
        url: `/scout/jobs`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'ScoutJob', id: 'LIST' }],
    }),
    updateScoutCampaign: builder.mutation<
      CampaignResponse,
      { campaignId: string; data: Partial<ScoutCampaignPayload> }
    >({
      query: ({ campaignId, data }) => ({
        url: `/scout/jobs/${campaignId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [
        { type: 'ScoutJob', id: campaignId },
        { type: 'ScoutJob', id: 'LIST' },
      ],
    }),
    getScoutCampaign: builder.query<CampaignResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/scout/jobs/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'ScoutJob', id }],
    }),
    getScoutCampaigns: builder.query<
      CampaignListResponse,
      { limit?: number; offset?: number; search?: string } | void
    >({
      query: (args) => {
        const { limit = 20, offset = 0, search } = args ?? {}
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        })
        if (search?.trim()) params.append('search', search.trim())
        return { url: `/scout/jobs?${params.toString()}`, method: 'GET' }
      },
      providesTags: (result) => [
        ...(result?.data?.scoutJobs ?? []).map((job) => ({
          type: 'ScoutJob' as const,
          id: job.id,
        })),
        { type: 'ScoutJob' as const, id: 'LIST' },
      ],
    }),
    deleteScoutCampaign: builder.mutation<unknown, string>({
      query: (campaignId) => ({
        url: `/scout/jobs/${campaignId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, campaignId) => [
        { type: 'ScoutJob', id: campaignId },
        { type: 'ScoutJob', id: 'LIST' },
      ],
    }),
    startScoutRun: builder.mutation<
      RunResponse,
      { campaignId: string; body: FormData }
    >({
      query: ({ campaignId, body }) => ({
        url: `/scout/jobs/${campaignId}/runs`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [
        { type: 'ScoutRun', id: `LIST-${campaignId}` },
        { type: 'ScoutJob', id: 'LIST' },
      ],
    }),
    getScoutRun: builder.query<RunDetailResponse, { runId: string }>({
      query: ({ runId }) => ({
        url: `/scout/runs/${runId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { runId }) => [
        { type: 'ScoutRun', id: runId },
      ],
    }),
    getScoutShortlist: builder.query<ShortlistResponse, { runId: string }>({
      query: ({ runId }) => ({
        url: `/scout/runs/${runId}/shortlist`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { runId }) => [
        { type: 'ScoutRun', id: `SHORTLIST-${runId}` },
      ],
    }),
    getScoutRuns: builder.query<
      RunListResponse,
      { campaignId: string; limit?: number; offset?: number }
    >({
      query: ({ campaignId, limit = 20, offset = 0 }) => ({
        url: `/scout/jobs/${campaignId}/runs?limit=${limit}&offset=${offset}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { campaignId }) => [
        { type: 'ScoutRun', id: `LIST-${campaignId}` },
      ],
    }),
    retryScoutCv: builder.mutation<unknown, { scoutId: string; runId: string }>(
      {
        query: ({ scoutId }) => ({
          url: `/scout/cvs/${scoutId}/retry`,
          method: 'POST',
        }),
        invalidatesTags: (_result, _error, { runId }) => [
          { type: 'ScoutRun', id: runId },
          { type: 'ScoutRun', id: `SHORTLIST-${runId}` },
        ],
      },
    ),
    searchTalents: builder.mutation<TalentSearchResponse, TalentSearchPayload>({
      query: (body) => ({
        url: `/scout/talents/search`,
        method: 'POST',
        body,
      }),
    }),
    messageScoutCandidate: builder.mutation<
      unknown,
      { candidateId: string; content: string }
    >({
      query: ({ candidateId, content }) => ({
        url: `/scout/candidates/${candidateId}/message`,
        method: 'POST',
        body: { content },
      }),
    }),
    addScoutToPipeline: builder.mutation<
      unknown,
      { scoutId: string; jobId: string; talentEmail: string }
    >({
      query: ({ scoutId, jobId, talentEmail }) => ({
        url: `/scout/${scoutId}/add-to-pipeline`,
        method: 'POST',
        body: { jobId, talentEmail },
      }),
      invalidatesTags: [{ type: 'RecruiterJob', id: 'LIST' }],
    }),
    getRecruiterShortlist: builder.query({
      query: () => `recruiter/shortlist/`,
    }),
    updateJob: builder.mutation({
      query: ({ jobId, data }) => ({
        url: `/jobs/${jobId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: 'RecruiterJob', id: jobId },
        { type: 'RecruiterJob', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          const { talentApi } = await import('../talent')
          dispatch(talentApi.util.invalidateTags(['Jobs']))
        } catch {
          // mutation failed — leave caches alone
        }
      },
    }),
    deleteJob: builder.mutation({
      query: (jobId: string) => ({
        url: `/jobs/${jobId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: 'RecruiterJob', id: jobId },
        { type: 'RecruiterJob', id: 'LIST' },
      ],
    }),
    activateJobPayment: builder.mutation({
      query: (jobId: string) => ({
        url: `/jobs/${jobId}/activate-payment`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'RecruiterJob', id: 'LIST' }],
    }),
    fetchPersonalityQuestions: builder.query({
      query: (jobId: string) => ({
        url: `/questions?questionType=personality&jobId=${jobId}`,
        method: 'GET',
      }),
    }),
  }),
})

export const {
  useJobPostCreationMutation,
  useGenerateJobFieldMutation,
  useFetchDashboardQuery,
  useFetchAllApplicationsQuery,
  useAiConfigMutation,
  usePatchAiConfigMutation,
  useFetchRecruiterJobPostQuery,
  useSalaryComparisonQuery,
  useGenerateCompanyQuestionsMutation,
  useGenJpPersonalityMutation,
  useDeletePersonalityQuestionMutation,
  useCreateScoutCampaignMutation,
  useUpdateScoutCampaignMutation,
  useGetScoutCampaignQuery,
  useGetScoutCampaignsQuery,
  useDeleteScoutCampaignMutation,
  useStartScoutRunMutation,
  useGetScoutRunQuery,
  useGetScoutShortlistQuery,
  useGetScoutRunsQuery,
  useRetryScoutCvMutation,
  useSearchTalentsMutation,
  useMessageScoutCandidateMutation,
  useAddScoutToPipelineMutation,
  useGetRecruiterShortlistQuery,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useActivateJobPaymentMutation,
  useFetchPersonalityQuestionsQuery,
  useGetAiConfigQuery,
  useGetAiConfigsQuery,
} = recruiterApi
