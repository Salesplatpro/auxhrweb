import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJobDraftStore } from '@/features/jobs/store/useJobDraftStore'
import { PostJobFormValues } from '@/utils/jobPostTypes'

import PostJob from './PostJob'
import { EMPTY_JOB_FORM } from './utils/jobFormValues'

const { createMock, updateMock, navigateMock, notifyMock, jobQueryMock } =
  vi.hoisted(() => ({
    createMock: vi.fn(),
    updateMock: vi.fn(),
    navigateMock: vi.fn(),
    notifyMock: vi.fn(),
    jobQueryMock: vi.fn(),
  }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/redux/api/recruiter', () => ({
  useJobPostCreationMutation: () => [createMock, { isLoading: false }],
  useUpdateJobMutation: () => [updateMock, { isLoading: false }],
}))

vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: (...args: unknown[]) => jobQueryMock(...args),
  useGetRoleQuery: () => ({
    data: { data: [{ id: 'role-1', name: 'engineer' }] },
  }),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { activeOrganization: { name: 'Acme' } } }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const VALID: PostJobFormValues = {
  ...EMPTY_JOB_FORM,
  role: 'role-1',
  jobBrief: '<p>Brief</p>',
  requirements: '<p>Req</p>',
  experienceLevel: '1-3 years',
  workMode: ['remote'],
  currency: 'NGN',
  minSalary: '100',
  compensationPeriod: 'monthly',
  skills: ['Go'],
  goals: ['Ship'],
}

vi.mock('./JobDetailsFields', () => ({
  JobDetailsFields: ({
    values,
    setFieldValue,
    roleDisabled,
  }: {
    values: PostJobFormValues
    setFieldValue: (key: keyof PostJobFormValues, value: unknown) => void
    roleDisabled?: boolean
  }) => (
    <div>
      <p>Role value: {values.role || 'none'}</p>
      <p>Role locked: {String(!!roleDisabled)}</p>
      <button
        type="button"
        onClick={() =>
          (Object.keys(VALID) as (keyof PostJobFormValues)[]).forEach((key) =>
            setFieldValue(key, VALID[key]),
          )
        }>
        Fill valid
      </button>
    </div>
  ),
}))

const renderPostJob = (props: React.ComponentProps<typeof PostJob> = {}) =>
  render(
    <MemoryRouter>
      <PostJob {...props} />
    </MemoryRouter>,
  )

describe('PostJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useJobDraftStore.getState().clearDraft()
    jobQueryMock.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('does not submit an incomplete job', async () => {
    renderPostJob()
    fireEvent.click(
      screen.getByRole('button', { name: /continue to ai configuration/i }),
    )
    await waitFor(() => expect(createMock).not.toHaveBeenCalled())
  })

  it('creates the job, clears the draft and moves to screening', async () => {
    createMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { job: { id: 'job-9' } } }),
    })
    renderPostJob()

    fireEvent.click(screen.getByRole('button', { name: 'Fill valid' }))
    fireEvent.click(
      screen.getByRole('button', { name: /continue to ai configuration/i }),
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/postjob/job-9',
      ),
    )
    expect(createMock.mock.calls[0][0]).toMatchObject({
      role: 'role-1',
      workMode: ['remote'],
      locationCountry: null,
    })
    expect(useJobDraftStore.getState().draft).toBeNull()
  })

  it('keeps the draft and shows the error when creation fails', async () => {
    createMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: { message: 'No company' } } }),
    })
    renderPostJob()

    fireEvent.click(screen.getByRole('button', { name: 'Fill valid' }))
    fireEvent.click(
      screen.getByRole('button', { name: /continue to ai configuration/i }),
    )

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith('error', 'No company'),
    )
    expect(navigateMock).not.toHaveBeenCalled()
    expect(useJobDraftStore.getState().draft?.role).toBe('role-1')
  })

  it('reports a missing job id instead of navigating', async () => {
    createMock.mockReturnValue({ unwrap: () => Promise.resolve({ data: {} }) })
    renderPostJob()

    fireEvent.click(screen.getByRole('button', { name: 'Fill valid' }))
    fireEvent.click(
      screen.getByRole('button', { name: /continue to ai configuration/i }),
    )

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/no ID/i),
      ),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('restores a saved draft and says when it was saved', () => {
    useJobDraftStore.getState().saveDraft({ ...EMPTY_JOB_FORM, role: 'role-1' })
    renderPostJob()
    expect(screen.getByText('Draft saved')).toBeTruthy()
    expect(screen.getByText(/you can leave and finish later/i)).toBeTruthy()
    expect(screen.getByText('Role value: role-1')).toBeTruthy()
  })

  it('saves as a draft and goes back to Job Posts', async () => {
    createMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { job: { id: 'job-9' } } }),
    })
    renderPostJob()

    fireEvent.click(screen.getByRole('button', { name: 'Fill valid' }))
    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }))

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/myJobPosts',
      ),
    )
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(useJobDraftStore.getState().draft).toBeNull()
  })

  it('goes back to Job Posts', () => {
    renderPostJob()
    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))
    expect(navigateMock).toHaveBeenCalledWith('/recruiterDashboard/myJobPosts')
  })

  it('fills in fields missing from an older saved draft', () => {
    useJobDraftStore
      .getState()
      .saveDraft({ role: 'role-1' } as unknown as PostJobFormValues)
    renderPostJob()
    expect(screen.getByText('Role value: role-1')).toBeTruthy()
  })

  it('shows the preview beside the form', () => {
    renderPostJob()
    expect(screen.getByText(/what candidates will see/i)).toBeTruthy()
  })

  it('edits an existing job with the role locked and no local draft', async () => {
    jobQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          job: {
            ...VALID,
            role: { id: 'role-1', name: 'engineer' },
            minSalary: 100,
          },
        },
      },
    })
    updateMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    renderPostJob({ jobId: 'job-1' })

    expect(screen.getByText('Role locked: true')).toBeTruthy()
    expect(jobQueryMock).toHaveBeenCalledWith('job-1', { skip: false })

    fireEvent.click(
      screen.getByRole('button', { name: /continue to ai configuration/i }),
    )

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/postjob/job-1',
      ),
    )
    expect(updateMock.mock.calls[0][0].jobId).toBe('job-1')
    expect(useJobDraftStore.getState().draft).toBeNull()
  })

  it('does not fetch a job when creating', () => {
    renderPostJob()
    expect(jobQueryMock).toHaveBeenCalledWith(undefined, { skip: true })
  })
})
