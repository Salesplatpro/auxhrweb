import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImportStaff } from './ImportStaff'

const mocks = vi.hoisted(() => ({
  checkImport: vi.fn(),
  importStaff: vi.fn(),
  navigate: vi.fn(),
  exportRows: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'o-1' }),
}))
vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    checkImport: mocks.checkImport,
    importStaff: mocks.importStaff,
    isSaving: false,
  }),
}))
vi.mock('@/utils/exportRowsToCsv', () => ({
  exportRowsToCsv: mocks.exportRows,
}))
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mocks.navigate,
}))

const CSV = [
  'Email,Full name,Job title,Department,Manager email,Start date',
  'ada@example.com,Ada Obi,Designer,Design,tunde@example.com,2026-02-01',
  'bad-email,Bayo Lawal,Analyst,Finance,,2026-02-01',
].join('\n')

const dropFile = (content: string, name: string) => {
  const file = Object.assign(new File([content], name, { type: 'text/csv' }), {
    text: () => Promise.resolve(content),
  })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

const show = () =>
  render(
    <MemoryRouter>
      <ImportStaff />
    </MemoryRouter>,
  )

describe('ImportStaff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with the sample file and a CSV box, step one of three', () => {
    show()
    expect(screen.getByText('Step 1 of 3 · Upload your file')).toBeTruthy()
    expect(screen.getByText('Add staff from a file')).toBeTruthy()
    expect(screen.getByText('CSV only, up to 500 rows')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Download sample file' }),
    )
    expect(mocks.exportRows).toHaveBeenCalled()
  })

  it('previews the rows, imports the ready ones and finishes with the skipped rows', async () => {
    mocks.checkImport.mockResolvedValue([
      { row: 1, fullName: 'Ada Obi', email: 'ada@example.com', error: null },
      {
        row: 2,
        fullName: 'Bayo Lawal',
        email: 'bad-email',
        error: 'A valid email is required',
      },
    ])
    mocks.importStaff.mockResolvedValue({
      added: 1,
      skipped: [
        {
          row: 2,
          fullName: 'Bayo Lawal',
          email: 'bad-email',
          error: 'A valid email is required',
        },
      ],
    })
    show()
    dropFile(CSV, 'staff.csv')

    expect(
      await screen.findByText('1 rows ready, 1 with problems.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Step 2 of 3 · Check the rows before you import'),
    ).toBeTruthy()
    expect(screen.getByText('Red rows will be skipped')).toBeTruthy()
    expect(screen.getByText('A valid email is required')).toBeTruthy()
    expect(screen.getByText('tunde@example.com')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 staff' }))
    expect(
      await screen.findByText('1 staff added. 1 rows skipped.'),
    ).toBeTruthy()
    expect(screen.getByText('Imported')).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Download skipped rows' }),
    )
    expect(mocks.exportRows).toHaveBeenCalledWith(
      expect.arrayContaining(['Problem']),
      [expect.arrayContaining(['bad-email', 'A valid email is required'])],
      'staff-import-skipped.csv',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go to Employees' }))
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/recruiterDashboard/people/employees',
    )
  })

  it('says it could not read a file that is not the sample shape, and lets you choose another', async () => {
    show()
    dropFile('name,age\nAda,30', 'wrong.csv')
    expect(await screen.findByText('We could not read this file')).toBeTruthy()
    expect(screen.getByText(/Nothing was imported/)).toBeTruthy()
    expect(screen.getByText('Error')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Choose another file' }))
    expect(screen.getByText('Add staff from a file')).toBeTruthy()
    expect(mocks.checkImport).not.toHaveBeenCalled()
  })

  it('refuses a file over 500 rows without sending it', async () => {
    show()
    const rows = Array.from(
      { length: 501 },
      (_, index) =>
        `p${index}@example.com,Person ${index},Analyst,,,2026-02-01`,
    )
    dropFile(
      [
        'Email,Full name,Job title,Department,Manager email,Start date',
        ...rows,
      ].join('\n'),
      'big.csv',
    )
    expect(await screen.findByText(/has 501 rows/)).toBeTruthy()
    await waitFor(() => expect(mocks.checkImport).not.toHaveBeenCalled())
  })
})
