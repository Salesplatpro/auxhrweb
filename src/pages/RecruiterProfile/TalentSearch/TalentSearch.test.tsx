import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useScoutStore } from '@/features/scout/store/useScoutStore'
import type { TalentSearchResult } from '@/features/scout/types'

import { TalentSearch } from './TalentSearch'

const {
  searchTalentsMock,
  messageCandidateMock,
  sendMessageMock,
  notifyMock,
  resetMock,
} = vi.hoisted(() => ({
  searchTalentsMock: vi.fn(),
  messageCandidateMock: vi.fn(),
  sendMessageMock: vi.fn(),
  notifyMock: vi.fn(),
  resetMock: vi.fn(),
}))

let searchState: Record<string, unknown> = {
  data: undefined,
  isLoading: false,
  isError: false,
}

vi.mock('@/redux/api/recruiter', () => ({
  useSearchTalentsMutation: () => [
    searchTalentsMock,
    { ...searchState, reset: resetMock },
  ],
  useMessageScoutCandidateMutation: () => [
    messageCandidateMock,
    { isLoading: false },
  ],
  useGetRoleQuery: () => ({ data: { data: { roles: [] } }, isLoading: false }),
}))

vi.mock('@/features/messaging/services/messagingService', () => ({
  sendMessage: sendMessageMock,
}))

vi.mock('@/utils/toastNotifications', () => ({
  notify: notifyMock,
  notifyPromise: vi.fn(),
}))

vi.mock('@/components/forms/Roles/RoleSelect', () => ({
  RoleSelect: ({ label }: { label?: string }) => <div>{label}</div>,
}))

const registered: TalentSearchResult = {
  id: 't-1',
  source: 'registered',
  name: 'Ada Obi',
  headline: 'Enterprise AE',
  email: 'ada@example.com',
  phone: null,
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
  skills: ['negotiation'],
  yearsExperience: 6,
  experienceLevel: '4-6 years',
  matchScore: 91,
  strengths: ['Five years selling into banks, per the CV.'],
  weaknesses: ['No public-sector experience mentioned.'],
  canMessage: true,
}

const sourced: TalentSearchResult = {
  ...registered,
  id: 'cand-1',
  source: 'sourced',
  name: 'Ben Musa',
  email: 'ben@example.com',
  matchScore: 78,
  strengths: undefined,
  weaknesses: undefined,
  canMessage: false,
}

const DESCRIPTION =
  'An enterprise account executive who has sold payments software to Nigerian banks.'

const withResults = (results: TalentSearchResult[], total = results.length) => {
  searchState = {
    data: { data: { results, total } },
    isLoading: false,
    isError: false,
  }
}

const renderPage = (path = '/recruiterDashboard/talent-search') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TalentSearch />
    </MemoryRouter>,
  )

const describeAndSearch = () => {
  fireEvent.change(screen.getByLabelText(/who are you looking for/i), {
    target: { value: DESCRIPTION },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  useScoutStore.getState().resetScout()
  searchState = { data: undefined, isLoading: false, isError: false }
  searchTalentsMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  sendMessageMock.mockResolvedValue({})
  messageCandidateMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
})

describe('TalentSearch form', () => {
  it('will not search on a description too short to match against', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/who are you looking for/i), {
      target: { value: 'sales guy' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }))

    expect(
      await screen.findByText('Add a bit more detail — at least 20 characters'),
    ).toBeTruthy()
    expect(searchTalentsMock).not.toHaveBeenCalled()
  })

  it('will not search with no description at all', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }))

    expect(
      await screen.findByText('Describe the person you are looking for'),
    ).toBeTruthy()
    expect(searchTalentsMock).not.toHaveBeenCalled()
  })

  it('sends the description and asks for the first page', async () => {
    renderPage()
    describeAndSearch()

    await waitFor(() => {
      expect(searchTalentsMock).toHaveBeenCalled()
    })
    const payload = searchTalentsMock.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(payload.description).toBe(DESCRIPTION)
    expect(payload.limit).toBe(20)
    expect(payload.offset).toBe(0)
  })

  it('remembers the last search so it replays on a return visit', async () => {
    renderPage()
    describeAndSearch()

    await waitFor(() => {
      expect(useScoutStore.getState().criteria?.description).toBe(DESCRIPTION)
    })
  })
})

describe('TalentSearch from the header search', () => {
  const STORED = {
    description: 'A stored search from last week about payments engineers.',
    role: '',
    experienceLevel: '',
    workMode: '',
    location: { country: null, state: null, city: null },
  }

  it('fills the form without running a charged search, even with a stored one', async () => {
    useScoutStore.getState().setCriteria(STORED as never)
    renderPage('/recruiterDashboard/talent-search?q=Senior%20designer')

    const field = (await screen.findByLabelText(
      /who are you looking for/i,
    )) as HTMLTextAreaElement
    await waitFor(() => expect(field.value).toBe('Senior designer'))
    expect(searchTalentsMock).not.toHaveBeenCalled()
    expect(useScoutStore.getState().criteria).toBeNull()
  })

  it('runs exactly one search once the recruiter submits', async () => {
    renderPage('/recruiterDashboard/talent-search?q=Senior%20designer')
    describeAndSearch()

    await waitFor(() => expect(searchTalentsMock).toHaveBeenCalledTimes(1))
    const payload = searchTalentsMock.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(payload.description).toBe(DESCRIPTION)
  })
})

describe('TalentSearch results', () => {
  it('shows registered and sourced candidates, labelled', async () => {
    withResults([registered, sourced])
    renderPage()

    expect(await screen.findByText('Ada Obi')).toBeTruthy()
    expect(screen.getByText('Ben Musa')).toBeTruthy()
    expect(screen.getByText('Registered')).toBeTruthy()
    expect(screen.getByText('Sourced')).toBeTruthy()
    expect(screen.getByText('2 candidates found')).toBeTruthy()
  })

  it('shows the AI evidence where there is some', async () => {
    withResults([registered])
    renderPage()

    expect(
      await screen.findByText('Five years selling into banks, per the CV.'),
    ).toBeTruthy()
  })

  it('falls back to the match score when the evidence pass returned nothing', async () => {
    withResults([sourced])
    renderPage()

    expect(await screen.findByText('Ranked on CV similarity')).toBeTruthy()
  })

  it('asks for the next page by offset', async () => {
    withResults([registered], 60)
    // Paging replays the stored search, so there has to be one.
    useScoutStore.getState().setCriteria({
      description: DESCRIPTION,
      role: '',
      experienceLevel: '',
      workMode: '',
      location: {
        country: { name: '', isoCode: '' },
        state: { name: '', isoCode: '' },
        city: { name: '', isoCode: '' },
      },
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /next/i }))

    await waitFor(() => {
      const last = searchTalentsMock.mock.calls.at(-1)?.[0] as {
        offset?: number
      }
      expect(last?.offset).toBe(20)
    })
  })

  it('explains an empty result set rather than showing a blank table', async () => {
    withResults([])
    useScoutStore.getState().setCriteria({
      description: DESCRIPTION,
      role: '',
      experienceLevel: '',
      workMode: '',
      location: {
        country: { name: '', isoCode: '' },
        state: { name: '', isoCode: '' },
        city: { name: '', isoCode: '' },
      },
    })
    renderPage()

    expect(
      await screen.findByText('No one matched that description'),
    ).toBeTruthy()
  })

  it('shows an error state when the search fails', async () => {
    searchState = { data: undefined, isLoading: false, isError: true }
    renderPage()

    expect(await screen.findByText("That search didn't work")).toBeTruthy()
  })
})

describe('TalentSearch messaging', () => {
  it('drafts an opener grounded in the CV, and lets it be edited before sending', async () => {
    withResults([registered])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Message' }))

    const composer = screen.getByLabelText(
      'Your message',
    ) as HTMLTextAreaElement
    expect(composer.value).toContain('Hi Ada,')
    expect(composer.value).toContain('five years selling into banks')

    fireEvent.change(composer, { target: { value: 'My own words' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith({
        content: 'My own words',
        recipient: 't-1',
      })
    })
  })

  it('routes a sourced candidate through the scout endpoint', async () => {
    withResults([sourced])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Message' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(messageCandidateMock).toHaveBeenCalledWith(
        expect.objectContaining({ candidateId: 'cand-1' }),
      )
    })
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('warns that a sourced candidate may not have an account yet', async () => {
    withResults([sourced])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Message' }))
    expect(screen.getByText(/haven't signed up yet/i)).toBeTruthy()
  })

  it('reports a send failure instead of closing as though it worked', async () => {
    withResults([registered])
    sendMessageMock.mockRejectedValue(new Error('nope'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Message' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith('error', expect.any(String))
    })
    expect(screen.getByLabelText('Your message')).toBeTruthy()
  })

  it('cannot send an empty message', async () => {
    withResults([registered])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Message' }))
    fireEvent.change(screen.getByLabelText('Your message'), {
      target: { value: '   ' },
    })

    expect(
      screen
        .getByRole('button', { name: 'Send message' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})
