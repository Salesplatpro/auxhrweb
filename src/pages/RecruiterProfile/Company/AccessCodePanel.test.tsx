import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Organization } from '@/features/organizations/types'

import { AccessCodePanel } from './AccessCodePanel'

const { fetchMock, rotateMock, disableMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  rotateMock: vi.fn(),
  disableMock: vi.fn(),
}))

vi.mock('@/features/organizations/services/organizationService', () => ({
  accessCodeEndpoint: (id: string) => `/organizations/${id}/access-code`,
  fetchOrganizationAccessCode: fetchMock,
  rotateOrganizationAccessCode: rotateMock,
  disableOrganizationAccessCode: disableMock,
}))

const org = (status: Organization['status']) =>
  ({ id: 'org-1', name: 'Acme', status } as Organization)

const renderPanel = (status: Organization['status'] = 'verified') =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AccessCodePanel organization={org(status)} />
    </SWRConfig>,
  )

describe('AccessCodePanel', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    rotateMock.mockReset()
    disableMock.mockReset()
  })

  it('waits for verification before offering a code', () => {
    renderPanel('pending')
    expect(screen.getByText(/once AuxHR verifies your company/)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Create access code' }),
    ).toBeNull()
  })

  it('creates a code and shows it', async () => {
    fetchMock.mockResolvedValue({ data: { code: null } })
    rotateMock.mockResolvedValue({ data: { code: 'ABCD-2345' } })
    renderPanel()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Create access code' }),
    )

    expect(
      ((await screen.findByLabelText('Access code')) as HTMLInputElement).value,
    ).toBe('ABCD-2345')
  })

  it('asks before replacing the code', async () => {
    fetchMock.mockResolvedValue({ data: { code: 'ABCD-2345' } })
    rotateMock.mockResolvedValue({ data: { code: 'WXYZ-6789' } })
    renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: 'New code' }))
    expect(rotateMock).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Make new code' }))
    })

    expect(rotateMock).toHaveBeenCalledTimes(1)
    expect(
      ((await screen.findByLabelText('Access code')) as HTMLInputElement).value,
    ).toBe('WXYZ-6789')
  })

  it('shows why a code could not be made', async () => {
    fetchMock.mockResolvedValue({ data: { code: null } })
    rotateMock.mockRejectedValue({
      response: {
        status: 402,
        data: { message: 'Your company has reached its plan limit.' },
      },
    })
    renderPanel()

    const create = await screen.findByRole('button', {
      name: 'Create access code',
    })
    await act(async () => {
      fireEvent.click(create)
    })

    expect(
      screen.getByText('Your company has reached its plan limit.'),
    ).toBeTruthy()
  })

  it('says codes are not available when the server does not have them yet', async () => {
    fetchMock.mockRejectedValue({ response: { status: 404 } })
    renderPanel()
    expect(
      await screen.findByText(/Access codes aren.t available yet/),
    ).toBeTruthy()
  })
})
