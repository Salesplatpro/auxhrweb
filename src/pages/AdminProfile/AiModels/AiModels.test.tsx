import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AiFeature,
  AiModelsOverview,
  AiPromptPart,
} from '@/features/admin/types'

import AiModels from './AiModels'

const {
  fetchAiModelsMock,
  saveAiFeatureModelMock,
  fetchAiFeaturePromptsMock,
  saveAiFeaturePromptsMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAiModelsMock: vi.fn(),
  saveAiFeatureModelMock: vi.fn(),
  fetchAiFeaturePromptsMock: vi.fn(),
  saveAiFeaturePromptsMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/features/admin/services/adminService', () => ({
  fetchAiModels: fetchAiModelsMock,
  saveAiFeatureModel: saveAiFeatureModelMock,
  fetchAiFeaturePrompts: fetchAiFeaturePromptsMock,
  saveAiFeaturePrompts: saveAiFeaturePromptsMock,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const verdictJob: AiFeature = {
  key: 'applicant_verdict',
  name: 'Applicant verdict AI',
  description: 'Gives a finished applicant a verdict.',
  group: 'Matching',
  lockedReason: null,
  current: { provider: 'openai', model: 'gpt-4o' },
  usingDefault: true,
  notice: null,
  updatedAt: null,
  updatedByName: null,
  promptParts: 1,
  editedPromptParts: 0,
  options: [
    {
      provider: 'openai',
      model: 'gpt-4o',
      label: 'GPT-4o',
      retiresOn: '2027-01-14',
      replacement: 'gpt-6-luna',
    },
    {
      provider: 'openai',
      model: 'gpt-6-luna',
      label: 'GPT-6 Luna',
      retiresOn: null,
      replacement: null,
    },
    {
      provider: 'gemini',
      model: 'gemini-3.6-flash',
      label: 'Gemini 3.6 Flash',
      retiresOn: null,
      replacement: null,
    },
    {
      provider: 'grok',
      model: 'grok-4.7',
      label: 'Grok 4.7',
      retiresOn: null,
      replacement: null,
    },
  ],
}

const cvMatching: AiFeature = {
  ...verdictJob,
  key: 'cv_matching',
  name: 'CV matching AI',
  description: 'Ranks who fits a job.',
  lockedReason: "Vectors from different models can't be compared.",
  current: { provider: 'openai', model: 'text-embedding-3-small' },
  promptParts: 0,
  options: [
    {
      provider: 'openai',
      model: 'text-embedding-3-small',
      label: 'Text Embedding 3 Small',
      retiresOn: null,
      replacement: null,
    },
  ],
}

const overview: AiModelsOverview = {
  verifiedOn: '2026-11-04',
  providers: [
    {
      key: 'openai',
      name: 'OpenAI',
      envKey: 'OPENAI_API_KEY',
      configured: true,
      docsUrl: 'https://developers.openai.com/api/docs/models',
    },
    {
      key: 'gemini',
      name: 'Google Gemini',
      envKey: 'GEMINI_API_KEY',
      configured: true,
      docsUrl: 'https://aistudio.google.com/docs/models',
    },
    {
      key: 'grok',
      name: 'xAI Grok',
      envKey: 'GROK_API_KEY',
      configured: false,
      docsUrl: 'https://docs.x.ai/docs/models',
    },
  ],
  features: [cvMatching, verdictJob],
}

const promptPart: AiPromptPart = {
  key: 'system',
  label: 'Instructions',
  text: 'Judge {{count}} applicants. Output JSON.',
  defaultText: 'Judge {{count}} applicants. Output JSON.',
  edited: false,
  problem: null,
  variables: [{ name: 'count', description: 'How many to write or score' }],
}

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AiModels />
    </SWRConfig>,
  )

describe('AiModels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchAiModelsMock.mockResolvedValue(overview)
  })

  it('lists each AI job by name, with what it does', async () => {
    renderPage()

    expect(await screen.findByText('CV matching AI')).toBeTruthy()
    expect(screen.getByText('Ranks who fits a job.')).toBeTruthy()
    expect(screen.getByText('Applicant verdict AI')).toBeTruthy()
  })

  it('shows CV matching AI as locked, with no way to change it', async () => {
    renderPage()

    await screen.findByText('CV matching AI')

    expect(screen.getByText('Text Embedding 3 Small')).toBeTruthy()
    expect(screen.getByText(/can't be compared/)).toBeTruthy()
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
  })

  it('warns when a job is on a retiring model and names its replacement', async () => {
    renderPage()

    expect(
      await screen.findByText(
        'GPT-4o shuts down on 14 Jan 2027. Its replacement is GPT-6 Luna.',
      ),
    ).toBeTruthy()
  })

  it('disables a provider with no key and says which key to add', async () => {
    renderPage()

    const option = await screen.findByRole('option', {
      name: 'xAI Grok (add GROK_API_KEY)',
    })

    expect((option as HTMLOptionElement).disabled).toBe(true)
  })

  it('saves the chosen model and shows the result', async () => {
    saveAiFeatureModelMock.mockResolvedValue({
      ...verdictJob,
      current: { provider: 'gemini', model: 'gemini-3.6-flash' },
      usingDefault: false,
    })
    renderPage()

    const save = await screen.findByRole('button', { name: 'Test and save' })
    expect((save as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Provider'), {
      target: { value: 'gemini' },
    })
    fireEvent.click(save)

    await waitFor(() =>
      expect(saveAiFeatureModelMock).toHaveBeenCalledWith('applicant_verdict', {
        provider: 'gemini',
        model: 'gemini-3.6-flash',
      }),
    )
    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'success',
        'Applicant verdict AI saved',
      ),
    )
  })

  it("shows the server's reason when a model fails its test", async () => {
    saveAiFeatureModelMock.mockRejectedValue({
      response: {
        data: { error: { message: "GPT-6 Luna didn't pass the test." } },
      },
    })
    renderPage()

    const save = await screen.findByRole('button', { name: 'Test and save' })
    fireEvent.change(screen.getByLabelText('Model'), {
      target: { value: 'gpt-6-luna' },
    })
    fireEvent.click(save)

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        "GPT-6 Luna didn't pass the test.",
      ),
    )
  })

  it('edits only the part that changed and saves it', async () => {
    fetchAiFeaturePromptsMock.mockResolvedValue([promptPart])
    saveAiFeaturePromptsMock.mockResolvedValue([
      {
        ...promptPart,
        text: 'Rate {{count}} applicants. Output JSON.',
        edited: true,
      },
    ])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit prompt' }))

    const text = await screen.findByLabelText('Instructions')
    expect((text as HTMLTextAreaElement).value).toBe(
      'Judge {{count}} applicants. Output JSON.',
    )
    expect(screen.getByText('{{count}}')).toBeTruthy()

    const save = screen.getByRole('button', { name: 'Save' })
    expect((save as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(text, {
      target: { value: 'Rate {{count}} applicants. Output JSON.' },
    })
    fireEvent.click(save)

    await waitFor(() =>
      expect(saveAiFeaturePromptsMock).toHaveBeenCalledWith(
        'applicant_verdict',
        {
          system: 'Rate {{count}} applicants. Output JSON.',
        },
      ),
    )
    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'success',
        'Applicant verdict AI prompt saved',
      ),
    )
  })

  it('resets an edited part back to its default text', async () => {
    fetchAiFeaturePromptsMock.mockResolvedValue([
      { ...promptPart, text: 'Rate {{count}}. JSON.', edited: true },
    ])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit prompt' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Reset to default' }),
    )

    expect(
      (screen.getByLabelText('Instructions') as HTMLTextAreaElement).value,
    ).toBe('Judge {{count}} applicants. Output JSON.')
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })

  it("keeps the editor open and shows the server's reason when a prompt is refused", async () => {
    fetchAiFeaturePromptsMock.mockResolvedValue([promptPart])
    saveAiFeaturePromptsMock.mockRejectedValue({
      response: {
        data: { error: { message: 'Instructions must keep {{count}}' } },
      },
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Edit prompt' }))
    fireEvent.change(await screen.findByLabelText('Instructions'), {
      target: { value: 'Judge applicants. Output JSON.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        'Instructions must keep {{count}}',
      ),
    )
    expect(screen.getByLabelText('Instructions')).toBeTruthy()
  })

  it('offers a retry when the page fails to load', async () => {
    fetchAiModelsMock.mockRejectedValue(new Error('Network'))

    renderPage()

    expect(
      await screen.findByText("We couldn't load the AI models"),
    ).toBeTruthy()
  })
})
