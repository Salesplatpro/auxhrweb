import React, { useState } from 'react'
import {
  HiChevronDown,
  HiOutlineMagnifyingGlass,
  HiPlus,
} from 'react-icons/hi2'
import { LuFilter } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { DisplayError } from '@/components'
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from '@/components/forms/Select'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterFieldConfig } from '@/components/ui/FilterPanel'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useDebouncedValue, useScreenWidth } from '@/hooks'
import { useFetchRecruiterJobPostQuery } from '@/redux/api/recruiter'

import { JobsCardList } from './JobsCardList'
import { JobsTable } from './JobsTable'
import styles from './MyJobPosts.module.scss'
import { Pagination } from './Pagination'

const MOBILE_BREAKPOINT = 768
const PAGE_SIZE = 7
const POST_JOB_PATH = '/recruiterDashboard/postjob'

type TabKey = 'all' | 'active' | 'draft' | 'closed'

const TAB_STATUS: Record<TabKey, string | undefined> = {
  all: undefined,
  active: 'active',
  draft: 'draft,pending_payment',
  closed: 'closed,suspended',
}

const WORK_TYPES = [
  { value: '', label: 'All' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onSite', label: 'On-site' },
]

const SORTS = [
  { value: 'desc', label: 'Newest' },
  { value: 'asc', label: 'Oldest' },
] as const

interface MoreFilters {
  experienceLevel: string
  employmentType: string
}

const DEFAULT_MORE_FILTERS: MoreFilters = {
  experienceLevel: 'all',
  employmentType: 'all',
}

const MORE_FILTER_FIELDS: FilterFieldConfig<MoreFilters>[] = [
  {
    type: 'select',
    key: 'experienceLevel',
    label: 'Experience',
    offValue: 'all',
    options: [
      { value: 'all', label: 'Any experience' },
      ...EXPERIENCE_LEVEL_OPTIONS,
    ],
  },
  {
    type: 'select',
    key: 'employmentType',
    label: 'Job type',
    offValue: 'all',
    options: [
      { value: 'all', label: 'Any job type' },
      ...EMPLOYMENT_TYPE_OPTIONS,
    ],
  },
]

const Trigger = ({
  label,
  icon,
}: {
  label: string
  icon?: React.ReactNode
}) => (
  <span className={styles.trigger}>
    {icon}
    {label}
    <HiChevronDown size={14} aria-hidden />
  </span>
)

export const MyJobPosts = () => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const screenWidth = useScreenWidth()
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [moreFilters, setMoreFilters] = useState(DEFAULT_MORE_FILTERS)
  const [state, setState] = useState('')
  const [workMode, setWorkMode] = useState('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const q = useDebouncedValue(search.trim(), 300)

  const { data, error, isLoading, isFetching } = useFetchRecruiterJobPostQuery({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    status: TAB_STATUS[tab],
    q,
    state,
    workMode,
    sort,
    experienceLevel:
      moreFilters.experienceLevel === 'all'
        ? undefined
        : moreFilters.experienceLevel,
    employmentType:
      moreFilters.employmentType === 'all'
        ? undefined
        : moreFilters.employmentType,
  })

  const withPageReset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
    }

  if (isLoading) return <Spinner fullPage />
  if (error || !data) return <DisplayError message="Error loading jobs" />

  const { jobs, total, counts, states } = data.data
  const companyName = profile?.activeOrganization?.name
  const workTypeLabel =
    WORK_TYPES.find((option) => option.value === workMode)?.label ?? 'All'

  const emptyState =
    counts.all === 0 ? (
      <EmptyState
        title="No job posts yet"
        description="Post your first job and candidates can start applying."
        action={
          <Button variant="ink" onClick={() => navigate(POST_JOB_PATH)}>
            Post a job
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No job posts match"
        description="Try another tab, search or filter."
      />
    )

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'Hiring', to: '/recruiterDashboard/dashboard' },
          { label: 'My Job Posts' },
        ]}
        title="My Job Posts"
        description={`${counts.all} job post${counts.all === 1 ? '' : 's'}${
          companyName ? ` at ${companyName}` : ''
        } · ${counts.active} active`}
        actions={
          <Button
            variant="ink"
            icon={<HiPlus size={16} />}
            onClick={() => navigate(POST_JOB_PATH)}>
            Post a job
          </Button>
        }
      />

      <section className={styles.panel}>
        <div className={styles.tabs}>
          <Tabs
            activeKey={tab}
            onChange={(key) => withPageReset(setTab)(key as TabKey)}
            tabs={[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'active', label: 'Active', count: counts.active },
              { key: 'draft', label: 'Drafts', count: counts.draft },
              { key: 'closed', label: 'Closed', count: counts.closed },
            ]}
          />
        </div>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <HiOutlineMagnifyingGlass size={16} aria-hidden />
            <input
              type="search"
              value={search}
              maxLength={100}
              placeholder="Search job posts"
              aria-label="Search job posts"
              onChange={(event) => withPageReset(setSearch)(event.target.value)}
            />
          </label>
          <FilterBar
            compact
            fields={MORE_FILTER_FIELDS}
            filters={moreFilters}
            defaultFilters={DEFAULT_MORE_FILTERS}
            onChange={withPageReset(setMoreFilters)}
            ariaLabel="More job post filters"
          />
          <Dropdown
            align="left"
            trigger={
              <Trigger
                icon={<LuFilter size={14} aria-hidden />}
                label={`Location: ${state || 'All'}`}
              />
            }
            items={['', ...states].map((value) => ({
              key: value || 'all',
              label: value || 'All',
              onClick: () => withPageReset(setState)(value),
            }))}
          />
          <Dropdown
            align="left"
            trigger={<Trigger label={`Work type: ${workTypeLabel}`} />}
            items={WORK_TYPES.map((option) => ({
              key: option.value || 'all',
              label: option.label,
              onClick: () => withPageReset(setWorkMode)(option.value),
            }))}
          />
          <Dropdown
            align="left"
            trigger={
              <Trigger
                label={`Sort: ${
                  SORTS.find((option) => option.value === sort)?.label
                }`}
              />
            }
            items={SORTS.map((option) => ({
              key: option.value,
              label: option.label,
              onClick: () => withPageReset(setSort)(option.value),
            }))}
          />
        </div>

        <div className={isFetching ? styles.refreshing : undefined}>
          {screenWidth < MOBILE_BREAKPOINT ? (
            <JobsCardList data={jobs} emptyState={emptyState} />
          ) : (
            <JobsTable data={jobs} emptyState={emptyState} />
          )}
        </div>

        {total > 0 && (
          <Pagination
            variant="simple"
            totalItems={total}
            itemsPerPage={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
          />
        )}
      </section>
    </PageShell>
  )
}
