import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAiConfigDraftStore } from '@/features/jobs/store/useAiConfigDraftStore'

import AiConfig from './AiConfig'

const {
  createMock,
  patchMock,
  navigateMock,
  notifyMock,
  jobQueryMock,
  configsQueryMock,
  genPersonalityMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  patchMock: vi.fn(),
  navigateMock: vi.fn(),
  notifyMock: vi.fn(),
  jobQueryMock: vi.fn(),
  configsQueryMock: vi.fn(),
  genPersonalityMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ jobId: 'job-1' }),
  }
})

vi.mock('@/redux/api/recruiter', () => ({
  useAiConfigMutation: () => [createMock, { isLoading: false }],
  usePatchAiConfigMutation: () => [patchMock, { isLoading: false }],
  useGetAiConfigsQuery: () => configsQueryMock(),
  useGenerateJobFieldMutation: () => [vi.fn(), { isLoading: false }],
  useGenJpPersonalityMutation: () => [genPersonalityMock, { isLoading: false }],
  useDeletePersonalityQuestionMutation: () => [vi.fn(), { isLoading: false }],
  useFetchPersonalityQuestionsQuery: () => ({ data: undefined }),
}))

vi.mock('@/redux/api/talent', () => ({
  useIndividualJobQuery: () => jobQueryMock(),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const newJob = {
  id: 'job-1',
  role: { name: 'Engineer' },
  jobBrief: '<p>Build APIs</p>',
  aiConfig: null,
}

const resolved = (value: unknown = {}) => ({
  unwrap: () => Promise.resolve(value),
})

const renderAiConfig = () =>
  render(
    <MemoryRouter>
      <AiConfig />
    </MemoryRouter>,
  )

const nameInput = () =>
  screen.getByPlaceholderText(/backend engineer – balanced/i)
const presetButton = (name: RegExp) => screen.getByRole('button', { name })
const save = () =>
  fireEvent.click(screen.getByRole('button', { name: /save and review/i }))

describe('AiConfig (screening step)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAiConfigDraftStore.getState().clearAllDrafts()
    jobQueryMock.mockReturnValue({
      data: { data: { job: newJob } },
      isLoading: false,
    })
    configsQueryMock.mockReturnValue({
      data: { data: { aiConfigs: [] } },
      isLoading: false,
    })
    createMock.mockReturnValue(
      resolved({ data: { aiConfig: { id: 'cfg-1' } } }),
    )
    patchMock.mockReturnValue(resolved())
  })

  it('starts a new job on the Balanced preset with a generated name', () => {
    renderAiConfig()
    expect(presetButton(/balanced/i).getAttribute('aria-pressed')).toBe('true')
    expect((nameInput() as HTMLInputElement).value).toBe('Engineer – Balanced')
    expect(
      screen.getByText('Tailored questions', { selector: 'span' }),
    ).toBeTruthy()
  })

  it('shows a plain-language tip for every section', () => {
    renderAiConfig()
    expect(screen.getAllByText(/^Tip:/)).toHaveLength(7)
  })

  it('links every tip to its guide entry in a new tab', () => {
    renderAiConfig()
    const links = screen.getAllByRole('link', { name: /learn more/i })
    expect(links).toHaveLength(7)
    expect(links[1].getAttribute('href')).toBe(
      '/recruiterDashboard/guide#cv-match',
    )
    expect(links[1].getAttribute('target')).toBe('_blank')
  })

  it('has no switch for the skills test — its score is always set', () => {
    renderAiConfig()
    expect(screen.getAllByRole('switch')).toHaveLength(5)
    expect(screen.getByLabelText(/minimum skills test score/i)).toBeTruthy()
  })

  it('applies the Thorough preset and renames the setup', () => {
    renderAiConfig()
    fireEvent.click(presetButton(/thorough/i))

    expect(presetButton(/thorough/i).getAttribute('aria-pressed')).toBe('true')
    expect(
      screen
        .getByRole('switch', { name: /add a personality check/i })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      (
        screen.getByLabelText(
          /how many personality questions/i,
        ) as HTMLInputElement
      ).value,
    ).toBe('8')
    expect((nameInput() as HTMLInputElement).value).toBe('Engineer – Thorough')
  })

  it('keeps a name the recruiter typed when switching presets', () => {
    renderAiConfig()
    fireEvent.change(nameInput(), { target: { value: 'Our senior bar' } })
    fireEvent.click(presetButton(/light/i))
    expect((nameInput() as HTMLInputElement).value).toBe('Our senior bar')
  })

  it('switches to Custom once a setting is changed', () => {
    renderAiConfig()
    fireEvent.change(screen.getByLabelText(/minimum skills test score/i), {
      target: { value: '85' },
    })
    expect(screen.getByText('You changed the settings below.')).toBeTruthy()
    expect(presetButton(/balanced/i).getAttribute('aria-pressed')).toBe('false')
  })

  it('has problem-solving and culture-fit test switches, each with a 1–10 question count', () => {
    renderAiConfig()
    expect(
      screen.queryByLabelText(/number of problem-solving questions/i),
    ).toBeNull()
    fireEvent.click(
      screen.getByRole('switch', { name: /problem-solving test/i }),
    )
    const problemSolving = screen.getByLabelText(
      /number of problem-solving questions/i,
    )
    expect(problemSolving.getAttribute('max')).toBe('10')
    expect(problemSolving.getAttribute('min')).toBe('1')

    fireEvent.click(screen.getByRole('switch', { name: /culture-fit test/i }))
    expect(
      screen
        .getByLabelText(/number of culture-fit questions/i)
        .getAttribute('max'),
    ).toBe('10')
  })

  it('updates the candidate journey as settings change', () => {
    renderAiConfig()
    expect(screen.getByText('5 written questions')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('switch', { name: /ask tailored questions/i }),
    )
    expect(screen.queryByText('5 written questions')).toBeNull()
  })

  it('saves a new setup, clears the draft and goes to review without publishing', async () => {
    renderAiConfig()
    save()

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/recruiterDashboard/postjob/job-1/review',
      ),
    )
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        name: 'Engineer – Balanced',
        cvSimilarity: true,
        personalizedAssessment: true,
        personalityEvaluation: false,
      }),
    )
    expect(patchMock).not.toHaveBeenCalled()
    expect(useAiConfigDraftStore.getState().drafts['job-1']).toBeUndefined()
  })

  it('disables the save button while saving', async () => {
    let finish: (value: unknown) => void = () => {}
    createMock.mockReturnValue({
      unwrap: () => new Promise((resolve) => (finish = resolve)),
    })
    renderAiConfig()

    const button = screen.getByRole('button', { name: /save and review/i })
    fireEvent.click(button)
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(true))
    expect(navigateMock).not.toHaveBeenCalled()

    finish({})
    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
  })

  it('updates the existing setup instead of creating another', async () => {
    jobQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          job: {
            ...newJob,
            aiConfig: {
              id: 'cfg-7',
              name: 'Saved setup',
              prescreeningAssessment: true,
              minPrescreeningScore: 55,
              cvSimilarity: false,
              personalizedAssessment: false,
              personalityEvaluation: false,
            },
          },
        },
      },
    })
    renderAiConfig()

    expect((nameInput() as HTMLInputElement).value).toBe('Saved setup')
    save()

    await waitFor(() => expect(patchMock).toHaveBeenCalled())
    expect(patchMock.mock.calls[0][0]).toMatchObject({
      aiConfigId: 'cfg-7',
      data: { minPrescreeningScore: 55, cvSimilarity: false },
    })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('shows the API error and stays when saving fails', async () => {
    createMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { error: { message: 'Failed to save AI config' } },
        }),
    })
    renderAiConfig()
    save()

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        'Failed to save AI config',
      ),
    )
    expect(navigateMock).not.toHaveBeenCalled()
    expect(
      screen
        .getByRole('button', { name: /save and review/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('blocks saving without a setup name', async () => {
    renderAiConfig()
    fireEvent.change(nameInput(), { target: { value: '' } })
    save()
    expect(await screen.findByText('Give this setup a name')).toBeTruthy()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('needs at least one personality question once the check is on', async () => {
    renderAiConfig()
    fireEvent.click(
      screen.getByRole('switch', { name: /add a personality check/i }),
    )
    save()

    expect(
      await screen.findByText(/add at least one personality question/i),
    ).toBeTruthy()
    expect(createMock).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/how many personality questions/i), {
      target: { value: '3' },
    })
    await waitFor(() =>
      expect(
        screen.queryByText(/add at least one personality question/i),
      ).toBeNull(),
    )
  })

  it('writes preview questions for each trait in one go', async () => {
    genPersonalityMock.mockReturnValue(resolved({ data: { questions: [] } }))
    renderAiConfig()
    fireEvent.click(presetButton(/thorough/i))
    fireEvent.click(
      screen.getByRole('button', { name: /write preview questions/i }),
    )

    await waitFor(() => expect(genPersonalityMock).toHaveBeenCalledTimes(4))
    expect(genPersonalityMock).toHaveBeenCalledWith({
      jobId: 'job-1',
      dichotomyPair: 'EI',
      count: 2,
    })
  })

  it('copies a setup saved on another job', () => {
    configsQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          aiConfigs: [
            {
              id: 'cfg-2',
              name: 'Designer – Light',
              prescreeningAssessment: true,
              minPrescreeningScore: 50,
              cvSimilarity: false,
              personalizedAssessment: false,
              personalityEvaluation: false,
            },
          ],
        },
      },
    })
    renderAiConfig()

    fireEvent.click(
      screen.getByRole('button', { name: /choose a saved setup/i }),
    )
    fireEvent.click(screen.getByText('Designer – Light'))

    expect(presetButton(/light/i).getAttribute('aria-pressed')).toBe('true')
    expect((nameInput() as HTMLInputElement).value).toBe('Engineer – Balanced')
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('Designer – Light'),
    )
  })

  it('hides the copy picker when there is nothing to copy', () => {
    renderAiConfig()
    expect(screen.queryByText(/copy a setup from another job/i)).toBeNull()
  })

  it('restores an unsaved draft, fixing blank switches from older drafts', () => {
    useAiConfigDraftStore.getState().saveDraft('job-1', {
      name: 'Draft setup',
      minPrescreeningScore: '40',
      cvSimilarity: '',
    })
    renderAiConfig()

    expect(
      screen.getByText(/restored your unsaved screening setup/i),
    ).toBeTruthy()
    expect((nameInput() as HTMLInputElement).value).toBe('Draft setup')
    expect(
      screen
        .getByRole('switch', { name: /use cv match/i })
        .getAttribute('aria-checked'),
    ).toBe('false')
  })
})
