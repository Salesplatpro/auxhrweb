import { describe, expect, it } from 'vitest'

import { parseCsv, toImportRows } from './staffCsv'

describe('parseCsv', () => {
  it('reads quotes, commas, escaped quotes, CRLF and a BOM, and skips blank lines', () => {
    expect(
      parseCsv(
        '﻿Email,Full name\r\nada@example.com,"Obi, Ada ""Ace"""\r\n\r\nbayo@example.com,Bayo\n',
      ),
    ).toEqual([
      ['Email', 'Full name'],
      ['ada@example.com', 'Obi, Ada "Ace"'],
      ['bayo@example.com', 'Bayo'],
    ])
  })
})

describe('toImportRows', () => {
  it('maps headers in any order and case to staff rows', () => {
    expect(
      toImportRows([
        [
          'Start date',
          'EMAIL',
          'Full name',
          'Job title',
          'Department',
          'Manager email',
        ],
        [
          '2026-02-01',
          ' ada@example.com ',
          'Ada Obi',
          'Designer',
          '',
          'lead@example.com',
        ],
      ]),
    ).toEqual({
      missingColumns: [],
      rows: [
        {
          email: 'ada@example.com',
          fullName: 'Ada Obi',
          jobTitle: 'Designer',
          department: '',
          managerEmail: 'lead@example.com',
          startDate: '2026-02-01',
        },
      ],
    })
  })

  it('names the required columns that are missing', () => {
    expect(toImportRows([['Email', 'Department']]).missingColumns).toEqual([
      'Full name',
      'Job title',
      'Start date',
    ])
  })
})
