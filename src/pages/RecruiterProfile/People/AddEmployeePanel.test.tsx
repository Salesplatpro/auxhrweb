import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AddEmployeePanel } from './AddEmployeePanel'

const { addStaffMock } = vi.hoisted(() => ({ addStaffMock: vi.fn() }))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({ addStaff: addStaffMock, isSaving: false }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffOptions: () => ({
    options: [
      {
        id: 'm-1',
        fullName: 'Bola Boss',
        jobTitle: 'Head of Design',
        status: 'active',
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      firstName: 'Hana',
      lastName: 'Resources',
      activeOrganization: {
        name: 'Acme Ltd',
        departments: ['Design', 'Sales'],
      },
    },
  }),
}))

const onClose = vi.fn()

const renderPanel = () =>
  render(
    <MemoryRouter>
      <AddEmployeePanel
        open
        organizationId="org-1"
        companyName="Acme Ltd"
        onClose={onClose}
      />
    </MemoryRouter>,
  )

const type = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AddEmployeePanel', () => {
  it('asks for the required details before saving', async () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter their full name')).toBeTruthy()
    expect(screen.getByText('Enter their email address')).toBeTruthy()
    expect(screen.getByText('Enter their job title')).toBeTruthy()
    expect(screen.getByText('Pick their start date')).toBeTruthy()
    expect(addStaffMock).not.toHaveBeenCalled()
  })

  it('says who the invite email goes out as', () => {
    renderPanel()

    expect(
      screen.getByText(/gets an email from Acme Ltd, sent as Hana Resources/),
    ).toBeTruthy()
  })

  it('saves the person with the invite on by default and closes', async () => {
    addStaffMock.mockResolvedValue({ staff: { id: 's-1' } })
    renderPanel()

    type(/Full name/, ' Ada Obi ')
    type(/Email address/, 'ada@example.com')
    type(/Job title/, 'Product Designer')
    fireEvent.click(screen.getByText('No department'))
    fireEvent.click(screen.getByText('Design'))
    type(/Start date/, '2026-01-05')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(addStaffMock).toHaveBeenCalledTimes(1))
    expect(addStaffMock).toHaveBeenCalledWith({
      fullName: 'Ada Obi',
      email: 'ada@example.com',
      jobTitle: 'Product Designer',
      department: 'Design',
      managerId: null,
      startDate: '2026-01-05',
      isExecutive: false,
      sendInvite: true,
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('records a person without emailing them when the invite is unticked', async () => {
    addStaffMock.mockResolvedValue({ staff: { id: 's-1' } })
    renderPanel()

    type(/Full name/, 'Ada Obi')
    type(/Email address/, 'ada@example.com')
    type(/Job title/, 'Product Designer')
    type(/Start date/, '2026-01-05')
    fireEvent.click(screen.getByLabelText('Send an invite email'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(addStaffMock).toHaveBeenCalled())
    expect(addStaffMock.mock.calls[0]![0]).toMatchObject({ sendInvite: false })
  })

  it('stays open when saving fails so nothing typed is lost', async () => {
    addStaffMock.mockResolvedValue(null)
    renderPanel()

    type(/Full name/, 'Ada Obi')
    type(/Email address/, 'ada@example.com')
    type(/Job title/, 'Product Designer')
    type(/Start date/, '2026-01-05')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(addStaffMock).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect((screen.getByLabelText(/Full name/) as HTMLInputElement).value).toBe(
      'Ada Obi',
    )
  })

  it('marks someone as an executive with the Yes option', async () => {
    addStaffMock.mockResolvedValue({ staff: { id: 's-1' } })
    renderPanel()

    type(/Full name/, 'Ada Obi')
    type(/Email address/, 'ada@example.com')
    type(/Job title/, 'Chief of Staff')
    type(/Start date/, '2026-01-05')
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(addStaffMock).toHaveBeenCalled())
    expect(addStaffMock.mock.calls[0]![0]).toMatchObject({ isExecutive: true })
  })

  it('adds a shortlisted applicant with their own name and email locked', async () => {
    addStaffMock.mockResolvedValue({ staff: { id: 's-1' } })
    render(
      <MemoryRouter>
        <AddEmployeePanel
          open
          organizationId="org-1"
          companyName="Acme Ltd"
          onClose={onClose}
          applicant={{
            applicationId: 'app-1',
            fullName: 'Kelechi Okoro',
            email: 'kelechi@example.com',
            jobTitle: 'Data Analyst',
          }}
        />
      </MemoryRouter>,
    )

    const name = screen.getByLabelText(/Full name/) as HTMLInputElement
    expect(name.value).toBe('Kelechi Okoro')
    expect(name.readOnly).toBe(true)
    expect(
      (screen.getByLabelText(/Email address/) as HTMLInputElement).readOnly,
    ).toBe(true)
    type(/Start date/, '2026-12-01')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(addStaffMock).toHaveBeenCalled())
    expect(addStaffMock.mock.calls[0]![0]).toMatchObject({
      fullName: 'Kelechi Okoro',
      email: 'kelechi@example.com',
      jobTitle: 'Data Analyst',
      applicationId: 'app-1',
    })
  })
})
