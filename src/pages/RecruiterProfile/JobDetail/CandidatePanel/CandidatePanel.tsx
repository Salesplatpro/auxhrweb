import React, { useState } from 'react'
import {
  LuCheck,
  LuDownload,
  LuFileText,
  LuMessageSquare,
  LuX,
} from 'react-icons/lu'

import { PagePanel } from '@/components/layout/PagePanel'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { useApplication } from '@/features/applications/hooks/useApplication'
import { useRevalidateJob } from '@/features/applications/hooks/useRevalidateJob'
import { downloadCandidateFitReport } from '@/features/applications/services/applicationService'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { humanStatus } from '@/pages/TalentProfile/Job/jobPipeline'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { ApplicationDetail } from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'
import { viewCandidateCv } from '@/utils/viewCandidateCv'

import { getStatusBadge } from '../../getJobStatus'
import { AssessmentChat } from '../../MyJobPosts/AssessmentChat'
import { CompanyTestResults } from '../../MyJobPosts/CompanyTestResults'
import { Messaging } from '../../MyJobPosts/Messaging/Messaging'
import { sourceLabel } from '../candidateLabels'
import styles from './CandidatePanel.module.scss'
import { MoveForwardModal, RejectModal } from './DecisionModals'
import { InterviewTab } from './InterviewTab'
import { PanelOverview } from './PanelOverview'

type PanelTab = 'overview' | 'answers' | 'interview' | 'messages'
type Decision = 'forward' | 'reject' | null

const appliedOn = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

type CandidatePanelProps = {
  applicationId: string
  jobTitle: string
  onClose: () => void
}

export const CandidatePanel = ({
  applicationId,
  jobTitle,
  onClose,
}: CandidatePanelProps) => {
  const { data, isLoading, mutate } = useApplication(applicationId)
  const { profile } = useProfile()
  const [tab, setTab] = useState<PanelTab>('overview')
  const [decision, setDecision] = useState<Decision>(null)
  const [loadingCv, setLoadingCv] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const application = data?.data?.application as ApplicationDetail | undefined
  const revalidateJob = useRevalidateJob(application?.jobId)

  if (!application) {
    return (
      <Drawer open size="lg" title="Candidate" onClose={onClose}>
        {isLoading ? <Spinner /> : <p>Couldn&apos;t load this candidate.</p>}
      </Drawer>
    )
  }

  const { talent } = application
  const fullName =
    `${talent.firstName} ${talent.lastName}`.trim() || 'Candidate'
  const rejected = application.status === 'rejected'

  const viewCv = async () => {
    setLoadingCv(true)
    try {
      await viewCandidateCv({ cvUrl: talent.cvUrl, talentId: talent.id })
    } finally {
      setLoadingCv(false)
    }
  }

  const downloadReport = async () => {
    setDownloading(true)
    try {
      await downloadCandidateFitReport(
        application.jobId,
        application.id,
        fullName,
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to generate report'))
    } finally {
      setDownloading(false)
    }
  }

  const afterDecision = async () => {
    setDecision(null)
    await Promise.all([mutate(), revalidateJob()])
    onClose()
  }

  const candidate = {
    applicationId: application.id,
    firstName: talent.firstName,
    fullName,
  }

  return (
    <Drawer
      open
      size="lg"
      onClose={onClose}
      leading={
        <Avatar
          firstName={talent.firstName}
          lastName={talent.lastName}
          size="lg"
        />
      }
      title={fullName}
      subtitle={`${jobTitle} · Applied ${appliedOn(
        application.createdAt,
      )} via ${sourceLabel(application.source)}`}
      actions={
        <StatusBadge
          status={humanStatus(application.status)}
          {...getStatusBadge(application.status)}
          showDot
        />
      }
      footer={
        <div className={styles.decision}>
          <span className={styles.muted}>Decision</span>
          <Button
            variant="outline"
            className={styles.reject}
            icon={<LuX size={16} />}
            disabled={rejected}
            onClick={() => setDecision('reject')}>
            Reject
          </Button>
          <Button
            variant="ink"
            icon={<LuCheck size={16} />}
            disabled={rejected}
            onClick={() => setDecision('forward')}>
            Move forward
          </Button>
        </div>
      }>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          icon={<LuFileText size={14} />}
          loading={loadingCv}
          onClick={() => void viewCv()}>
          View CV
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<LuDownload size={14} />}
          loading={downloading}
          onClick={() => void downloadReport()}>
          Download report
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<LuMessageSquare size={14} />}
          onClick={() => setTab('messages')}>
          Message
        </Button>
      </div>

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as PanelTab)}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'answers', label: 'Answers' },
          { key: 'interview', label: 'Interview' },
          { key: 'messages', label: 'Messages' },
        ]}
      />

      {tab === 'overview' && (
        <PanelOverview
          application={application}
          onChanged={() => void mutate()}
        />
      )}
      {tab === 'answers' && (
        <>
          <PagePanel title="Personality answers">
            <AssessmentChat
              items={application.personalityAnswers}
              feedback={application.matchAnalysis?.questionFeedback}
            />
          </PagePanel>
          <PagePanel title="Tailored answers">
            <AssessmentChat
              items={application.personalizedAnswers}
              feedback={application.matchAnalysis?.questionFeedback}
            />
          </PagePanel>
          <CompanyTestResults application={application} />
        </>
      )}
      {tab === 'interview' && (
        <InterviewTab
          interview={application.interview}
          nextStep={application.nextStep}
          candidate={talent}
        />
      )}
      {tab === 'messages' && (
        <Messaging
          applicationId={application.id}
          talentId={talent.id}
          jobId={application.jobId}
        />
      )}

      {decision === 'forward' && (
        <MoveForwardModal
          open
          {...candidate}
          nextStep={application.nextStep ?? 'shortlisted'}
          onCancel={() => setDecision(null)}
          onDone={afterDecision}
        />
      )}
      {decision === 'reject' && (
        <RejectModal
          open
          {...candidate}
          jobTitle={jobTitle}
          companyName={profile?.activeOrganization?.name}
          senderName={profile?.firstName}
          onCancel={() => setDecision(null)}
          onDone={afterDecision}
        />
      )}
    </Drawer>
  )
}
