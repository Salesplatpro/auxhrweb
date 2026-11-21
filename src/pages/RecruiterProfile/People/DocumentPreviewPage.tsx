import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { DocumentPaper } from '@/features/people/components/DocumentPaper'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import {
  useStaffDocument,
  useStaffMember,
} from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { useProfile } from '@/features/profile/hooks/useProfile'

import styles from './DocumentPreviewPage.module.scss'

const PAY_SLOT = { offer_letter: 2, pay_agreement: 1 } as Record<string, number>

export const DocumentPreviewPage = () => {
  const navigate = useNavigate()
  const { staffId = '', documentId = '' } = useParams()
  const { organizationId } = usePeopleAccess()
  const { profile } = useProfile()
  const { staff } = useStaffMember(organizationId, staffId)
  const { draft, isLoading, hasError } = useStaffDocument(
    organizationId,
    staffId,
    documentId,
  )
  const { sendDraft, isSaving } = useStaffActions(organizationId)
  const [isConfirming, setIsConfirming] = useState(false)

  const documentsTab = `${peoplePaths.employee(staffId)}?tab=documents`

  if (isLoading) return <Spinner fullPage />
  if (hasError || !draft || !staff) {
    return (
      <PageShell>
        <EmptyState
          title="We could not load this document"
          description="It may have been sent or deleted."
          action={
            <Button onClick={() => navigate(documentsTab)}>
              Back to documents
            </Button>
          }
        />
      </PageShell>
    )
  }

  const { document, preview } = draft
  const isDraft = document.status === 'draft'
  const payMissing = preview.missing.includes('pay')
  const company = profile?.activeOrganization?.name ?? 'Your company'
  const firstName = staff.fullName.split(' ')[0] ?? staff.fullName
  const sender = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ')

  const paragraphs: React.ReactNode[] = preview.body.split('\n\n')
  if (payMissing) {
    paragraphs.splice(
      PAY_SLOT[document.template] ?? paragraphs.length,
      0,
      <span key="pay" className={styles.pay}>
        Your pay will be:{' '}
        <Pill tone="danger" size="sm">
          No pay set up yet
        </Pill>
      </span>,
    )
  }

  const handleSend = async () => {
    const sent = await sendDraft(staff, document.id)
    setIsConfirming(false)
    if (sent) navigate(documentsTab)
  }

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker={`People · ${staff.fullName}`}
        title={document.title}
        lead={`For ${staff.fullName} · ${preview.facts.jobTitle}${
          isDraft ? ' · draft, not sent yet' : ''
        }`}
        actions={
          isDraft ? (
            <div className={styles.actions}>
              <Button
                variant="outline"
                onClick={() => navigate(`${documentsTab}&edit=${document.id}`)}>
                Back to edit
              </Button>
              <Button
                variant="ink"
                pill
                disabled={payMissing}
                onClick={() => setIsConfirming(true)}>
                Send for signing
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => navigate(documentsTab)}>
              Back to documents
            </Button>
          )
        }
      />
      <div className={styles.page}>
        <DocumentPaper
          companyName={company}
          title={document.title}
          dateLabel={formatDateOnly(
            (document.sentAt ?? document.createdAt).slice(0, 10),
          )}
          paragraphs={paragraphs}
          signatory={sender || null}
          signerName={staff.fullName}
        />
      </div>
      <ConfirmDialog
        open={isConfirming}
        title="Send for signing?"
        description={`${firstName} will get an email to sign this.`}
        message={`${document.title} · ${company} · you can see when it is opened and signed.`}
        confirmLabel="Send for signing"
        variant="ink"
        isConfirming={isSaving}
        onConfirm={() => void handleSend()}
        onCancel={() => setIsConfirming(false)}
      />
    </PageShell>
  )
}
