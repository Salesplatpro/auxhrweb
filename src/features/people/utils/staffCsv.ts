import { ImportStaffRow } from '../types'

export const IMPORT_COLUMNS: {
  key: keyof ImportStaffRow
  header: string
  required: boolean
}[] = [
  { key: 'email', header: 'Email', required: true },
  { key: 'fullName', header: 'Full name', required: true },
  { key: 'jobTitle', header: 'Job title', required: true },
  { key: 'department', header: 'Department', required: false },
  { key: 'managerEmail', header: 'Manager email', required: false },
  { key: 'startDate', header: 'Start date', required: true },
]

const BYTE_ORDER_MARK = '\uFEFF'

export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const source = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text

  const endRow = () => {
    row.push(cell)
    if (row.some((value) => value.trim() !== '')) rows.push(row)
    row = []
    cell = ''
  }

  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (inQuotes) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"'
        index++
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index++
      endRow()
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) endRow()
  return rows
}

const headerKey = (header: string) => header.trim().toLowerCase()

export const toImportRows = (table: string[][]) => {
  const [headers = [], ...body] = table
  const positions = new Map(
    headers.map((header, index) => [headerKey(header), index]),
  )
  const missingColumns = IMPORT_COLUMNS.filter(
    (column) => column.required && !positions.has(headerKey(column.header)),
  ).map((column) => column.header)

  const rows = body.map(
    (cells) =>
      Object.fromEntries(
        IMPORT_COLUMNS.map((column) => {
          const position = positions.get(headerKey(column.header))
          return [
            column.key,
            position === undefined ? '' : (cells[position] ?? '').trim(),
          ]
        }),
      ) as unknown as ImportStaffRow,
  )
  return { missingColumns, rows }
}
