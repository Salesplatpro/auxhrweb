import Checkbox from '@mui/material/Checkbox'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import React, { useEffect, useMemo, useState } from 'react'

import { useScreenWidth } from '../../../hooks'
import { BREAKPOINTS } from '../../../styles/breakpoints'
import { EmptyState } from '../EmptyState'
import { Pagination } from '../Pagination'
import { Spinner } from '../Spinner'
import styles from './DataTable.module.scss'

export interface ColumnDef<T> {
  key: string
  header: React.ReactNode
  align?: 'left' | 'center' | 'right'
  /** Hide this column when the screen width is at or below this pixel value */
  hideBelow?: number
  render: (row: T, index: number) => React.ReactNode
  /** Opt a column into client-side sorting — return the raw comparable value for a row. */
  sortAccessor?: (row: T) => string | number | null | undefined
  /** Plain-text label for this column in a TableToolbar's "Sort by" select — falls back to `header` when it's a string. */
  sortLabel?: string
  /** Opts this column into a TableToolbar's column-visibility picker. */
  toggleable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  /** Custom placeholder rendered instead of the default full-page spinner while `isLoading` is true. */
  loadingSkeleton?: React.ReactNode
  emptyState?: React.ReactNode
  getRowKey?: (row: T, index: number) => string | number
  getRowClassName?: (row: T, index: number) => string
  ariaLabel?: string
  /** Prepends an auto-numbered "S/N" column (1, 2, 3, ...) — no data field needed. */
  showRowNumber?: boolean
  /** Starting offset for row numbers, e.g. the current page's offset when paginated. */
  rowNumberOffset?: number
  /** Lets cell content (e.g. an open dropdown) overflow the table's rounded-corner clipping instead of being cut off. */
  allowOverflow?: boolean
  /** Prepends a checkbox column and enables row selection — requires `getRowKey`. */
  selectedRowKeys?: Set<string | number>
  onToggleRow?: (key: string | number) => void
  onToggleAll?: (keys: (string | number)[]) => void
  /** Controlled sort — when provided (with `onSortChange`), an external control (e.g. a toolbar "Sort by" select) drives the same sort as column-header clicks, instead of DataTable's internal state. */
  sortKey?: string | null
  sortDirection?: SortDirection
  onSortChange?: (key: string, direction: SortDirection) => void
  onRowClick?: (row: T) => void
  /** `plain`: light header and no outer frame, for a table that sits inside a panel. */
  variant?: 'hero' | 'plain'
  /** On phones each row becomes a stacked card. Set to false to keep a sideways-scrolling table. */
  stackOnMobile?: boolean
  /** Pages already-loaded rows on the client, after sorting. Leave unset when the server pages. */
  pageSize?: number
}

const isActionsColumn = <T,>(col: ColumnDef<T>) =>
  col.key === 'actions' || col.header === '' || col.header == null

const PLAIN_HEAD = {
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  borderBottom: '1px solid var(--color-border)',
  '& .MuiCheckbox-root': {
    color: 'var(--color-text-muted)',
  },
}

const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'plain',
})<{ plain?: boolean }>(({ plain }) => ({
  [`&.${tableCellClasses.head}`]: plain
    ? PLAIN_HEAD
    : {
        backgroundColor: 'transparent',
        color: 'var(--color-text-on-dark)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        borderBottom: '0',
        '& .MuiTableSortLabel-root': {
          color: 'var(--color-text-on-dark)',
        },
        '& .MuiTableSortLabel-root:hover': {
          color: 'var(--color-text-on-dark)',
        },
        '& .MuiTableSortLabel-root.Mui-active': {
          color: 'var(--color-text-on-dark)',
        },
        '& .MuiTableSortLabel-icon': {
          color: 'rgba(255, 255, 255, 0.7) !important',
        },
        '& .MuiCheckbox-root': {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
  [`&.${tableCellClasses.body}`]: {
    color: 'var(--color-text-heading)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    backgroundColor: 'transparent',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'middle',
    '& p': {
      margin: 0,
      color: 'inherit',
    },
    '& .MuiCheckbox-root': {
      color: 'var(--color-text-muted)',
    },
    '[data-theme="dark"] &': {
      color: 'var(--color-white)',
    },
  },
}))

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: 'var(--color-bg-elevated)',
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: 'var(--color-bg-row-hover)',
  },
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: 'var(--color-bg-row-hover)',
  },
}))

type SortDirection = 'asc' | 'desc'

// Shared by DataTable's own sorting and by callers doing controlled sort
// pre-pagination (sorting must happen before slicing a page, which DataTable
// itself can't do since it only ever sees the current page's rows).
export const sortByAccessor = <T,>(
  data: T[],
  accessor: (row: T) => string | number | null | undefined,
  direction: SortDirection,
): T[] => {
  const dir = direction === 'asc' ? 1 : -1
  return [...data].sort((a, b) => {
    const aValue = accessor(a)
    const bValue = accessor(b)
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    if (aValue < bValue) return -1 * dir
    if (aValue > bValue) return 1 * dir
    return 0
  })
}

export function DataTable<T>({
  columns,
  data = [],
  isLoading,
  loadingSkeleton,
  emptyState,
  getRowKey,
  getRowClassName,
  ariaLabel = 'data table',
  showRowNumber = true,
  rowNumberOffset = 0,
  allowOverflow,
  selectedRowKeys,
  onToggleRow,
  onToggleAll,
  sortKey,
  sortDirection,
  onSortChange,
  onRowClick,
  variant = 'hero',
  stackOnMobile = true,
  pageSize,
}: DataTableProps<T>) {
  const plain = variant === 'plain'
  const screenWidth = useScreenWidth()
  const [internalSort, setInternalSort] = useState<{
    key: string
    direction: SortDirection
  } | null>(null)

  const isControlled = Boolean(onSortChange)
  const sort = isControlled
    ? sortKey
      ? { key: sortKey, direction: sortDirection ?? 'asc' }
      : null
    : internalSort

  const sortedData = useMemo(() => {
    const column = columns.find((col) => col.key === sort?.key)
    if (!sort || !column?.sortAccessor) return data

    return sortByAccessor(data, column.sortAccessor, sort.direction)
  }, [data, sort, columns])

  const [page, setPage] = useState(1)
  const pageCount = pageSize
    ? Math.max(1, Math.ceil(sortedData.length / pageSize))
    : 1
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])
  const pageOffset = pageSize ? (page - 1) * pageSize : 0
  const pageRows = useMemo(
    () =>
      pageSize
        ? sortedData.slice(pageOffset, pageOffset + pageSize)
        : sortedData,
    [sortedData, pageSize, pageOffset],
  )
  const pager =
    pageSize && sortedData.length > pageSize ? (
      <Pagination
        variant="simple"
        totalItems={sortedData.length}
        itemsPerPage={pageSize}
        currentPage={page}
        onPageChange={setPage}
      />
    ) : null

  const handleSort = (key: string) => {
    const nextDirection: SortDirection =
      sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc'

    if (onSortChange) {
      onSortChange(key, nextDirection)
    } else {
      setInternalSort({ key, direction: nextDirection })
    }
  }

  const selectable = Boolean(onToggleRow && getRowKey)
  const allKeys = useMemo(
    () =>
      getRowKey ? sortedData.map((row, index) => getRowKey(row, index)) : [],
    [sortedData, getRowKey],
  )
  const allSelected =
    selectable &&
    allKeys.length > 0 &&
    allKeys.every((key) => selectedRowKeys?.has(key))
  const someSelected =
    selectable &&
    !allSelected &&
    allKeys.some((key) => selectedRowKeys?.has(key))

  const selectionColumn: ColumnDef<T> | null = selectable
    ? {
        key: '__select',
        header: (
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => onToggleAll?.(allSelected ? [] : allKeys)}
            onClick={(event) => event.stopPropagation()}
            inputProps={{ 'aria-label': 'Select all rows' }}
          />
        ),
        align: 'center',
        render: (row, index) => {
          const key = getRowKey!(row, index)
          return (
            <Checkbox
              size="small"
              checked={selectedRowKeys?.has(key) ?? false}
              onChange={() => onToggleRow?.(key)}
              onClick={(event) => event.stopPropagation()}
              inputProps={{ 'aria-label': 'Select row' }}
            />
          )
        },
      }
    : null

  const rowNumberColumn: ColumnDef<T> = {
    key: '__rowNumber',
    header: 'S/N',
    align: 'center',
    render: (_row, index) => rowNumberOffset + pageOffset + index + 1,
  }

  const allColumns = [
    ...(selectionColumn ? [selectionColumn] : []),
    ...(showRowNumber ? [rowNumberColumn] : []),
    ...columns,
  ]
  const visibleColumns = allColumns.filter(
    (col) => !col.hideBelow || screenWidth > col.hideBelow,
  )

  if (isLoading) return <>{loadingSkeleton ?? <Spinner fullPage />}</>

  const empty = emptyState ?? (
    <EmptyState
      title="Nothing here yet"
      description="When records arrive, they will show up in this table."
    />
  )

  if (stackOnMobile && screenWidth < BREAKPOINTS.md) {
    const [titleColumn, ...detailColumns] = columns.filter(
      (col) => !isActionsColumn(col),
    )
    const actionColumns = columns.filter(isActionsColumn)

    if (sortedData.length === 0) {
      return <div className={styles.cardsEmpty}>{empty}</div>
    }

    return (
      <div className={styles.cards} role="list" aria-label={ariaLabel}>
        {selectable && (
          <div className={styles.selectAll}>
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => onToggleAll?.(allSelected ? [] : allKeys)}
              inputProps={{ 'aria-label': 'Select all rows' }}
            />
            <span aria-hidden>Select all</span>
          </div>
        )}
        {pageRows.map((row, index) => {
          const key = getRowKey ? getRowKey(row, index) : index
          const open = onRowClick ? () => onRowClick(row) : undefined
          return (
            <div key={key} role="listitem">
              <div
                className={[
                  styles.card,
                  onRowClick ? styles.cardClickable : '',
                  getRowClassName ? getRowClassName(row, index) : '',
                ].join(' ')}
                {...(open
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: open,
                      onKeyDown: (event: React.KeyboardEvent) => {
                        if (event.target !== event.currentTarget) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          open()
                        }
                      },
                    }
                  : {})}>
                <div className={styles.cardHead}>
                  {selectionColumn?.render(row, index)}
                  {titleColumn && (
                    <div className={styles.cardTitle}>
                      {titleColumn.render(row, index)}
                    </div>
                  )}
                </div>
                {detailColumns.length > 0 && (
                  <dl className={styles.cardFields}>
                    {detailColumns.map((col) => (
                      <div key={col.key} className={styles.cardField}>
                        <dt>{col.header}</dt>
                        <dd>{col.render(row, index)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {actionColumns.length > 0 && (
                  <div
                    className={styles.cardActions}
                    onClick={(event) => event.stopPropagation()}>
                    {actionColumns.map((col) => (
                      <React.Fragment key={col.key}>
                        {col.render(row, index)}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {pager}
      </div>
    )
  }

  const table = (
    <TableContainer
      component={Paper}
      className={styles.root}
      sx={{
        borderRadius: plain ? 0 : 'var(--radius-panel)',
        boxShadow: plain ? 'none' : 'var(--shadow-panel)',
        border: plain ? 'none' : '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-elevated)',
        backgroundImage: 'none',
        color: 'var(--color-text-heading)',
        maxWidth: '100%',
        overflowX: allowOverflow ? 'visible' : 'auto',
        overflowY: allowOverflow ? 'visible' : 'hidden',
      }}>
      <Table
        aria-label={ariaLabel}
        sx={{
          backgroundColor: 'var(--color-bg-elevated)',
          ...(allowOverflow ? {} : { minWidth: 720 }),
        }}>
        <TableHead
          sx={{
            background: plain
              ? 'var(--color-bg-subtle)'
              : 'var(--color-bg-hero)',
          }}>
          <TableRow>
            {visibleColumns.map((col) => (
              <StyledTableCell
                key={col.key}
                align={col.align ?? 'left'}
                plain={plain}>
                {col.sortAccessor ? (
                  <TableSortLabel
                    active={sort?.key === col.key}
                    direction={sort?.key === col.key ? sort.direction : 'asc'}
                    onClick={() => handleSort(col.key)}>
                    {col.header}
                  </TableSortLabel>
                ) : (
                  col.header
                )}
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <StyledTableCell colSpan={visibleColumns.length}>
                {empty}
              </StyledTableCell>
            </TableRow>
          ) : (
            pageRows.map((row, index) => (
              <StyledTableRow
                key={getRowKey ? getRowKey(row, index) : index}
                className={
                  getRowClassName ? getRowClassName(row, index) : undefined
                }
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={onRowClick ? { cursor: 'pointer' } : undefined}>
                {visibleColumns.map((col) => (
                  <StyledTableCell key={col.key} align={col.align ?? 'left'}>
                    {col.render(row, index)}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  if (!pager) return table

  return (
    <div className={styles.paged}>
      {table}
      {pager}
    </div>
  )
}
