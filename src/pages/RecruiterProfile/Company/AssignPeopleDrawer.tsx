import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Spinner } from '@/components/ui/Spinner'
import {
  useAssignedStaffIds,
  useSaveHrAssignments,
} from '@/features/people/hooks/useHrAssignments'
import { useStaffList } from '@/features/people/hooks/useStaffData'
import { useDebouncedValue } from '@/hooks'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { Pagination } from '../MyJobPosts/Pagination'
import styles from './CompanyMembersPanel.module.scss'

const PEOPLE_PER_PAGE = 20

export interface AssignableTeammate {
  userId: string
  name: string
}

const PeoplePicker: React.FC<{
  organizationId: string
  teammate: AssignableTeammate
  onClose: () => void
}> = ({ organizationId, teammate, onClose }) => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { assignedStaffIds, isLoading: isLoadingAssigned } =
    useAssignedStaffIds(organizationId, teammate.userId)
  const { items, total, isLoading, hasError } = useStaffList(organizationId, {
    search: debouncedSearch,
    status: '',
    limit: PEOPLE_PER_PAGE,
    offset: (page - 1) * PEOPLE_PER_PAGE,
  })
  const save = useSaveHrAssignments(organizationId)

  const assigned = useMemo(() => new Set(assignedStaffIds), [assignedStaffIds])
  const isChecked = (staffId: string) =>
    changes.get(staffId) ?? assigned.has(staffId)

  const toggle = (staffId: string, checked: boolean) => {
    setChanges((current) => {
      const next = new Map(current)
      if (checked === assigned.has(staffId)) {
        next.delete(staffId)
      } else {
        next.set(staffId, checked)
      }
      return next
    })
  }

  const submit = async () => {
    const entries = [...changes.entries()]
    setIsSaving(true)
    try {
      await save({
        assigneeUserId: teammate.userId,
        add: entries.filter(([, checked]) => checked).map(([id]) => id),
        remove: entries.filter(([, checked]) => !checked).map(([id]) => id),
      })
      notify('success', `Saved the people ${teammate.name} tracks`)
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not save these people'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`People ${teammate.name} tracks`}
      subtitle="They see these people's performance and activity, and can never see pay, benefits or contracts."
      actions={
        <Button
          type="button"
          loading={isSaving}
          disabled={changes.size === 0}
          onClick={() => void submit()}>
          Save
        </Button>
      }>
      <input
        className={styles.search}
        aria-label="Search employees"
        placeholder="Search by name, email, title or department"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
      />
      {isLoading || isLoadingAssigned ? (
        <Spinner />
      ) : hasError ? (
        <p className={styles.empty}>
          Couldn&apos;t load your employees. Close this and try again.
        </p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {debouncedSearch
            ? 'No one matches that.'
            : 'Add employees on the People page first.'}
        </p>
      ) : (
        <ul className={styles.people}>
          {items.map((staff) => {
            const isEnded = staff.status === 'ended'
            return (
              <li key={staff.id}>
                <label className={styles.person}>
                  <input
                    type="checkbox"
                    aria-label={staff.fullName}
                    checked={isChecked(staff.id)}
                    disabled={isEnded && !assigned.has(staff.id)}
                    onChange={(event) => toggle(staff.id, event.target.checked)}
                  />
                  <span>
                    <span className={styles.personName}>{staff.fullName}</span>
                    <span className={styles.meta}>
                      {staff.jobTitle}
                      {isEnded ? ' · Employment ended' : ''}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
      {total > PEOPLE_PER_PAGE && (
        <Pagination
          totalItems={total}
          itemsPerPage={PEOPLE_PER_PAGE}
          currentPage={page}
          onPageChange={setPage}
        />
      )}
    </Drawer>
  )
}

export const AssignPeopleDrawer: React.FC<{
  organizationId: string
  teammate: AssignableTeammate | null
  onClose: () => void
}> = ({ organizationId, teammate, onClose }) =>
  teammate ? (
    <PeoplePicker
      key={teammate.userId}
      organizationId={organizationId}
      teammate={teammate}
      onClose={onClose}
    />
  ) : null
