import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ColumnDef, DataTable } from './DataTable'

interface Row {
  id: string
  name: string
  score: number | null
}

const rows: Row[] = [
  { id: '1', name: 'Bravo', score: 50 },
  { id: '2', name: 'Alpha', score: null },
  { id: '3', name: 'Charlie', score: 90 },
]

const columns: ColumnDef<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => row.name,
    sortAccessor: (row) => row.name,
  },
  {
    key: 'score',
    header: 'Score',
    render: (row) => row.score ?? '—',
    sortAccessor: (row) => row.score,
  },
]

describe('DataTable sorting', () => {
  it('sorts ascending on first header click, and reverses on the second', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        showRowNumber={false}
      />,
    )

    const getBodyRowNames = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[0]?.textContent)

    expect(getBodyRowNames()).toEqual(['Bravo', 'Alpha', 'Charlie'])

    fireEvent.click(screen.getByText('Name'))
    expect(getBodyRowNames()).toEqual(['Alpha', 'Bravo', 'Charlie'])

    fireEvent.click(screen.getByText('Name'))
    expect(getBodyRowNames()).toEqual(['Charlie', 'Bravo', 'Alpha'])
  })

  it('sorts null values last regardless of direction', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        showRowNumber={false}
      />,
    )

    fireEvent.click(screen.getByText('Score'))
    const namesAsc = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
    expect(namesAsc).toEqual(['Bravo', 'Charlie', 'Alpha'])

    fireEvent.click(screen.getByText('Score'))
    const namesDesc = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
    expect(namesDesc).toEqual(['Charlie', 'Bravo', 'Alpha'])
  })
})

describe('DataTable row selection', () => {
  it('renders a checkbox column and reports row toggles', () => {
    const onToggleRow = vi.fn()
    const onToggleAll = vi.fn()

    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        selectedRowKeys={new Set()}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        showRowNumber={false}
      />,
    )

    const checkboxes = screen.getAllByRole('checkbox')
    // First checkbox is "select all", the rest are per-row.
    expect(checkboxes).toHaveLength(rows.length + 1)

    fireEvent.click(checkboxes[1]!)
    expect(onToggleRow).toHaveBeenCalledWith('1')

    fireEvent.click(checkboxes[0]!)
    expect(onToggleAll).toHaveBeenCalledWith(['1', '2', '3'])
  })

  it('selecting all rows toggles the header checkbox to checked', () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        selectedRowKeys={new Set(['1', '2', '3'])}
        onToggleRow={vi.fn()}
        onToggleAll={vi.fn()}
        showRowNumber={false}
      />,
    )

    const headerCheckbox = screen.getAllByRole(
      'checkbox',
    )[0] as HTMLInputElement
    expect(headerCheckbox.checked).toBe(true)

    rerender(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        selectedRowKeys={new Set()}
        onToggleRow={vi.fn()}
        onToggleAll={vi.fn()}
        showRowNumber={false}
      />,
    )
    expect(
      (screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked,
    ).toBe(false)
  })

  it('does not render a checkbox column when selection props are absent', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        showRowNumber={false}
      />,
    )
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })
})

describe('DataTable on phones and with client paging', () => {
  const setWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    })
  }

  afterEach(() => setWidth(1024))

  it('stacks each row into a card with labelled fields on a phone', () => {
    setWidth(375)
    render(<DataTable columns={columns} data={rows} ariaLabel="Scores" />)

    expect(screen.queryByRole('table')).toBeNull()
    const cards = within(
      screen.getByRole('list', { name: 'Scores' }),
    ).getAllByRole('listitem')
    expect(cards).toHaveLength(3)
    expect(within(cards[0]).getByText('Bravo')).toBeTruthy()
    expect(within(cards[0]).getByText('Score')).toBeTruthy()
  })

  it('keeps a scrolling table on a phone when stacking is turned off', () => {
    setWidth(375)
    render(<DataTable columns={columns} data={rows} stackOnMobile={false} />)

    expect(screen.getByRole('table')).toBeTruthy()
  })

  it('pages loaded rows after sorting them', () => {
    render(<DataTable columns={columns} data={rows} pageSize={2} />)

    fireEvent.click(screen.getByText('Name'))
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Bravo')).toBeTruthy()
    expect(screen.queryByText('Charlie')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Charlie')).toBeTruthy()
    expect(screen.queryByText('Alpha')).toBeNull()
  })
})
