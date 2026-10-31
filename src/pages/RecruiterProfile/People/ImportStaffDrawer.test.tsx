import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ImportStaffDrawer } from './ImportStaffDrawer'

const { checkImportMock, importStaffMock } = vi.hoisted(() => ({
  checkImportMock: vi.fn(),
  importStaffMock: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    checkImport: checkImportMock,
    importStaff: importStaffMock,
    isSaving: false,
  }),
}))

const CSV = [
  'Email,Full name,Job title,Department,Manager email,Start date',
  'ada@example.com,Ada Obi,Designer,Design,,2026-02-01',
  'bad-email,Bayo Lawal,Analyst,Finance,,2026-02-01',
].join('\n')

const dropFile = (content: string, name: string) => {
  const file = Object.assign(new File([content], name, { type: 'text/csv' }), {
    text: () => Promise.resolve(content),
  })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })
}

describe('ImportStaffDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('previews the rows, imports the ready ones and reports what was skipped', async () => {
    checkImportMock.mockResolvedValue([
      { row: 1, fullName: 'Ada Obi', email: 'ada@example.com', error: null },
      {
        row: 2,
        fullName: 'Bayo Lawal',
        email: 'bad-email',
        error: 'A valid email is required',
      },
    ])
    importStaffMock.mockResolvedValue({
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
    render(<ImportStaffDrawer organizationId="org-1" open onClose={vi.fn()} />)

    dropFile(CSV, 'staff.csv')

    expect(
      await screen.findByText('1 rows ready, 1 with problems.'),
    ).toBeTruthy()
    expect(screen.getByText('A valid email is required')).toBeTruthy()
    expect(checkImportMock).toHaveBeenCalledWith([
      expect.objectContaining({
        email: 'ada@example.com',
        fullName: 'Ada Obi',
      }),
      expect.objectContaining({ email: 'bad-email' }),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 staff' }))
    expect(
      await screen.findByText('1 staff added. 1 rows skipped.'),
    ).toBeTruthy()
  })

  it('names missing columns before sending anything', async () => {
    render(<ImportStaffDrawer organizationId="org-1" open onClose={vi.fn()} />)

    dropFile('Email,Department\nada@example.com,Design', 'staff.csv')

    expect(
      await screen.findByText(
        'The file is missing these columns: Full name, Job title, Start date.',
      ),
    ).toBeTruthy()
    expect(checkImportMock).not.toHaveBeenCalled()
  })
})
