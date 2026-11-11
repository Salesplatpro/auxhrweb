import {
  formatEmploymentType,
  formatWorkMode,
} from '@/components/features/jobs/JobDetailsView/jobDetailsFormat'
import {
  formatSalaryRange,
  monthlyDivisor,
} from '@/features/jobs/utils/jobSalary'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'
import { RecruiterJob } from '@/utils/recruiterJobPostsTypes'

export const isDraftLike = (job: Pick<RecruiterJob, 'status'>) =>
  job.status === 'draft' || job.status === 'pending_payment'

export const jobTitle = (job: RecruiterJob) => capitalizeEachWord(job.role.name)

export const jobSubtitle = (job: RecruiterJob) =>
  [job.department, formatEmploymentType({ employmentType: job.employmentType })]
    .filter(Boolean)
    .join(' · ')

export const jobLocation = (job: RecruiterJob) => {
  const onSiteModes = job.workMode.filter((mode) => mode !== 'remote')
  if (onSiteModes.length === 0) return 'Remote'
  const place =
    job.locationState || job.locationCity || job.locationCountry || ''
  const modes = formatWorkMode({ workMode: onSiteModes })
  return [place, modes].filter(Boolean).join(' · ')
}

export const jobMonthlySalary = (job: RecruiterJob) =>
  formatSalaryRange(job, {
    short: true,
    divideBy: monthlyDivisor(job.compensationPeriod),
  }) ?? '—'

const shortDate = (iso: string, withYear: boolean) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })

export const jobPostedLabel = (job: RecruiterJob) =>
  isDraftLike(job)
    ? `Draft saved ${shortDate(job.updatedAt, false)}`
    : shortDate(job.createdAt, true)

/** Where Edit goes: a draft continues the post-a-job flow; a published job opens the edit page. */
export const jobEditPath = (job: RecruiterJob) => {
  if (!isDraftLike(job)) return `/recruiterDashboard/editJob/${job.id}`
  return job.aiConfigId
    ? `/recruiterDashboard/postjob/${job.id}/details`
    : `/recruiterDashboard/postjob/${job.id}`
}
