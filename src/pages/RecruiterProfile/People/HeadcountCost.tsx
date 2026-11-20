import React, { useState } from 'react'
import { HiOutlineCalculator } from 'react-icons/hi2'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
} from 'recharts'

import { Select } from '@/components/forms/Select'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { MetricCard } from '@/components/ui/MetricCard'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useHeadcountCost } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import {
  HeadcountCost as HeadcountCostData,
  HeadcountCostRow,
  HeadcountMonths,
  HeadcountPeople,
} from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'
import { formatCurrency } from '@/features/people/utils/formatMoney'
import { exportRowsToCsv } from '@/utils/exportRowsToCsv'

import styles from './HeadcountCost.module.scss'

const NO_DEPARTMENT = 'No department'
const MONTHS_PER_YEAR = 12

const PERIOD_OPTIONS = [
  { label: 'Last 3 months', value: '3' },
  { label: 'Last 6 months', value: '6' },
  { label: 'Last 12 months', value: '12' },
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

const monthly = (row: HeadcountCostRow) => row.baseSalary / MONTHS_PER_YEAR

const monthLabel = (month: string) => {
  const [year, number] = month.split('-').map(Number)
  return new Date(year!, number! - 1).toLocaleString('en', { month: 'short' })
}

const peopleCaption = (people: HeadcountPeople, empty: string) => {
  if (people.count === 0) return empty
  const extra = people.count - people.names.length
  return `${people.names.join(', ')}${extra > 0 ? ` +${extra}` : ''}`
}

const HeadcountChart = ({
  byMonth,
}: {
  byMonth: HeadcountCostData['byMonth']
}) => {
  const data = byMonth.map((item) => ({
    label: monthLabel(item.month),
    value: item.headcount,
  }))

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
            <LabelList
              dataKey="value"
              position="top"
              fontSize={12}
              fill="var(--color-text-heading)"
            />
            {data.map((item, index) => (
              <Cell
                key={`${item.label}-${index}`}
                fill={
                  index === data.length - 1
                    ? 'var(--color-brand-800)'
                    : 'var(--color-brand-200)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const HeadcountCost = () => {
  const { organizationId } = usePeopleAccess()
  const [months, setMonths] = useState<HeadcountMonths>(12)
  const { cost, isLoading, hasError } = useHeadcountCost(organizationId, months)

  const departments = cost?.departments ?? []
  const largestByCurrency = departments.reduce<Record<string, number>>(
    (largest, row) => ({
      ...largest,
      [row.currency]: Math.max(largest[row.currency] ?? 0, row.baseSalary),
    }),
    {},
  )

  const columns: ColumnDef<HeadcountCostRow>[] = [
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <span className={styles.department}>
          {row.department ?? NO_DEPARTMENT}
        </span>
      ),
    },
    { key: 'people', header: 'People', render: (row) => row.staffCount },
    {
      key: 'share',
      header: '',
      hideBelow: 640,
      render: (row) => (
        <span className={styles.share} aria-hidden>
          <span
            className={styles.shareFill}
            style={{
              width: `${
                ((row.baseSalary || 0) /
                  (largestByCurrency[row.currency] || 1)) *
                100
              }%`,
            }}
          />
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Monthly cost',
      align: 'right',
      render: (row) => formatCurrency(row.currency, monthly(row)),
    },
  ]

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

  const monthlyPayCost = cost?.totals.length
    ? cost.totals
        .map((row) => formatCurrency(row.currency, monthly(row)))
        .join(' + ')
    : formatCurrency('NGN', 0)

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'People', to: peoplePaths.employees },
          { label: 'Headcount cost' },
        ]}
        title="Headcount cost"
        description="How many people work here and what their pay costs each month."
        actions={
          <div className={styles.actions}>
            <Select
              options={PERIOD_OPTIONS}
              value={String(months)}
              onChange={(value) => setMonths(Number(value) as HeadcountMonths)}
            />
            {departments.length > 0 && (
              <Button variant="outline" onClick={downloadCsv}>
                Download CSV
              </Button>
            )}
          </div>
        }
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load headcount cost"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <>
          <div className={styles.stats}>
            <MetricCard
              label="Headcount"
              value={String(cost?.headcount ?? 0)}
              hint="active today"
              loading={isLoading}
            />
            <MetricCard
              label="Invited"
              value={String(cost?.invited.count ?? 0)}
              hint={
                cost?.invited.count === 1
                  ? `${cost.invited.names[0]}, starts soon`
                  : peopleCaption(
                      cost?.invited ?? { count: 0, names: [] },
                      'Nobody waiting to start',
                    )
              }
              loading={isLoading}
            />
            <MetricCard
              label={`Left in last ${months} months`}
              value={String(cost?.left.count ?? 0)}
              hint={peopleCaption(
                cost?.left ?? { count: 0, names: [] },
                'Nobody left',
              )}
              loading={isLoading}
            />
            <MetricCard
              label="Monthly pay cost"
              value={monthlyPayCost}
              hint="base salaries"
              loading={isLoading}
            />
          </div>

          <PagePanel
            title="Headcount by month"
            hint="Active staff at month end">
            <HeadcountChart byMonth={cost?.byMonth ?? []} />
          </PagePanel>

          <PagePanel
            flush
            title="By department"
            hint="People and monthly base pay">
            <DataTable
              columns={columns}
              data={departments}
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
          </PagePanel>
        </>
      )}
    </PageShell>
  )
}
