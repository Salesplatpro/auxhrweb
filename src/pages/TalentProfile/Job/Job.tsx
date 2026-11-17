import React, { FormEvent, useEffect, useState } from 'react'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { LuTarget } from 'react-icons/lu'
import { useSearchParams } from 'react-router-dom'

import { getStateOptions } from '@/components/forms/LocationSelect/useLocationSelect'
import { Select } from '@/components/forms/Select'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterChip } from '@/components/ui/FilterChip'
import { Spinner } from '@/components/ui/Spinner'
import { Heading, Text } from '@/components/ui/Typography'
import { SEARCH_MAX_LENGTH } from '@/features/dashboard/components/DashboardHeader/DashboardHeader'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { MID_LEVEL } from '@/features/talent-applications/format'
import { useFetchJobsQuery } from '@/redux/api/talent'

import styles from './Job.module.scss'
import { ListedJob, SingleJob } from './SingleJob'

const PAGE_SIZE = 10
const NIGERIA = 'NG'

type ChipKey =
  | 'hybrid'
  | 'remote'
  | 'onSite'
  | 'mid'
  | 'pay'
  | 'fullTime'
  | 'week'

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'remote', label: 'Remote' },
  { key: 'onSite', label: 'On-site' },
  { key: 'mid', label: 'Mid-level' },
  { key: 'pay', label: '₦300k+ / month' },
  { key: 'fullTime', label: 'Full time' },
  { key: 'week', label: 'Posted this week' },
]

const WORK_MODES: ChipKey[] = ['hybrid', 'remote', 'onSite']

const resultsLine = (total: number, keyword: string, place: string) =>
  `${total} job${total === 1 ? '' : 's'}${
    keyword ? ` match “${keyword}”` : ''
  }${place ? ` in ${place}` : ''}`

const JobListing = ({ keyword }: { keyword: string }) => {
  const [, setSearchParams] = useSearchParams()
  const { profile } = useProfile()
  const [query, setQuery] = useState(keyword)
  const [place, setPlace] = useState<string | null>(null)
  const [chips, setChips] = useState<Set<ChipKey>>(new Set())
  const [offset, setOffset] = useState(0)
  const [jobs, setJobs] = useState<ListedJob[]>([])
  const state = place ?? profile?.locationState ?? ''

  const { data, error, isLoading, isFetching } = useFetchJobsQuery({
    workMode:
      WORK_MODES.filter((mode) => chips.has(mode)).join(',') || undefined,
    experienceLevel: chips.has('mid') ? MID_LEVEL : undefined,
    minMonthlySalary: chips.has('pay') ? 300000 : undefined,
    employmentType: chips.has('fullTime') ? 'full_time' : undefined,
    postedWithin: chips.has('week') ? 'week' : undefined,
    state: state || undefined,
    q: keyword || undefined,
    offset,
  })
  const total: number = data?.data?.total ?? 0

  useEffect(() => {
    if (!data) return
    const page: ListedJob[] = data.data.jobs
    setJobs((prev) => (offset === 0 ? page : [...prev, ...page]))
  }, [data, offset])

  const restart = () => setOffset(0)

  const toggleChip = (key: ChipKey) => {
    restart()
    setChips((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const search = (event: FormEvent) => {
    event.preventDefault()
    const next = query.trim().slice(0, SEARCH_MAX_LENGTH)
    setSearchParams(next ? { q: next } : {})
  }

  const stateOptions = [
    { label: 'Anywhere', value: '' },
    ...getStateOptions(NIGERIA).map((option) => ({
      label: option.label,
      value: option.label,
    })),
  ]

  return (
    <PageShell wide>
      <header className={styles.header}>
        <Heading level={1}>Find Jobs</Heading>
        <Text as="p" size="fs-md" color="muted">
          {resultsLine(total, keyword, state)}
        </Text>
      </header>

      <form className={styles.searchCard} role="search" onSubmit={search}>
        <label className={styles.search}>
          <HiOutlineMagnifyingGlass aria-hidden />
          <input
            type="search"
            value={query}
            maxLength={SEARCH_MAX_LENGTH}
            placeholder="Search jobs, companies or skills"
            aria-label="Search jobs, companies or skills"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.place}>
          <Select
            name="state"
            options={stateOptions}
            value={state}
            icon={<LuTarget />}
            searchable
            placeholder="Anywhere"
            onChange={(value) => {
              restart()
              setPlace(value)
            }}
          />
        </div>
        <Button type="submit" variant="gradient" size="lg">
          Search
        </Button>
      </form>

      <div className={styles.chips}>
        {CHIPS.map((chip) => (
          <FilterChip
            key={chip.key}
            active={chips.has(chip.key)}
            onClick={() => toggleChip(chip.key)}>
            {chip.label}
          </FilterChip>
        ))}
      </div>

      {isLoading && offset === 0 ? (
        <Spinner fullPage />
      ) : jobs.length > 0 ? (
        <div className={styles.list}>
          {jobs.map((job, index) => (
            <SingleJob
              key={job.id}
              job={job}
              tourId={index === 0 ? 'job-card' : undefined}
            />
          ))}
          {jobs.length < total && (
            <Button
              variant="secondary"
              className={styles.more}
              loading={isFetching && offset > 0}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}>
              Load more
            </Button>
          )}
        </div>
      ) : (
        <EmptyState
          title={error ? 'We couldn’t load jobs' : 'No jobs found'}
          description={
            error
              ? 'Please try again in a moment.'
              : 'Try fewer filters or another place.'
          }
        />
      )}
    </PageShell>
  )
}

const Job = () => {
  const [searchParams] = useSearchParams()
  const keyword = (searchParams.get('q') ?? '')
    .trim()
    .slice(0, SEARCH_MAX_LENGTH)
  return <JobListing key={keyword} keyword={keyword} />
}

export default Job
