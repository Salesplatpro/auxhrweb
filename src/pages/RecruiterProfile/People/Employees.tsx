import React, { useMemo, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineUsers } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'

import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Avatar, Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { FilterBar } from '@/components/ui/FilterBar'
import type { FilterFieldConfig } from '@/components/ui/FilterPanel'
import { NoPeopleAccess } from '@/features/people/components/NoPeopleAccess'
import { StaffStatusBadge } from '@/features/people/components/StaffStatusBadge'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffList } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { StaffMember, StaffStatus } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { nameParts } from '@/features/people/utils/nameParts'
import {
  canSendInvite,
  inviteActionLabel,
} from '@/features/people/utils/staffInvite'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useDebouncedValue } from '@/hooks'

import { Pagination } from '../MyJobPosts/Pagination'
import { AddEmployeePanel } from './AddEmployeePanel'
import styles from './Employees.module.scss'
import { EndEmploymentDialog } from './EndEmploymentDialog'

const ROWS_PER_PAGE = 10

type Filters = { search: string; status: string }

const DEFAULT_FILTERS: Filters = { search: '', status: '' }

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Ended', value: 'ended' },
]

interface ActionsCellProps {
  staff: StaffMember
  onInvite: (staff: StaffMember) => void
  onEnd: (staff: StaffMember) => void
}

const ActionsCell = ({ staff, onInvite, onEnd }: ActionsCellProps) => {
  const navigate = useNavigate()

  const items: DropdownItem[] = [
    { label: 'Open', onClick: () => navigate(peoplePaths.employee(staff.id)) },
  ]
  if (canSendInvite(staff)) {
    items.push({
      label: inviteActionLabel(staff),
      onClick: () => onInvite(staff),
    })
  }
  if (staff.status !== 'ended') {
    items.push({ label: 'End employment', onClick: () => onEnd(staff) })
  }

  return (
    <TableActions onClick={(event) => event.stopPropagation()}>
      <Dropdown
        trigger={<BsThreeDotsVertical aria-label="Row actions" />}
        items={items}
      />
    </TableActions>
  )
}

export const Employees = () => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { organizationId } = usePeopleAccess()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)
  const [toEnd, setToEnd] = useState<StaffMember | null>(null)

  const search = useDebouncedValue(filters.search.trim())
  const { items, total, counts, isLoading, hasError, isForbidden } =
    useStaffList(organizationId, {
      search,
      status: filters.status as StaffStatus | '',
      limit: ROWS_PER_PAGE,
      offset: (page - 1) * ROWS_PER_PAGE,
    })
  const { sendInvite } = useStaffActions(organizationId)

  const filterFields: FilterFieldConfig<Filters>[] = useMemo(
    () => [
      {
        type: 'search',
        key: 'search',
        label: 'Search',
        placeholder: 'Search by name, email, title or department',
      },
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        offValue: '',
        options: STATUS_OPTIONS,
      },
    ],
    [],
  )

  const columns: ColumnDef<StaffMember>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (staff) => (
        <div className={styles.person}>
          <Avatar {...nameParts(staff.fullName)} size="sm" />
          <div className={styles.nameCell}>
            <span className={styles.name}>{staff.fullName}</span>
            <span className={styles.secondary}>{staff.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job title',
      hideBelow: 640,
      render: (staff) => staff.jobTitle,
    },
    {
      key: 'department',
      header: 'Department',
      hideBelow: 900,
      render: (staff) =>
        staff.department ?? <span className={styles.muted}>—</span>,
    },
    {
      key: 'manager',
      header: 'Manager',
      hideBelow: 900,
      render: (staff) =>
        staff.managerName ?? <span className={styles.muted}>—</span>,
    },
    {
      key: 'startDate',
      header: 'Start date',
      hideBelow: 768,
      render: (staff) => formatDateOnly(staff.startDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (staff) => (
        <div className={styles.statusCell}>
          <StaffStatusBadge status={staff.status} />
          {staff.status !== 'ended' && staff.invite.state === 'expired' && (
            <span className={styles.expired}>Invite expired</span>
          )}
        </div>
      ),
    },
    {
      key: 'hiredThrough',
      header: 'Hired through',
      hideBelow: 1000,
      render: (staff) => (staff.hiredThroughAuxhr ? 'AuxHR' : 'Outside'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (staff) => (
        <ActionsCell
          staff={staff}
          onInvite={(target) => void sendInvite(target.id)}
          onEnd={setToEnd}
        />
      ),
    },
  ]

  if (isForbidden) return <NoPeopleAccess />

  const companyName = profile?.activeOrganization?.name ?? 'your company'
  const hasFilters = filters.search.trim() !== '' || filters.status !== ''
  const everyone = counts.active + counts.invited + counts.ended
  const showFirstRun = !isLoading && !hasError && everyone === 0 && !hasFilters

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Employees"
        lead={`Everyone who works at ${companyName}, whether they were hired through AuxHR or not.`}
        actions={
          <HeroAction onClick={() => setAddOpen(true)}>Add employee</HeroAction>
        }
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load your employees"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : showFirstRun ? (
        <EmptyState
          icon={<HiOutlineUsers />}
          title="No employees yet"
          description="Add the people who work at your company. You can invite them to AuxHR so they can see their contracts, pay and first-week tasks."
          action={
            <Button onClick={() => setAddOpen(true)}>Add employee</Button>
          }
        />
      ) : (
        <>
          <StatGrid columns={4}>
            <StatCard value={everyone} label="Everyone" />
            <StatCard value={counts.active} label="Active" />
            <StatCard value={counts.invited} label="Invited" />
            <StatCard value={counts.ended} label="Ended" />
          </StatGrid>

          <FilterBar
            fields={filterFields}
            filters={filters}
            defaultFilters={DEFAULT_FILTERS}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
            ariaLabel="Filter employees"
          />

          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            getRowKey={(staff) => staff.id}
            ariaLabel="Employees"
            showRowNumber={false}
            onRowClick={(staff) => navigate(peoplePaths.employee(staff.id))}
            emptyState={
              <EmptyState
                title="No one matches that"
                description="Try a different name or clear the filters."
              />
            }
          />

          {total > ROWS_PER_PAGE && (
            <Pagination
              totalItems={total}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={page}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {organizationId && (
        <AddEmployeePanel
          open={addOpen}
          organizationId={organizationId}
          companyName={companyName}
          onClose={() => setAddOpen(false)}
        />
      )}

      <EndEmploymentDialog
        staff={toEnd}
        organizationId={organizationId}
        onClose={() => setToEnd(null)}
      />
    </PageShell>
  )
}
