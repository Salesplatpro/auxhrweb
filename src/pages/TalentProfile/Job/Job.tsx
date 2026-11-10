import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { JobOrganization } from '@/components/features/jobs/CompanyTag'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { DisplayError } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { TextLink } from '@/components/ui/TextLink'
import { SEARCH_MAX_LENGTH } from '@/features/dashboard/components/DashboardHeader/DashboardHeader'

import { Button } from '../../../components'
import { useFetchJobsQuery } from '../../../redux/api/talent'
import { formatCompensation } from '../../../utils/formatCompensation'
import { JobFiltersTypes } from '../../../utils/jobPostTypes'
import { notify } from '../../../utils/toastNotifications'
import styles from './Job.module.scss'
import { defaultFilterValues, JobFilter } from './JobFilter'
import { SingleJob } from './SingleJob'

interface JobType {
  id: string
  role: { name: string }
  experienceLevel: string
  jobBrief: string
  workMode: string[]
  locationCountry: string | null
  minSalary?: number | null
  maxSalary?: number | null
  currency?: string | null
  compensationPeriod?: string | null
  hasApplied?: boolean
  applicationStage?: string | null
  applicationStages?: Record<string, string> | null
  organization?: JobOrganization | null
}

const PAGE_SIZE = 10

const JOBS_PATH = '/talentDashboard/job'

const JobListing = ({ keyword }: { keyword: string }) => {
  const [filters, setFilters] = useState<JobFiltersTypes>(defaultFilterValues)
  const [jobs, setJobs] = useState<JobType[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const { data, error, isLoading, isFetching } = useFetchJobsQuery({
    roleId: filters.role || undefined,
    experienceLevel: filters.experienceLevel || undefined,
    workMode: filters.workMode?.length ? filters.workMode.join(',') : undefined,
    city: filters.location?.city?.name || undefined,
    state: filters.location?.state?.name || undefined,
    country: filters.location?.country?.name || undefined,
    q: keyword || undefined,
    offset,
  })

  useEffect(() => {
    if (!data) return
    const page: JobType[] = data.data.jobs
    setJobs((prev) => (offset === 0 ? page : [...prev, ...page]))
    setHasMore(page.length === PAGE_SIZE)
  }, [data, offset])

  useEffect(() => {
    if (error) {
      notify('error', 'Error fetching jobs')
    }
  }, [error])

  const handleFilterChange = (nextFilters: JobFiltersTypes) => {
    setOffset(0)
    setFilters(nextFilters)
  }

  const handleLoadMore = () => setOffset((prev) => prev + PAGE_SIZE)

  const isInitialLoading = isLoading && offset === 0
  const isLoadingMore = isFetching && offset > 0

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Jobs"
        lead="Find your dream job by searching and applying directly."
      />

      <div className={styles.section}>
        <JobFilter filters={filters} onChange={handleFilterChange} />

        <div className={styles.listing}>
          <div className={styles.resultsRow}>
            <span className={styles.resultsCount}>
              Showing {jobs.length} result{jobs.length === 1 ? '' : 's'}
              {keyword ? ` for “${keyword}”` : ''}
            </span>
            {keyword && (
              <TextLink to={JOBS_PATH} tone="muted">
                Clear search
              </TextLink>
            )}
          </div>

          {isInitialLoading ? (
            <Spinner fullPage />
          ) : jobs.length > 0 ? (
            <div className={styles.jobList}>
              {jobs.map((job, index) => (
                <SingleJob
                  key={job.id}
                  jobId={job.id}
                  jobTitle={job.role?.name}
                  jobCategory={job.experienceLevel}
                  jobBrief={job.jobBrief}
                  jobWorkMode={job.workMode}
                  jobCountry={job.locationCountry ?? undefined}
                  jobExperience={job.experienceLevel}
                  jobSalary={formatCompensation(job)}
                  isApplied={job.hasApplied}
                  applicationStage={job.applicationStage}
                  applicationStages={job.applicationStages}
                  organization={job.organization}
                  tourId={index === 0 ? 'job-card' : undefined}
                />
              ))}
            </div>
          ) : error ? (
            <DisplayError message="We couldn't load jobs. Please try again." />
          ) : (
            <EmptyState
              title="No jobs found"
              description="Try adjusting your filters or check back later for new openings."
            />
          )}

          {!isInitialLoading && hasMore && (
            <div className={styles.loadMore}>
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={isLoadingMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
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
