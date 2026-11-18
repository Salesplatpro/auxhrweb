import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  ColumnDef,
  DataTable,
  sortByAccessor,
  TableToolbar,
} from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar, FilterFieldConfig } from '@/components/ui/FilterPanel'
import { Pagination } from '@/components/ui/Pagination'
import {
  deleteAdminOrganization,
  fetchAdminOrganizations,
  rejectAdminOrganization,
  verifyAdminOrganization,
} from '@/features/admin/services/adminService'
import { AdminOrganization } from '@/features/admin/types'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './Organizations.module.scss'

type SortDirection = 'asc' | 'desc'

interface OrganizationFilterValues {
  search: string
  status: string
}

const defaultOrganizationFilters: OrganizationFilterValues = {
  search: '',
  status: '',
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
]

const ROWS_PER_PAGE = 10

const Organizations = () => {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<OrganizationFilterValues>(
    defaultOrganizationFilters,
  )
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [visibleKeys, setVisibleKeys] = useState<string[]>([
    'name',
    'owner',
    'contact',
    'status',
    'createdAt',
  ])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [orgToDelete, setOrgToDelete] = useState<AdminOrganization | null>(null)
  const [isDeletingOrg, setIsDeletingOrg] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminOrganizations({ limit: 200, offset: 0 })
      setOrganizations(data.organizations)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to load organizations'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filterFields: FilterFieldConfig<OrganizationFilterValues>[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Search',
      placeholder: 'Name, email, or website',
    },
    {
      type: 'select',
      key: 'status',
      label: 'Status',
      offValue: '',
      options: STATUS_OPTIONS,
    },
  ]

  const handleVerify = async (org: AdminOrganization) => {
    setUpdatingId(org.id)
    try {
      await verifyAdminOrganization(org.id)
      notify('success', `${org.name} verified`)
      await load()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to verify organization'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async (org: AdminOrganization) => {
    setUpdatingId(org.id)
    try {
      await rejectAdminOrganization(org.id)
      notify('success', `${org.name} rejected`)
      await load()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to reject organization'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return
    setIsDeletingOrg(true)
    try {
      await deleteAdminOrganization(orgToDelete.id)
      notify('success', `${orgToDelete.name} permanently deleted`)
      setOrgToDelete(null)
      await load()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to delete organization'))
    } finally {
      setIsDeletingOrg(false)
    }
  }

  const columns: ColumnDef<AdminOrganization>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortLabel: 'Name',
        toggleable: true,
        render: (row) => (
          <button
            type="button"
            className={styles.nameLink}
            onClick={() => navigate(`/adminDashboard/organizations/${row.id}`)}>
            {row.name}
          </button>
        ),
        sortAccessor: (row) => row.name,
      },
      {
        key: 'owner',
        header: 'Owner',
        sortLabel: 'Owner',
        toggleable: true,
        render: (row) =>
          row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '—',
        sortAccessor: (row) =>
          row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '',
      },
      {
        key: 'contact',
        header: 'Email / Website',
        toggleable: true,
        hideBelow: 900,
        render: (row) => row.email ?? row.website ?? '—',
      },
      {
        key: 'status',
        header: 'Status',
        sortLabel: 'Status',
        toggleable: true,
        render: (row) => (
          <StatusBadge
            status={row.status}
            {...getOrganizationStatusBadge(row.status)}
          />
        ),
        sortAccessor: (row) => row.status,
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortLabel: 'Created',
        toggleable: true,
        hideBelow: 720,
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        sortAccessor: (row) => row.createdAt,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/adminDashboard/organizations/${row.id}`)
              }>
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={row.status === 'verified' || updatingId === row.id}
              onClick={() => handleVerify(row)}>
              Verify
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={row.status === 'rejected' || updatingId === row.id}
              onClick={() => handleReject(row)}>
              Reject
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={updatingId === row.id || isDeletingOrg}
              onClick={() => setOrgToDelete(row)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [updatingId, navigate, isDeletingOrg],
  )

  const visibleColumns = columns.filter(
    (col) => !col.toggleable || visibleKeys.includes(col.key),
  )

  const filteredOrganizations = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return organizations.filter((row) => {
      if (filters.status && row.status !== filters.status) return false
      if (!search) return true
      const haystack = `${row.name} ${row.email ?? ''} ${
        row.website ?? ''
      }`.toLowerCase()
      return haystack.includes(search)
    })
  }, [organizations, filters])

  const sortedOrganizations = useMemo(() => {
    const column = columns.find((col) => col.key === sortKey)
    return column?.sortAccessor
      ? sortByAccessor(
          filteredOrganizations,
          column.sortAccessor,
          sortDirection,
        )
      : filteredOrganizations
  }, [filteredOrganizations, columns, sortKey, sortDirection])

  const pagedOrganizations = sortedOrganizations.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  )

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title="Organizations"
        description="Review companies recruiters have created and verify them against the email, website, and social details they provided."
      />

      <p className={styles.sectionDescription}>
        Deleting a company removes its jobs and applications. Recruiter accounts
        stay; they are only detached from the company.
      </p>

      <div className={styles.mainColumn}>
        <FilterBar
          fields={filterFields}
          filters={filters}
          defaultFilters={defaultOrganizationFilters}
          onChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
          ariaLabel="Filter organizations"
        />
        {!isLoading && sortedOrganizations.length === 0 ? (
          <EmptyState
            title="No organizations found"
            description="Try adjusting filters, or wait for recruiters to create companies."
          />
        ) : (
          <>
            <TableToolbar
              columns={columns}
              resultsCount={sortedOrganizations.length}
              visibleColumnKeys={visibleKeys}
              onToggleColumn={(key) =>
                setVisibleKeys((prev) =>
                  prev.includes(key)
                    ? prev.filter((item) => item !== key)
                    : [...prev, key],
                )
              }
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={(key, direction) => {
                setSortKey(key)
                setSortDirection(direction)
              }}
            />
            <DataTable
              columns={visibleColumns}
              data={pagedOrganizations}
              isLoading={isLoading}
              getRowKey={(row) => row.id}
              showRowNumber
              rowNumberOffset={(page - 1) * ROWS_PER_PAGE}
              allowOverflow
              ariaLabel="Organizations table"
            />
            <Pagination
              totalItems={sortedOrganizations.length}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={page}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(orgToDelete)}
        title="Permanently delete this company?"
        message={`Deleting "${
          orgToDelete?.name ?? 'this company'
        }" removes the company, every job posted under it, its scout campaigns and team memberships, and cancels any active paid plan. Recruiter accounts are not deleted. This cannot be undone.`}
        confirmLabel="Delete company"
        variant="danger"
        isConfirming={isDeletingOrg}
        onConfirm={() => void handleDeleteOrganization()}
        onCancel={() => setOrgToDelete(null)}
      />
    </div>
  )
}

export default Organizations
