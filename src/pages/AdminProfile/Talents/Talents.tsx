import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EXPERIENCE_LEVEL_OPTIONS } from '@/components/forms/Select'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
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
  FOLLOW_UP_OPTIONS,
  stageOptions,
  TALENT_STAGE_OPTIONS,
} from '@/features/admin/onboarding'
import {
  deleteAdminTalent,
  fetchAdminTalents,
} from '@/features/admin/services/adminService'
import { useRolesStore } from '@/features/admin/store/useRolesStore'
import {
  AdminTalent,
  FollowUpStatus,
  OnboardingStage,
} from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { OnboardingBadge } from '../Onboarding/OnboardingBadge'
import { OnboardingDrawer } from '../Onboarding/OnboardingDrawer'
import styles from './Talents.module.scss'

type SortDirection = 'asc' | 'desc'

interface TalentFilterValues {
  search: string
  experience: string
  roleId: string
  onboardingStage: string
  followUp: string
}

const defaultTalentFilters: TalentFilterValues = {
  search: '',
  experience: '',
  roleId: '',
  onboardingStage: '',
  followUp: '',
}

const ROWS_PER_PAGE = 10

const Talents = () => {
  const navigate = useNavigate()
  const { roles, fetchRoles } = useRolesStore()

  const [talents, setTalents] = useState<AdminTalent[]>([])
  const [talentsLoading, setTalentsLoading] = useState(true)
  const [talentFilters, setTalentFilters] =
    useState<TalentFilterValues>(defaultTalentFilters)
  const [talentSortKey, setTalentSortKey] = useState('createdAt')
  const [talentSortDirection, setTalentSortDirection] =
    useState<SortDirection>('desc')
  const [talentPage, setTalentPage] = useState(1)
  const [talentVisibleKeys, setTalentVisibleKeys] = useState<string[]>([
    'name',
    'email',
    'roles',
    'experience',
    'score',
    'cv',
    'onboarding',
    'createdAt',
  ])
  const [talentToDelete, setTalentToDelete] = useState<AdminTalent | null>(null)
  const [isDeletingTalent, setIsDeletingTalent] = useState(false)
  const [followUpTarget, setFollowUpTarget] = useState<AdminTalent | null>(null)

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  const { onboardingStage, followUp } = talentFilters

  // Onboarding filters run on the server so they cover every talent, not
  // just the loaded page; the other filters stay in the browser.
  const loadTalents = useCallback(async () => {
    setTalentsLoading(true)
    try {
      const data = await fetchAdminTalents({
        limit: 200,
        offset: 0,
        onboardingStage: onboardingStage as OnboardingStage | '',
        followUp: followUp as FollowUpStatus | '',
      })
      setTalents(data.users)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to load talents'))
    } finally {
      setTalentsLoading(false)
    }
  }, [onboardingStage, followUp])

  useEffect(() => {
    void loadTalents()
  }, [loadTalents])

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'Any role' },
      ...roles.map((role) => ({ value: role.id, label: role.name })),
    ],
    [roles],
  )

  const experienceOptions = useMemo(
    () => [{ value: '', label: 'Any experience' }, ...EXPERIENCE_LEVEL_OPTIONS],
    [],
  )

  const talentFilterFields: FilterFieldConfig<TalentFilterValues>[] = [
    {
      type: 'search',
      key: 'search',
      label: 'Search',
      placeholder: 'Name or email',
    },
    {
      type: 'select',
      key: 'experience',
      label: 'Experience',
      offValue: '',
      options: experienceOptions,
    },
    {
      type: 'select',
      key: 'roleId',
      label: 'Role',
      offValue: '',
      options: roleOptions,
    },
    {
      type: 'select',
      key: 'onboardingStage',
      label: 'Onboarding stage',
      offValue: '',
      options: stageOptions(TALENT_STAGE_OPTIONS),
    },
    {
      type: 'select',
      key: 'followUp',
      label: 'Follow-up',
      offValue: '',
      options: FOLLOW_UP_OPTIONS,
    },
  ]

  const talentColumns: ColumnDef<AdminTalent>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortLabel: 'Name',
        toggleable: true,
        render: (row) => `${row.firstName} ${row.lastName}`,
        sortAccessor: (row) => `${row.firstName} ${row.lastName}`,
      },
      {
        key: 'email',
        header: 'Email',
        sortLabel: 'Email',
        toggleable: true,
        render: (row) => row.email,
        sortAccessor: (row) => row.email,
      },
      {
        key: 'roles',
        header: 'Role(s)',
        toggleable: true,
        render: (row) =>
          row.userRoles?.map((role) => role.name).join(', ') || '—',
      },
      {
        key: 'experience',
        header: 'Experience',
        sortLabel: 'Experience',
        toggleable: true,
        render: (row) => row.experience ?? '—',
        sortAccessor: (row) => row.experience ?? '',
      },
      {
        key: 'score',
        header: 'Score',
        sortLabel: 'Score',
        toggleable: true,
        render: (row) => row.prescreeningScore ?? '—',
        sortAccessor: (row) => row.prescreeningScore ?? -1,
      },
      {
        key: 'cv',
        header: 'CV',
        toggleable: true,
        hideBelow: 900,
        render: (row) =>
          row.cvFileName ?? (row.cvUploadedAt ? 'Uploaded' : '—'),
      },
      {
        key: 'onboarding',
        header: 'Onboarding',
        sortLabel: 'Onboarding',
        toggleable: true,
        render: (row) => <OnboardingBadge summary={row.onboarding} />,
        sortAccessor: (row) =>
          row.onboarding
            ? TALENT_STAGE_OPTIONS.indexOf(row.onboarding.stage)
            : -1,
      },
      {
        key: 'createdAt',
        header: 'Joined',
        sortLabel: 'Joined',
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
              variant="outline"
              size="sm"
              onClick={() => navigate(`/adminDashboard/talents/${row.id}`)}>
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowUpTarget(row)}>
              Follow up
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTalentToDelete(row)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const visibleTalentColumns = talentColumns.filter(
    (col) => !col.toggleable || talentVisibleKeys.includes(col.key),
  )

  const filteredTalents = useMemo(() => {
    const search = talentFilters.search.trim().toLowerCase()
    return talents.filter((row) => {
      if (
        talentFilters.experience &&
        row.experience !== talentFilters.experience
      ) {
        return false
      }
      if (
        talentFilters.roleId &&
        !row.userRoles?.some((role) => role.id === talentFilters.roleId)
      ) {
        return false
      }
      if (!search) return true
      const haystack =
        `${row.firstName} ${row.lastName} ${row.email}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [talents, talentFilters])

  const sortedTalents = useMemo(() => {
    const column = talentColumns.find((col) => col.key === talentSortKey)
    return column?.sortAccessor
      ? sortByAccessor(
          filteredTalents,
          column.sortAccessor,
          talentSortDirection,
        )
      : filteredTalents
  }, [filteredTalents, talentColumns, talentSortKey, talentSortDirection])

  const pagedTalents = sortedTalents.slice(
    (talentPage - 1) * ROWS_PER_PAGE,
    talentPage * ROWS_PER_PAGE,
  )

  const handleDeleteTalent = async () => {
    if (!talentToDelete) return
    setIsDeletingTalent(true)
    try {
      await deleteAdminTalent(talentToDelete.id)
      notify('success', 'Talent permanently deleted')
      setTalentToDelete(null)
      await loadTalents()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to delete talent'))
    } finally {
      setIsDeletingTalent(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title="Talents"
        description="Manage every registered talent on the platform. Deletions are permanent."
      />

      <p className={styles.sectionDescription}>
        Deleting a talent removes their profile, CV text, embeddings,
        applications, messages, and related AI data.
      </p>

      <div className={styles.mainColumn}>
        <FilterBar
          fields={talentFilterFields}
          filters={talentFilters}
          defaultFilters={defaultTalentFilters}
          onChange={(next) => {
            setTalentFilters(next)
            setTalentPage(1)
          }}
          ariaLabel="Filter talents"
        />
        {!talentsLoading && sortedTalents.length === 0 ? (
          <EmptyState
            title="No talents found"
            description="Try adjusting filters, or wait for talents to register."
          />
        ) : (
          <>
            <TableToolbar
              columns={talentColumns}
              resultsCount={sortedTalents.length}
              visibleColumnKeys={talentVisibleKeys}
              onToggleColumn={(key) =>
                setTalentVisibleKeys((prev) =>
                  prev.includes(key)
                    ? prev.filter((item) => item !== key)
                    : [...prev, key],
                )
              }
              sortKey={talentSortKey}
              sortDirection={talentSortDirection}
              onSortChange={(key, direction) => {
                setTalentSortKey(key)
                setTalentSortDirection(direction)
              }}
            />
            <DataTable
              columns={visibleTalentColumns}
              data={pagedTalents}
              isLoading={talentsLoading}
              getRowKey={(row) => row.id}
              showRowNumber
              rowNumberOffset={(talentPage - 1) * ROWS_PER_PAGE}
              allowOverflow
              ariaLabel="Talents table"
            />
            <Pagination
              totalItems={sortedTalents.length}
              itemsPerPage={ROWS_PER_PAGE}
              currentPage={talentPage}
              onPageChange={setTalentPage}
            />
          </>
        )}
      </div>

      <OnboardingDrawer
        userId={followUpTarget?.id ?? null}
        userName={
          followUpTarget
            ? `${followUpTarget.firstName} ${followUpTarget.lastName}`
            : ''
        }
        onClose={() => setFollowUpTarget(null)}
        onSent={() => void loadTalents()}
      />

      <ConfirmDialog
        open={Boolean(talentToDelete)}
        title="Permanently delete this talent?"
        message={`Deleting ${talentToDelete?.firstName ?? ''} ${
          talentToDelete?.lastName ?? ''
        } will remove their account, CV text, embeddings, applications, messages, and all related data. This cannot be undone.`}
        confirmLabel="Delete talent"
        variant="danger"
        isConfirming={isDeletingTalent}
        onConfirm={() => void handleDeleteTalent()}
        onCancel={() => setTalentToDelete(null)}
      />
    </div>
  )
}

export default Talents
