import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { stuckBadge } from '@/features/admin/applicationFollowUp'
import { useAdminTalentProfile } from '@/features/admin/hooks/useAdminTalentProfile'
import { useTalentStuckApplications } from '@/features/admin/hooks/useTalentStuckApplications'
import { useAdminTalentMessaging } from '@/features/messaging/hooks/useAdminTalentMessaging'
import { DisplayMessage } from '@/pages/RecruiterProfile/MyJobPosts/Messaging/DisplayMessage'
import { openCv } from '@/utils/openCv'
import { notify } from '@/utils/toastNotifications'

import { ApplicationFollowUpDrawer } from '../Applications/ApplicationFollowUpDrawer'
import onboardingStyles from '../Onboarding/Onboarding.module.scss'
import { OnboardingDrawer } from '../Onboarding/OnboardingDrawer'
import styles from './TalentDetail.module.scss'

const TalentDetail = () => {
  const { talentId } = useParams()
  const navigate = useNavigate()
  const [isLoadingCv, setIsLoadingCv] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [stuckApplicationId, setStuckApplicationId] = useState<string | null>(
    null,
  )

  const { talent, isLoading } = useAdminTalentProfile(talentId)
  const { applications: stuckApplications } =
    useTalentStuckApplications(talentId)

  const {
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    isSending,
  } = useAdminTalentMessaging(talentId ?? '')

  const handleViewCv = async () => {
    if (!talent) return
    setIsLoadingCv(true)
    try {
      await openCv({
        talentId: talent.id,
        notFoundMessage: 'This talent has no CV on file',
      })
    } finally {
      setIsLoadingCv(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      notify('error', 'Message cannot be empty', { autoClose: 2000 })
      return
    }
    try {
      await sendMessage(messageContent)
      setMessageContent('')
    } catch {
      notify('error', 'Failed to send message', { autoClose: 2000 })
    }
  }

  if (isLoading) return <Spinner fullPage />
  if (!talent) return null

  return (
    <div className={styles.page}>
      <PageHeaderTitle
        title={`${talent.firstName} ${talent.lastName}`}
        description={talent.email}
        onBack={() => navigate('/adminDashboard/talents')}
      />

      <PagePanel
        title="Profile"
        action={
          <div className={styles.panelActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFollowUpOpen(true)}>
              Onboarding follow-up
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={isLoadingCv}
              onClick={() => void handleViewCv()}>
              View talent CV
            </Button>
          </div>
        }>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Experience</span>
            <span className={styles.infoValue}>{talent.experience ?? '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Prescreening score</span>
            <span className={styles.infoValue}>
              {talent.prescreeningScore ?? '—'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Role(s)</span>
            <span className={styles.infoValue}>
              {talent.userRoles?.map((role) => role.name).join(', ') || '—'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Location</span>
            <span className={styles.infoValue}>
              {[
                talent.locationCity,
                talent.locationState,
                talent.locationCountry,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Joined</span>
            <span className={styles.infoValue}>
              {new Date(talent.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>CV on file</span>
            <span className={styles.infoValue}>
              {talent.cvFileName ?? (talent.cvUploadedAt ? 'Uploaded' : '—')}
            </span>
          </div>
        </div>
        {talent.bio ? <p className={styles.bio}>{talent.bio}</p> : null}
      </PagePanel>

      {stuckApplications.length > 0 && (
        <PagePanel title="Stuck applications">
          <div className={styles.stuckList}>
            {stuckApplications.map((application) => {
              const badge = stuckBadge(application.stage)
              return (
                <div
                  key={application.applicationId}
                  className={styles.stuckRow}>
                  <div className={styles.stuckInfo}>
                    <span className={styles.stuckJob}>
                      {application.job.title}
                    </span>
                    {application.company && (
                      <span className={styles.stuckCompany}>
                        {application.company.name}
                      </span>
                    )}
                    <span
                      className={`${onboardingStyles.badge} ${
                        onboardingStyles[badge.tone]
                      }`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className={styles.panelActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/adminDashboard/jobs/${application.job.id}?applicationId=${application.applicationId}`,
                        )
                      }>
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setStuckApplicationId(application.applicationId)
                      }>
                      Follow up
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </PagePanel>
      )}

      <PagePanel title="Message this talent">
        <div className={styles.messages}>
          {isMessagesLoading ? (
            <Spinner />
          ) : (
            <DisplayMessage messages={messages} />
          )}
        </div>
        <div className={styles.composer}>
          <textarea
            className={styles.textarea}
            placeholder="Write a message to this talent…"
            value={messageContent}
            onChange={(event) => setMessageContent(event.target.value)}
          />
          <div className={styles.composerActions}>
            <Button
              variant="primary"
              loading={isSending}
              onClick={() => void handleSendMessage()}>
              Send
            </Button>
          </div>
        </div>
      </PagePanel>
      <OnboardingDrawer
        userId={isFollowUpOpen ? talent.id : null}
        userName={`${talent.firstName} ${talent.lastName}`}
        onClose={() => setIsFollowUpOpen(false)}
      />
      <ApplicationFollowUpDrawer
        applicationId={stuckApplicationId}
        talentName={`${talent.firstName} ${talent.lastName}`}
        onClose={() => setStuckApplicationId(null)}
      />
    </div>
  )
}

export default TalentDetail
