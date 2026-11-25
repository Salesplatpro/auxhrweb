import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AiUsageOverview, AiUsageRow } from '@/features/admin/types'

import AiUsage, { formatUsd } from './AiUsage'

const { fetchAiUsageMock } = vi.hoisted(() => ({ fetchAiUsageMock: vi.fn() }))

vi.mock('@/features/admin/services/adminService', () => ({
  fetchAiUsage: fetchAiUsageMock,
}))

const row = (overrides: Partial<AiUsageRow>): AiUsageRow => ({
  key: 'job_post_writer',
  label: 'Job post writer',
  provider: null,
  calls: 4,
  failedCalls: 1,
  creditFailures: 0,
  inputTokens: 1_000_000,
  outputTokens: 500_000,
  characters: 0,
  audioSeconds: 0,
  costUsd: 0.8,
  unpricedCalls: 0,
  ...overrides,
})

const usage = (): AiUsageOverview => ({
  days: 7,
  from: '2026-11-19',
  pricesVerifiedOn: '2026-11-25',
  providers: [
    {
      key: 'openai',
      name: 'OpenAI',
      configured: true,
      outOfCreditSince: '2026-11-25T08:00:00Z',
      creditError: '429 insufficient_quota',
      balance: null,
      balanceUnit: null,
      balanceCheckedAt: null,
    },
    {
      key: 'deepseek',
      name: 'DeepSeek',
      configured: true,
      outOfCreditSince: null,
      creditError: null,
      balance: 42.5,
      balanceUnit: 'USD',
      balanceCheckedAt: '2026-11-25T09:00:00Z',
    },
    {
      key: 'grok',
      name: 'xAI Grok',
      configured: false,
      outOfCreditSince: null,
      creditError: null,
      balance: null,
      balanceUnit: null,
      balanceCheckedAt: null,
    },
  ],
  totals: {
    calls: 9,
    failedCalls: 2,
    creditFailures: 1,
    inputTokens: 1_000_000,
    outputTokens: 500_000,
    characters: 1_000,
    audioSeconds: 600,
    costUsd: 0.86,
    unpricedCalls: 2,
  },
  byProvider: [row({ key: 'openai', label: 'OpenAI' })],
  byModel: [
    row({
      key: 'openai:gpt-5.6-luna',
      label: 'GPT-5.6 Luna',
      provider: 'openai',
    }),
  ],
  byFeature: [
    row({}),
    row({
      key: 'voice_speech',
      label: 'Voice assistant: reading replies aloud',
      calls: 2,
      inputTokens: 0,
      outputTokens: 0,
      characters: 1_000,
      costUsd: 0,
      unpricedCalls: 2,
    }),
  ],
})

const renderPage = (path = '/adminDashboard/ai-usage') =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[path]}>
        <AiUsage />
      </MemoryRouter>
    </SWRConfig>,
  )

describe('AI usage page', () => {
  afterEach(cleanup)
  beforeEach(() => {
    fetchAiUsageMock.mockReset()
    fetchAiUsageMock.mockResolvedValue(usage())
  })

  it('shows totals, provider credit and usage by AI job', async () => {
    renderPage()

    expect(await screen.findByText('$0.86')).toBeTruthy()
    expect(screen.getByText(/Out of credit since/)).toBeTruthy()
    expect(
      screen.getByText('Last refusal: 429 insufficient_quota'),
    ).toBeTruthy()
    expect(screen.getByText(/42\.50 USD left/)).toBeTruthy()
    expect(screen.getByText('Not set up')).toBeTruthy()
    expect(screen.getAllByText('Job post writer').length).toBeGreaterThan(0)
    expect(screen.getByText(/billed in characters/)).toBeTruthy()
    expect(fetchAiUsageMock).toHaveBeenCalledWith(7)
  })

  it('switches the period', async () => {
    renderPage()
    await screen.findByText('$0.86')

    fireEvent.click(screen.getByRole('tab', { name: '30 days' }))

    await waitFor(() => expect(fetchAiUsageMock).toHaveBeenCalledWith(30))
  })

  it('offers a retry when the usage fails to load', async () => {
    fetchAiUsageMock.mockRejectedValue(new Error('boom'))
    renderPage()

    expect(await screen.findByText("We couldn't load AI usage")).toBeTruthy()
  })
})

describe('formatUsd', () => {
  it('shows cents, and a floor for tiny costs', () => {
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd(0.004)).toBe('<$0.01')
    expect(formatUsd(1234.5)).toBe('$1,234.50')
  })
})
