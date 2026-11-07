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

    const resend = screen.getByRole('button', { name: 'Resend email' })
    expect(resend).toHaveProperty('disabled', true)
    expect(screen.getByText(/You can resend in 1:00/)).toBeTruthy()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('button', { name: 'Resend email' })).toHaveProperty(
      'disabled',
      false,
    )
    expect(screen.getByText(/You can resend it now/)).toBeTruthy()
  })

  it('sends once when resend is clicked twice quickly', async () => {
    let resolve: () => void = () => undefined
    const onResend = vi.fn(() => new Promise<void>((done) => (resolve = done)))
    renderScreen(onResend)
    act(() => vi.advanceTimersByTime(60_000))

    const resend = screen.getByRole('button', { name: 'Resend email' })
    fireEvent.click(resend)
    fireEvent.click(resend)
    expect(onResend).toHaveBeenCalledTimes(1)

    await act(async () => resolve())
    expect(screen.getByText(/Only the newest link will work/)).toBeTruthy()
    expect(screen.getByText(/You can resend in 1:00/)).toBeTruthy()
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
      fireEvent.click(screen.getByRole('button', { name: 'Resend email' }))
    })
    expect(
      screen.getByText('Too many attempts, please try again later.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resend email' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('offers to change the email only when asked to', () => {
    const onChangeEmail = vi.fn()
    const { rerender } = renderScreen(vi.fn())
    expect(
      screen.queryByRole('button', { name: 'Change email address' }),
    ).toBeNull()

    rerender(
      <MemoryRouter>
        <CheckEmailScreen
          message="We sent a link."
          onResend={vi.fn()}
          onChangeEmail={onChangeEmail}
        />
      </MemoryRouter>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Change email address' }),
    )
    expect(onChangeEmail).toHaveBeenCalledTimes(1)
  })
})
