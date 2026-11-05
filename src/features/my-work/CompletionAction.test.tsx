import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompletionRequest } from '@/features/people/types'

import { CompletionAction } from './CompletionAction'

const mocks = vi.hoisted(() => ({
  submitCompletionRequest: vi.fn(),
  withdrawCompletionRequest: vi.fn(),
  downloadMyEvidence: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  submitCompletionRequest: mocks.submitCompletionRequest,
  withdrawCompletionRequest: mocks.withdrawCompletionRequest,
  downloadMyEvidence: mocks.downloadMyEvidence,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: mocks.notify }))

const request = (
  overrides: Partial<CompletionRequest> = {},
): CompletionRequest => ({
  id: 'r-1',
  itemType: 'goal',
  itemId: 'g-1',
  itemTitle: 'Ship it',
  summary: 'I shipped it.',
  links: ['https://example.com/report'],
  files: [],
  status: 'pending',
  reviewNote: null,
  reviewedByName: null,
  reviewedAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
})

const renderAction = (
  props: Partial<React.ComponentProps<typeof CompletionAction>> = {},
) => {
  const onChanged = vi.fn()
  render(
    <CompletionAction
      staffId="s-1"
      itemType="goal"
      itemId="g-1"
      title="Ship it"
      request={undefined}
      isComplete={false}
      completedByName={null}
      onChanged={onChanged}
      {...props}
    />,
  )
  return onChanged
}

const openForm = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Request completion' }))

const send = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Send for review' }))

describe('CompletionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows who marked it complete, and no way to change it', () => {
    renderAction({ isComplete: true, completedByName: 'Hana' })

    expect(screen.getByText('Complete, marked by Hana')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('refuses to send without a summary or any evidence', async () => {
    renderAction()
    openForm()

    send()
    expect(
      await screen.findByText('Write a short summary of what you did.'),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('What did you do?'), {
      target: { value: 'I shipped it.' },
    })
    send()
    expect(
      await screen.findByText('Add a file or a link as evidence.'),
    ).toBeTruthy()
    expect(mocks.submitCompletionRequest).not.toHaveBeenCalled()
  })

  it('refuses a link that is not https', async () => {
    renderAction()
    openForm()
    fireEvent.change(screen.getByLabelText('What did you do?'), {
      target: { value: 'Done' },
    })
    fireEvent.change(screen.getByLabelText(/^Links/), {
      target: { value: 'http://example.com' },
    })
    send()

    expect(
      await screen.findByText('Links must start with https://'),
    ).toBeTruthy()
    expect(mocks.submitCompletionRequest).not.toHaveBeenCalled()
  })

  it('sends the summary, links and files together', async () => {
    const saved = request()
    mocks.submitCompletionRequest.mockResolvedValue(saved)
    const onChanged = renderAction()
    openForm()

    fireEvent.change(screen.getByLabelText('What did you do?'), {
      target: { value: '  I shipped it.  ' },
    })
    fireEvent.change(screen.getByLabelText(/^Links/), {
      target: { value: 'https://example.com/a\n\nhttps://example.com/b' },
    })
    const file = new File(['%PDF-'], 'proof.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/^Files/), {
      target: { files: [file] },
    })
    send()

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(saved))
    const [staffId, form] = mocks.submitCompletionRequest.mock.calls[0]! as [
      string,
      FormData,
    ]
    expect(staffId).toBe('s-1')
    expect(form.get('itemType')).toBe('goal')
    expect(form.get('itemId')).toBe('g-1')
    expect(form.get('summary')).toBe('I shipped it.')
    expect(form.getAll('links')).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ])
    expect((form.get('files') as File).name).toBe('proof.pdf')
  })

  it("keeps the form open and shows the server's reason when sending fails", async () => {
    mocks.submitCompletionRequest.mockRejectedValue({
      response: { data: { error: { message: 'Upload a PDF instead' } } },
    })
    renderAction()
    openForm()
    fireEvent.change(screen.getByLabelText('What did you do?'), {
      target: { value: 'Done' },
    })
    fireEvent.change(screen.getByLabelText(/^Links/), {
      target: { value: 'https://example.com' },
    })
    send()

    expect(await screen.findByText('Upload a PDF instead')).toBeTruthy()
    expect(screen.getByLabelText('What did you do?')).toBeTruthy()
  })

  it('shows a waiting request and lets it be withdrawn', async () => {
    mocks.withdrawCompletionRequest.mockResolvedValue(undefined)
    const onChanged = renderAction({ request: request() })

    expect(screen.getByText('Waiting for review')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'https://example.com/report' })
        .getAttribute('rel'),
    ).toBe('noopener noreferrer nofollow')

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }))

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(null))
    expect(mocks.withdrawCompletionRequest).toHaveBeenCalledWith('s-1', 'r-1')
  })

  it("shows the reviewer's note on returned work and offers to send it again", () => {
    renderAction({
      request: request({
        status: 'returned',
        reviewedByName: 'Hana',
        reviewNote: 'Add the numbers.',
      }),
    })

    expect(screen.getByText('Sent back by Hana: Add the numbers.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send again' })).toBeTruthy()
  })
})
