import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ForgotPasswordPage } from './ForgotPasswordPage'

const { submitForgotPasswordMock, flowState } = vi.hoisted(() => ({
  submitForgotPasswordMock: vi.fn(),
  flowState: { isRequesting: false },
}))

vi.mock('../hooks/useForgotPassword', () => ({
  useForgotPassword: () => ({
    submitForgotPassword: submitForgotPasswordMock,
    isRequesting: flowState.isRequesting,
  }),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    submitForgotPasswordMock.mockReset()
    submitForgotPasswordMock.mockResolvedValue({ status: true })
    flowState.isRequesting = false
  })

  it('sends a reset request and switches to the check email screen', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: ' talent@example.com ' },
    })

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send reset link' }),
      ).not.toHaveProperty('disabled', true),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() =>
      expect(submitForgotPasswordMock).toHaveBeenCalledWith({
        email: 'talent@example.com',
      }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Check your email' }),
      ).toBeTruthy(),
    )
    expect(screen.getByText(/talent@example.com/).textContent).toContain(
      'It expires in 2 hours',
    )
    expect(screen.getByRole('button', { name: /Resend in/ })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('rejects an invalid email format without calling the API', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.blur(screen.getByLabelText('Email'))
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() =>
      expect(screen.getByText('Enter a valid email address')).toBeTruthy(),
    )
    expect(submitForgotPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects an empty email without calling the API', async () => {
    renderPage()

    fireEvent.submit(
      screen.getByRole('button', { name: 'Send reset link' }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByText('Email is required')).toBeTruthy(),
    )
    expect(submitForgotPasswordMock).not.toHaveBeenCalled()
  })

  it('disables submit while a request is in flight', () => {
    flowState.isRequesting = true
    const { container } = renderPage()

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement
    expect(submit).toHaveProperty('disabled', true)
    fireEvent.submit(submit.closest('form')!)
    expect(submitForgotPasswordMock).not.toHaveBeenCalled()
  })

  it('shows an API error without claiming the email was sent', async () => {
    submitForgotPasswordMock.mockRejectedValue(
      new Error('Something went wrong.'),
    )
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'talent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() =>
      expect(screen.getByText('Something went wrong.')).toBeTruthy(),
    )
    expect(screen.queryByText('Check your email')).toBeNull()
  })
})
