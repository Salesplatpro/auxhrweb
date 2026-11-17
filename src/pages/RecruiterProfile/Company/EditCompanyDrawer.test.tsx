import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Organization } from '@/features/organizations/types'

import { EditCompanyDrawer } from './EditCompanyDrawer'

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }))

vi.mock('@/features/organizations/hooks/useUpdateOrganization', () => ({
  useUpdateOrganization: () => ({
    updateOrganization: updateMock,
    isUpdating: false,
  }),
}))

vi.mock('./CompanyLogoUpload', () => ({ CompanyLogoUpload: () => null }))

const organization = {
  id: 'org-1',
  ownerId: 'u-1',
  name: 'Kosana Tech Ltd',
  address: 'Lekki, Lagos',
  industry: 'Fintech',
  status: 'verified',
  companyValues: 'We share work early.',
  about: null,
  size: '51–200',
  foundedYear: 2019,
  createdAt: '',
  updatedAt: '',
} as Organization

const renderDrawer = (onClose = vi.fn()) => {
  render(
    <EditCompanyDrawer open organization={organization} onClose={onClose} />,
  )
  return onClose
}

const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

beforeEach(() => {
  updateMock.mockReset()
})

describe('EditCompanyDrawer', () => {
  it('fills the form from the company', () => {
    renderDrawer()
    expect(
      (screen.getByLabelText('Company values') as HTMLTextAreaElement).value,
    ).toBe('We share work early.')
    expect((screen.getByLabelText('Founded') as HTMLInputElement).value).toBe(
      '2019',
    )
  })

  it('stays open with the typed text when saving fails', async () => {
    updateMock.mockResolvedValue(null)
    const onClose = renderDrawer()
    const values = screen.getByLabelText('Company values')
    fireEvent.change(values, { target: { value: 'Customers first.' } })

    save()

    await waitFor(() => expect(updateMock).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect((values as HTMLTextAreaElement).value).toBe('Customers first.')
  })

  it('shows the values toast and closes when the values changed', async () => {
    updateMock.mockResolvedValue(organization)
    const onClose = renderDrawer()
    fireEvent.change(screen.getByLabelText('Company values'), {
      target: { value: 'Customers first.' },
    })

    save()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const [id, payload, toast] = updateMock.mock.calls[0]
    expect(id).toBe('org-1')
    expect(payload).toMatchObject({
      companyValues: 'Customers first.',
      foundedYear: 2019,
      size: '51–200',
      about: null,
    })
    expect(toast).toEqual({
      title: 'Company values saved',
      description: 'New culture-fit tests will use them.',
    })
  })

  it('uses the plain toast when the values did not change', async () => {
    updateMock.mockResolvedValue(organization)
    renderDrawer()

    save()

    await waitFor(() => expect(updateMock).toHaveBeenCalled())
    expect(updateMock.mock.calls[0][2]).toBeUndefined()
  })

  it('blocks a founded year in the future', async () => {
    renderDrawer()
    const founded = screen.getByLabelText('Founded')
    fireEvent.change(founded, {
      target: { value: String(new Date().getFullYear() + 1) },
    })
    fireEvent.blur(founded)

    save()

    expect(
      await screen.findByText('Enter a year from 1800 to this year'),
    ).toBeTruthy()
    expect(updateMock).not.toHaveBeenCalled()
  })
})
