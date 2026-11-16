import React, { useEffect, useState } from 'react'
import {
  LuBriefcase,
  LuCalendar,
  LuFilter,
  LuMapPin,
  LuPencil,
  LuSend,
  LuSparkles,
  LuStar,
  LuUsers,
} from 'react-icons/lu'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  formatClosingDate,
  formatEmploymentType,
  formatLocation,
} from '@/components/features/jobs/JobDetailsView/jobDetailsFormat'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PageShell } from '@/components/layout/PageShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/ui/MetricCard'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { useJobSummary } from '@/features/applications/hooks/useJobSummary'
import { fetchJobApplications } from '@/features/applications/services/applicationService'
import {
  getStatusBadge,
  getStatusLabel,
} from '@/pages/RecruiterProfile/getJobStatus'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import {
  AiMessageComposer,
  AiMessageComposerTarget,
} from '../MyJobPosts/Messaging/AiMessageComposer'
import listStyles from '../MyJobPosts/MyJobPosts.module.scss'
import { CandidatePanel } from './CandidatePanel/CandidatePanel'
import { CandidatesTab } from './CandidatesTab'
import styles from './JobDetail.module.scss'
import { OverviewTab } from './OverviewTab'
import { AiConfigurationTab, PreScreeningTab, SettingsTab } from './SetupTabs'

const TAB_KEYS = [
  'overview',
  'candidates',
  'pre-screening',
  'ai-configuration',
  'settings',
] as const
type TabKey = (typeof TAB_KEYS)[number]

const isTabKey = (value: string | null): value is TabKey =>
  TAB_KEYS.includes(value as TabKey)

const MESSAGE_SHORTLIST_LIMIT = 200

const JobDetail = () => {
  const { jobId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, error, isLoading } = useIndividualJobQuery(jobId)
  const { summary } = useJobSummary(jobId)
  const [shortlistTargets, setShortlistTargets] = useState<
    AiMessageComposerTarget[] | null
  >(null)
  const [loadingShortlist, setLoadingShortlist] = useState(false)

  const tabParam = searchParams.get('tab')
  const tab: TabKey = isTabKey(tabParam) ? tabParam : 'overview'
  const applicationId = searchParams.get('applicationId')

  useEffect(() => {
    if (error) notify('error', 'Error loading job post', { autoClose: 2000 })
  }, [error])

  const setTab = (next: string) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set('tab', next)
      return params
    })

  const openCandidate = (id: string) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set('applicationId', id)
      return params
    })

  const closeCandidate = () =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.delete('applicationId')
      return params
    })

  const messageShortlist = async () => {
    setLoadingShortlist(true)
    try {
      const result = await fetchJobApplications(jobId, {
        applicationStatus: 'shortlisted',
        limit: MESSAGE_SHORTLIST_LIMIT,
      })
      const targets = result.data.applications.map((application) => ({
        id: application.id,
        talentId: application.talent.id,
        talentName:
          `${application.talent.firstName} ${application.talent.lastName}`.trim(),
      }))
      if (targets.length === 0) {
        notify('error', 'No shortlisted candidates on this job yet')
        return
      }
      setShortlistTargets(targets)
    } catch (err) {
      notify('error', getErrorMessage(err, "Couldn't load the shortlist"))
    } finally {
      setLoadingShortlist(false)
    }
  }

  if (isLoading) return <Spinner fullPage />

  const job = data?.data?.job
  if (!job) return null

  const title = job.role?.name ?? 'Job post'
  const status = job.status ?? 'draft'
  const closes = formatClosingDate(job)
  const meta = [
    { icon: <LuMapPin />, text: formatLocation(job) },
    { icon: <LuBriefcase />, text: formatEmploymentType(job) },
    { icon: <LuCalendar />, text: closes ? `Closes ${closes}` : null },
    {
      icon: <LuUsers />,
      text: `${
        summary?.applicants.total ?? job.noOfApplicants ?? 0
      } applicants`,
    },
  ].filter((item) => item.text)

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'Job Posts', to: '/recruiterDashboard/myJobPosts' },
          { label: title },
        ]}
        title={title}
        titleAddon={
          <StatusBadge
            status={status === 'active' ? 'Open' : getStatusLabel(status)}
            {...getStatusBadge(status)}
            showDot
          />
        }
        description={
          <span className={styles.meta}>
            {meta.map((item) => (
              <span key={item.text} className={styles.metaItem}>
                {item.icon}
                {item.text}
              </span>
            ))}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              icon={<LuPencil size={16} />}
              onClick={() => navigate(`/recruiterDashboard/editJob/${jobId}`)}>
              Edit Job
            </Button>
            <Button
              variant="outline"
              icon={<LuSparkles size={16} />}
              onClick={() => setTab('ai-configuration')}>
              AI Configuration
            </Button>
            <Button
              variant="ink"
              icon={<LuSend size={16} />}
              loading={loadingShortlist}
              onClick={() => void messageShortlist()}>
              Message Shortlist
            </Button>
          </>
        }
      />

      <div className={styles.stats}>
        <MetricCard
          label="Applicants"
          icon={<LuUsers />}
          value={summary ? String(summary.applicants.total) : undefined}
          delta={summary?.applicants.thisWeek}
          deltaFormat="count"
          deltaLabel="this week"
        />
        <MetricCard
          label="Pre-Screening Pass Rate"
          icon={<LuFilter />}
          value={
            summary
              ? summary.passRate.value == null
                ? '—'
                : `${summary.passRate.value}%`
              : undefined
          }
          delta={summary?.passRate.deltaVsLastPost}
          deltaLabel="vs last post"
        />
        <MetricCard
          label="Avg. CV Match"
          icon={<LuSparkles />}
          value={
            summary
              ? summary.avgCvMatch.value == null
                ? '—'
                : `${summary.avgCvMatch.value}%`
              : undefined
          }
          delta={summary?.avgCvMatch.deltaThisWeek}
          deltaLabel="across applicants"
        />
        <MetricCard
          label="Shortlisted"
          icon={<LuStar />}
          value={summary ? String(summary.shortlisted.count) : undefined}
          hint={
            summary
              ? `${summary.shortlisted.pctOfApplicants}% of applicants`
              : undefined
          }
        />
      </div>

      <section className={listStyles.panel}>
        <div className={listStyles.tabs}>
          <Tabs
            activeKey={tab}
            onChange={setTab}
            tabs={[
              { key: 'overview', label: 'Overview' },
              {
                key: 'candidates',
                label: 'Candidates',
                count: summary?.applicants.total,
              },
              { key: 'pre-screening', label: 'Pre-Screening' },
              { key: 'ai-configuration', label: 'AI Configuration' },
              { key: 'settings', label: 'Settings' },
            ]}
          />
        </div>

        {tab === 'overview' && (
          <OverviewTab
            job={job}
            summary={summary}
            onViewCandidates={() => setTab('candidates')}
          />
        )}
        {tab === 'candidates' && (
          <CandidatesTab jobId={jobId} onOpenCandidate={openCandidate} />
        )}
        {tab === 'pre-screening' && (
          <PreScreeningTab jobId={jobId} job={job} summary={summary} />
        )}
        {tab === 'ai-configuration' && (
          <AiConfigurationTab jobId={jobId} job={job} />
        )}
        {tab === 'settings' && <SettingsTab jobId={jobId} job={job} />}
      </section>

      {applicationId && (
        <CandidatePanel
          applicationId={applicationId}
          jobTitle={title}
          onClose={closeCandidate}
        />
      )}

      <AiMessageComposer
        open={shortlistTargets !== null}
        onClose={() => setShortlistTargets(null)}
        jobId={jobId}
        targets={shortlistTargets ?? []}
        onSent={() => setShortlistTargets(null)}
      />
    </PageShell>
  )
}

export default JobDetail
