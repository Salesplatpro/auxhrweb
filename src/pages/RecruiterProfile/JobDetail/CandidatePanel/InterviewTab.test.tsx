import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { RecruiterInterview } from '@/utils/recruiterJobPostsTypes'

import { InterviewTab } from './InterviewTab'

vi.mock('./InterviewPlayer', () => ({
  InterviewPlayer: () => <div>Player</div>,
  clock: (seconds: number) => `0:${String(seconds).padStart(2, '0')}`,
}))

const interview: RecruiterInterview = {
  id: 'i-1',
  mode: 'audio_video',
  status: 'processing',
  failed: true,
  screenLeaves: {
    count: 1,
    events: [
      {
        kind: 'tab_hidden',
        at: '2026-11-24T10:05:00.000Z',
        position: 2,
        isFollowUp: false,
      },
    ],
  },
  invitedAt: '2026-11-24T09:00:00.000Z',
  startedAt: '2026-11-24T10:00:00.000Z',
  scoringStatus: 'failed',
  scores: null,
  summary: null,
  flags: null,
  scoredAt: null,
  questions: [
    {
      id: 'q-1',
      position: 1,
      isFollowUp: false,
      question: 'Tell me about your work.',
      recorded: true,
      recordedAt: '2026-11-24T10:01:00.000Z',
      durationSeconds: 40,
      transcriptStatus: 'failed',
      transcript: null,
    },
  ],
}

describe('InterviewTab', () => {
  it('says when an interview could not be scored, still shows the answers, and lists screen leaves', () => {
    render(
      <InterviewTab
        interview={interview}
        candidate={{ firstName: 'Ada', lastName: 'Obi' }}
      />,
    )

    expect(screen.getByText("We couldn't score this interview")).toBeTruthy()
    expect(screen.getByText('Player')).toBeTruthy()
    expect(screen.getByText('Left the interview screen')).toBeTruthy()
    expect(
      screen.getByText('Switched tab or app · during question 2'),
    ).toBeTruthy()
  })
})
