import React, { useState } from 'react'

import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { BackButton } from '@/components/ui/BackButton'
import {
  DataTable,
  sortByAccessor,
  TableToolbar,
} from '@/components/ui/DataTable'
import { FilterBar, FilterFieldConfig } from '@/components/ui/FilterPanel'

import { DisplayError } from '../../../components'
import { useFetchAllApplicationsQuery } from '../../../redux/api/recruiter'
import styles from './AllApplications.module.scss'
import { ApplicationColumnRow, buildApplicationColumns } from './columns'

interface RawApplicationRow {
  id?: string
  jobId?: string
  job?: { id?: string }
  talent?: {
    firstName: string
    lastName: string
    prescreeningScore?: number
    profile?: {
      prescreeningScore?: number
    }
  }
  cvSimilarityScore?: number
  createdAt: string
}

const toColumnRow = (row: RawApplicationRow): ApplicationColumnRow => ({
  id: row.id,
  jobId: row.jobId ?? row.job?.id,
  applicantName: `${row.talent?.firstName ?? ''} ${
    row.talent?.lastName ?? ''
  }`.trim(),
  prescreeningScore:
    row.talent?.prescreeningScore ?? row.talent?.profile?.prescreeningScore,
  cvSimilarityScore: row.cvSimilarityScore,
  dateApplied: row.createdAt,
})

type SortDirection = 'asc' | 'desc'

interface ApplicationsFilterValues {
  search: string
}

const defaultApplicationsFilters: ApplicationsFilterValues = { search: '' }

const APPLICATIONS_FILTER_FIELDS: FilterFieldConfig<ApplicationsFilterValues>[] =
  [
    {
      type: 'search',
      key: 'search',
      label: 'Search',
      placeholder: 'Search by applicant name',
    },
  ]

const columns = buildApplicationColumns()

const AllApplications: React.FC = () => {
  const { data, isLoading, error } = useFetchAllApplicationsQuery({})
  const [filters, setFilters] = useState<ApplicationsFilterValues>(
    defaultApplicationsFilters,
  )
  const [sortKey, setSortKey] = useState('dateApplied')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const applicationsRaw: RawApplicationRow[] = data?.data?.applications ?? []
  const applicationRows = applicationsRaw.map(toColumnRow)

  const query = filters.search.trim().toLowerCase()
  const filteredApplications = query
    ? applicationRows.filter((row) =>
        row.applicantName.toLowerCase().includes(query),
      )
    : applicationRows

  const sortColumn = columns.find((col) => col.key === sortKey)
  const applications = sortColumn?.sortAccessor
    ? sortByAccessor(
        filteredApplications,
        sortColumn.sortAccessor,
        sortDirection,
      )
    : filteredApplications

  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortKey(key)
    setSortDirection(direction)
  }

  if (error) return <DisplayError message="Error loading applications" />

  return (
    <PageShell wide>
      <BackButton />
      <PageHero
        compact
        title="Applications"
        lead="Every application across your jobs, with search and sort."
      />
      <div className={styles.list}>
        <FilterBar
          fields={APPLICATIONS_FILTER_FIELDS}
          filters={filters}
          defaultFilters={defaultApplicationsFilters}
          onChange={setFilters}
          ariaLabel="Filter applications"
        />
        <TableToolbar
          columns={columns}
          resultsCount={applications.length}
          visibleColumnKeys={[]}
          onToggleColumn={() => {}}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
        <DataTable
          columns={columns}
          data={applications}
          pageSize={10}
          isLoading={isLoading}
          ariaLabel="All applications"
        />
      </div>
    </PageShell>
  )
}

export default AllApplications
