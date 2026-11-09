import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store/useAuthStore'

import CompanySetupPage from './CompanySetupPage'

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }))

vi.mock('@/features/organizations/hooks/useCreateOrganization', () => ({
  useCreateOrganization: () => ({
    createOrganization: createMock,
    isCreating: false,
  }),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { firstName: 'Ada', lastName: 'Obi' },
    mutate: vi.fn(),
  }),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/company']}>
      <Routes>
        <Route path="/onboarding/company" element={<CompanySetupPage />} />
        <Route path="/onboarding/company/done" element={<p>All set</p>} />
      </Routes>
    </MemoryRouter>,
  )

const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const pickIndustry = () => {
  fireEvent.click(screen.getByRole('button', { name: /Select an industry/ }))
  fireEvent.click(screen.getByText('Technology'))
}

const continueStep = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  })
}

const fillIdentity = (domain = 'acmeltd.com') => {
  type('Company name', 'Acme Ltd')
  type('Company domain', domain)
  pickIndustry()
  type('Address', '12 Admiralty Way, Lekki Phase 1, Lagos')
}

const fillContact = () => {
  type('Company email', 'hiring@acmeltd.com')
  type('Phone number', '805 827 2524')
}

describe('CompanySetupPage', () => {
  beforeEach(() => {
    localStorage.clear()
    createMock.mockReset()
    useAuthStore.setState({ user: { id: 'user-1', userRole: 'recruiter' } })
  })

  it('stays on a step until its fields are valid', async () => {
    renderPage()
    await continueStep()

    expect(screen.getByText('Company name is required')).toBeTruthy()
    expect(screen.getByText('Company identity')).toBeTruthy()
    expect(screen.queryByText('Company email is required')).toBeNull()
  })

  it('walks through the steps and creates the company once', async () => {
    let finish: () => void = () => undefined
    createMock.mockImplementation(
      () => new Promise<void>((done) => (finish = done)),
    )
    renderPage()

    fillIdentity()
    await continueStep()
    expect(screen.getByText('Contact details')).toBeTruthy()

    fillContact()
    await continueStep()
    expect(screen.getByText('Online presence')).toBeTruthy()

    const create = screen.getByRole('button', { name: /Create company/ })
    await act(async () => {
      fireEvent.click(create)
      fireEvent.click(create)
    })
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(createMock.mock.calls[0][0]).toMatchObject({
      name: 'Acme Ltd',
      domain: 'acmeltd.com',
      email: 'hiring@acmeltd.com',
      phone: '+2348058272524',
      industry: 'Technology',
    })

    await act(async () => finish())
    await waitFor(() => expect(screen.getByText('All set')).toBeTruthy())
    expect(localStorage.getItem('auxhr:company-draft:user-1')).toBeNull()
  })

  it('shows the leading zero rule on the phone step', async () => {
    renderPage()
    fillIdentity()
    await continueStep()
    type('Company email', 'hiring@acmeltd.com')
    type('Phone number', '0805 827 2524')
    await continueStep()

    expect(
      screen.getByText(
        'Remove the first 0. After +234 it should read 805 827 2524.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Contact details')).toBeTruthy()
  })

  it('jumps back to the email step when a later change breaks it', async () => {
    renderPage()
    fillIdentity()
    await continueStep()
    fillContact()
    await continueStep()
    type('Website', 'https://acme.ng')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create company/ }))
    })

    expect(createMock).not.toHaveBeenCalled()
    expect(screen.getByText('Contact details')).toBeTruthy()
    expect(screen.getByText('Contact email must use @acme.ng')).toBeTruthy()
  })

  it('sends a server error to the step of the field it names', async () => {
    createMock.mockRejectedValue({
      response: {
        status: 409,
        data: {
          error: {
            message: 'Organization already registered with this phone number',
          },
        },
      },
    })
    renderPage()
    fillIdentity()
    await continueStep()
    fillContact()
    await continueStep()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create company/ }))
    })

    await waitFor(() =>
      expect(screen.getByText('Contact details')).toBeTruthy(),
    )
    expect(
      screen.getAllByText(
        'Organization already registered with this phone number',
      ).length,
    ).toBeGreaterThan(0)
  })
})
