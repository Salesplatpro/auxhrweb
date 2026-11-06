import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileBuilderPage from './ProfileBuilderPage'

const { state, saveProfileMock, mutateMock, uploadCvMock } = vi.hoisted(() => ({
  state: {
    profile: null as Record<string, unknown> | null,
    isUploading: false,
  },
  saveProfileMock: vi.fn(),
  mutateMock: vi.fn(),
  uploadCvMock: vi.fn(),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: state.profile,
    isLoading: false,
    mutate: mutateMock,
  }),
}))

vi.mock('@/features/profile/hooks/useUpdateProfile', () => ({
  useUpdateProfile: () => ({ saveProfile: saveProfileMock }),
}))

vi.mock('@/features/profile/hooks/useUploadCv', () => ({
  useUploadCv: () => ({
    uploadCv: uploadCvMock,
    isUploading: state.isUploading,
    progress: state.isUploading ? 40 : null,
  }),
}))

vi.mock('@/redux/api/talent', () => ({
  useGetRoleQuery: () => ({
    data: { data: [{ id: 'r1', name: 'Data Analyst' }] },
  }),
}))

vi.mock('@/components/forms/Roles/RoleMultiSelect', () => ({
  RoleMultiSelect: ({
    value,
    disabled,
    onChange,
  }: {
    value: string[]
    disabled?: boolean
    onChange: (next: string[]) => void
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange([...value, `new-${value.length}`])}>
      Add role ({value.length})
    </button>
  ),
}))

const complete = {
  firstName: 'Tunde',
  lastName: 'Bakare',
  bio: 'Data analyst who turns messy data into dashboards.',
  userRoles: [{ id: 'r1' }],
  experience: '4-6 years',
  workType: ['hybrid'],
  locationCountry: 'Nigeria',
  minSalary: 6000000,
  maxSalary: 9000000,
  currency: 'NGN',
  compensationPeriod: 'yearly',
  cvFileName: 'Tunde_CV.pdf',
  roleChangeCount: 1,
  profileCompletion: { percentage: 90, isProfileComplete: false },
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/profile']}>
      <Routes>
        <Route path="/onboarding/profile" element={<ProfileBuilderPage />} />
        <Route path="/onboarding/profile/done" element={<p>Profile live</p>} />
      </Routes>
    </MemoryRouter>,
  )

const submit = async (name: RegExp) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

describe('ProfileBuilderPage', () => {
  beforeEach(() => {
    state.profile = { ...complete }
    state.isUploading = false
    saveProfileMock.mockReset()
    mutateMock.mockReset()
    uploadCvMock.mockReset()
    mutateMock.mockResolvedValue({ data: { user: state.profile } })
  })

  it('rejects a one-word name', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Tunde' },
    })
    await submit(/Continue/)

    expect(screen.getByText('Enter your first and last name')).toBeTruthy()
    expect(saveProfileMock).not.toHaveBeenCalled()
  })

  it('saves nothing extra when step one is unchanged', async () => {
    renderPage()
    await submit(/Continue/)

    expect(saveProfileMock).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(
        screen.getByText('Recruiters filter by these, so be accurate.'),
      ).toBeTruthy(),
    )
  })

  it('locks roles once the change limit is used', () => {
    state.profile = { ...complete, roleChangeCount: 3 }
    renderPage()
    expect(screen.getByRole('button', { name: /Add role/ })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByText(/used all 3 role changes/)).toBeTruthy()
  })

  it('keeps existing roles above three but adds no more', () => {
    state.profile = {
      ...complete,
      userRoles: ['a', 'b', 'c', 'd'].map((id) => ({ id })),
    }
    renderPage()
    expect(screen.getByText('4 of 4')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Add role/ }))
    expect(screen.getByText('4 of 4')).toBeTruthy()
  })

  it('blocks finishing while the CV uploads', async () => {
    state.isUploading = true
    renderPage()
    await submit(/Continue/)
    const finish = await screen.findByRole('button', { name: /Finish profile/ })
    expect(finish).toHaveProperty('disabled', true)
  })

  it('lists what is still missing when the server says incomplete', async () => {
    state.profile = { ...complete, bio: '' }
    mutateMock.mockResolvedValue({
      data: { user: { ...complete, bio: '' } },
    })
    renderPage()
    fireEvent.change(screen.getByLabelText(/Short bio/), {
      target: { value: 'Analyst' },
    })
    saveProfileMock.mockResolvedValue({ ...complete })
    await submit(/Continue/)
    await screen.findByRole('button', { name: /Finish profile/ })

    saveProfileMock.mockResolvedValue({
      ...complete,
      profileCompletion: { percentage: 90, isProfileComplete: false },
    })
    await submit(/Finish profile/)

    await waitFor(() =>
      expect(
        screen.getByText(
          "We saved your profile, but it isn't complete yet. Check each field and try again.",
        ),
      ).toBeTruthy(),
    )
  })

  it('moves on when the server confirms the profile is complete', async () => {
    mutateMock.mockResolvedValue({
      data: {
        user: {
          ...complete,
          profileCompletion: { percentage: 100, isProfileComplete: true },
        },
      },
    })
    renderPage()
    await submit(/Continue/)
    await screen.findByRole('button', { name: /Finish profile/ })
    await submit(/Finish profile/)

    await waitFor(() => expect(screen.getByText('Profile live')).toBeTruthy())
  })

  it('refuses a CV that is not a PDF or DOCX', async () => {
    renderPage()
    await submit(/Continue/)
    const input = await screen.findByLabelText('CV file')
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'cv.png')] },
    })
    expect(screen.getByText('Upload a PDF or DOCX file.')).toBeTruthy()
    expect(uploadCvMock).not.toHaveBeenCalled()
  })
})
