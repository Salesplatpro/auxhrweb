import React from 'react'
import { HiOutlineCalculator } from 'react-icons/hi2'

import { Alert } from '@/components/feedback/Alert'
import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useHeadcountCost } from '@/features/people/hooks/useStaffData'
import { HeadcountCostRow } from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'
import { formatMoney } from '@/features/people/utils/formatMoney'
import { exportRowsToCsv } from '@/utils/exportRowsToCsv'

const NO_DEPARTMENT = 'No department'

const money = (key: keyof HeadcountCostRow) => (row: HeadcountCostRow) =>
  formatMoney(row.currency, Number(row[key]))

const COLUMNS: ColumnDef<HeadcountCostRow>[] = [
  {
    key: 'department',
    header: 'Department',
    render: (row) => <strong>{row.department ?? NO_DEPARTMENT}</strong>,
  },
  { key: 'staff', header: 'Staff', render: (row) => row.staffCount },
  {
    key: 'base',
    header: 'Base salary',
    hideBelow: 900,
    render: money('baseSalary'),
  },
  { key: 'bonus', header: 'Bonus', hideBelow: 900, render: money('bonus') },
  {
    key: 'commission',
    header: 'Commission target',
    hideBelow: 900,
    render: money('commissionTarget'),
  },
  { key: 'total', header: 'Total yearly cost', render: money('total') },
]

const CSV_HEADERS = [
  'Currency',
  'Department',
  'Staff',
  'Base salary',
  'Bonus',
  'Commission target',
  'Total yearly cost',
]

const csvRow = (row: HeadcountCostRow, department: string) => [
  row.currency,
  department,
  String(row.staffCount),
  String(row.baseSalary),
  String(row.bonus),
  String(row.commissionTarget),
  String(row.total),
]

export const HeadcountCost = () => {
  const { organizationId } = usePeopleAccess()
  const { cost, isLoading, hasError } = useHeadcountCost(organizationId)
  const hasRows = !!cost && cost.departments.length > 0

  const downloadCsv = () => {
    if (!cost) return
    exportRowsToCsv(
      CSV_HEADERS,
      [
        ...cost.departments.map((row) =>
          csvRow(row, row.department ?? NO_DEPARTMENT),
        ),
        ...cost.totals.map((row) => csvRow(row, 'Whole company')),
      ],
      `headcount-cost-${todayDateOnly()}.csv`,
    )
  }

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Headcount cost"
        lead="What current staff cost each year in pay, by department. Each currency is added up separately."
        actions={
          hasRows ? (
            <HeroAction onClick={downloadCsv}>Download CSV</HeroAction>
          ) : undefined
        }
      />

      <Alert variant="info">
        This is the cost of pay only. It is not a cash forecast.
      </Alert>

      {hasError ? (
        <EmptyState
          title="Couldn't load headcount cost"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <>
          {hasRows && (
            <StatGrid>
              {cost.totals.map((row) => (
                <StatCard
                  key={row.currency}
                  label={`Yearly cost in ${row.currency}`}
                  value={formatMoney(row.currency, row.total)}
                  caption={`${row.staffCount} staff`}
                />
              ))}
            </StatGrid>
          )}
          <DataTable
            columns={COLUMNS}
            data={cost?.departments ?? []}
            isLoading={isLoading}
            getRowKey={(row) => `${row.currency}-${row.department ?? ''}`}
            ariaLabel="Headcount cost by department"
            showRowNumber={false}
            emptyState={
              <EmptyState
                icon={<HiOutlineCalculator />}
                title="No pay set up yet"
                description="Set up pay on each employee's Pay tab to see what your team costs."
              />
            }
          />
        </>
      )}
    </PageShell>
  )
}
