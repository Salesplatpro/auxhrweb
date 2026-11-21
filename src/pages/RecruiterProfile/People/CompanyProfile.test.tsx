import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CompanyProfile } from './CompanyProfile'

const mocks = vi.hoisted(() => ({
  useCompanyProfile: vi.fn(),
  saveProfile: vi.fn(),
  fillProfileFromFile: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useCompanyProfile: mocks.useCompanyProfile,
}))
vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    saveProfile: mocks.saveProfile,
    fillProfileFromFile: mocks.fillProfileFromFile,
  }),
}))
vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'o-1' }),
}))

const show = (profile: {
  mission: string | null
  vision: string | null
  yearlyGoals: string[]
}) => {
  mocks.useCompanyProfile.mockReturnValue({
    profile,
    isLoading: false,
    hasError: false,
  })
  return render(
    <MemoryRouter>
      <CompanyProfile />
    </MemoryRouter>,
  )
}

describe('CompanyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.saveProfile.mockResolvedValue(true)
  })

  it('offers the upload first when nothing is filled in, with the form below it', () => {
    show({ mission: null, vision: null, yearlyGoals: [] })
    expect(screen.getByText('Upload your company profile')).toBeTruthy()
    expect(screen.getByText('PDF or Word, up to 20 MB')).toBeTruthy()
    expect(screen.getByText('Or fill the form yourself below.')).toBeTruthy()
    expect(screen.getByLabelText('Mission')).toBeTruthy()
    expect(screen.getByLabelText('Vision')).toBeTruthy()
    expect(screen.getByLabelText('Yearly goals')).toBeTruthy()
  })

  it('shows what the AI filled in with a check badge on each field, then saves one goal per line', async () => {
    mocks.fillProfileFromFile.mockResolvedValue({
      mission: 'We help small companies hire.',
      vision: 'Every company in Africa hires fairly.',
      yearlyGoals: [
        'Reach 500 paying companies',
        'Cut time to hire to 14 days',
      ],
    })
    const { container } = show({ mission: null, vision: null, yearlyGoals: [] })
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [new File(['x'], 'profile.pdf', { type: 'application/pdf' })],
      },
    })

    await screen.findAllByText('Filled by AI, please check')
    expect(screen.getAllByText('Filled by AI, please check')).toHaveLength(3)
    expect(
      screen.getByText(
        'Check what we filled in, change anything that is wrong, then save.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(mocks.saveProfile).toHaveBeenCalledWith({
        mission: 'We help small companies hire.',
        vision: 'Every company in Africa hires fairly.',
        yearlyGoals: [
          'Reach 500 paying companies',
          'Cut time to hire to 14 days',
        ],
      }),
    )
  })

  it('refuses a file over 20 MB without reading it', () => {
    const { container } = show({ mission: null, vision: null, yearlyGoals: [] })
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 })
    fireEvent.change(input, { target: { files: [big] } })
    expect(mocks.fillProfileFromFile).not.toHaveBeenCalled()
  })
})
