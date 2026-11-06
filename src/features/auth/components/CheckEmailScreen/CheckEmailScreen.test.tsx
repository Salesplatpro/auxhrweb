import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckEmailScreen } from './CheckEmailScreen'

const renderScreen = (onResend: () => Promise<unknown>) =>
  render(
    <MemoryRouter>
      <CheckEmailScreen message="We sent a link." onResend={onResend} />
    </MemoryRouter>,
  )

describe('CheckEmailScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('blocks resending until the cooldown ends', () => {
    const onResend = vi.fn().mockResolvedValue(undefined)
    renderScreen(onResend)

    const resend = screen.getByRole('button', { name: 'Resend in 1:00' })
    expect(resend).toHaveProperty('disabled', true)

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('button', { name: 'Resend' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('sends once when resend is clicked twice quickly', async () => {
    let resolve: () => void = () => undefined
    const onResend = vi.fn(() => new Promise<void>((done) => (resolve = done)))
    renderScreen(onResend)
    act(() => vi.advanceTimersByTime(60_000))

    const resend = screen.getByRole('button', { name: 'Resend' })
    fireEvent.click(resend)
    fireEvent.click(resend)
    expect(onResend).toHaveBeenCalledTimes(1)

    await act(async () => resolve())
    expect(screen.getByText(/Only the newest link will work/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resend in 1:00' })).toBeTruthy()
  })

  it('shows the server message when resending fails', async () => {
    const onResend = vi.fn().mockRejectedValue({
      response: {
        status: 429,
        data: { message: 'Too many attempts, please try again later.' },
      },
    })
    renderScreen(onResend)
    act(() => vi.advanceTimersByTime(60_000))

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Resend' }))
    })
    expect(
      screen.getByText('Too many attempts, please try again later.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resend' })).toBeTruthy()
  })
})
