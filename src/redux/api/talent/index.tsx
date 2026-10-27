import { createApi } from '@reduxjs/toolkit/query/react'

import { customBaseQuery } from '../../../utils/customBaseQuery'

export const talentApi = createApi({
  reducerPath: 'talentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Applications', 'Jobs'],
  endpoints: (builder) => ({
    fetchPretest: builder.query({
      query: (roleId) => ({
        url: `/questions?limit=20&offset=0&questionType=prescreening&roleId=${roleId}`,
        method: 'GET',
      }),
    }),
    postPretest: builder.mutation({
      query: (testAnswer) => ({
        url: `/questions/answer/prescreening`,
        method: 'POST',
        body: testAnswer,
      }),
    }),
    fetchJobs: builder.query({
      query: (params?: {
        roleId?: string
        experienceLevel?: string
        workMode?: string
        city?: string
        state?: string
        country?: string
        offset?: number
      }) => {
        const query = new URLSearchParams({
          limit: '10',
          offset: String(params?.offset ?? 0),
        })

        if (params?.roleId) query.set('roleId', params.roleId)
        if (params?.experienceLevel)
          query.set('experienceLevel', params.experienceLevel)
        if (params?.workMode) query.set('workMode', params.workMode)
        if (params?.city) query.set('city', params.city)
        if (params?.state) query.set('state', params.state)
        if (params?.country) query.set('country', params.country)

        return { url: `/jobs?${query.toString()}`, method: 'GET' }
      },
      providesTags: ['Jobs'],
    }),
    individualJob: builder.query({
      query: (jobId) => ({
        url: `/jobs/${jobId}`,
        method: 'GET',
      }),
      providesTags: ['Jobs'],
    }),
    applyToJob: builder.mutation({
      query: (jobId: string) => ({
        url: `/jobs/applications/${jobId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Applications', 'Jobs'],
    }),
    jobApplication: builder.query({
      query: (applicationId) => ({
        url: `/applications/${applicationId}`,
        method: 'GET',
      }),
      providesTags: ['Applications'],
    }),
    checkPrescreeningStage: builder.query({
      query: (jobId) => ({
        url: `/jobs/prescreening-check/${jobId}`,
        method: 'PATCH',
      }),
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
    personalizedTest: builder.query({
      query: ({ jobId, talentId }) => ({
        url: `/questions?limit=20&offset=0&questionType=personalized&jobId=${jobId}&talentId=${talentId}`,
        method: 'GET',
      }),
      providesTags: ['Applications'],
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
    postPersonalityTest: builder.mutation({
      query: (testAnswer) => ({
        url: `/questions/answer/personality`,
        method: 'POST',
        body: testAnswer,
      }),
      invalidatesTags: ['Applications'],
    }),
    allJobApplications: builder.query({
      query: (params?: { limit?: number; offset?: number }) => {
        const query = new URLSearchParams({
          limit: String(params?.limit ?? 200),
          offset: String(params?.offset ?? 0),
        })
        return {
          url: `/user/applications?${query.toString()}`,
          method: 'GET',
        }
      },
      providesTags: ['Applications'],
    }),
    getRole: builder.query({
      query: () => ({
        url: `/roles?limit=1000`,
        method: 'GET',
      }),
    }),
  }),
})

export const {
  useFetchPretestQuery,
  usePostPretestMutation,
  useFetchJobsQuery,
  useIndividualJobQuery,
  useApplyToJobMutation,
  useJobApplicationQuery,
  useLazyCheckPrescreeningStageQuery,
  useGeneratePersonalizedTestQuery,
  usePostPersonalizedTestMutation,
  usePersonalityTestQuery,
  usePersonalizedTestQuery,
  usePostPersonalityTestMutation,
  useEnsurePersonalityQuestionsMutation,
  useAllJobApplicationsQuery,
  useGetRoleQuery,
} = talentApi
