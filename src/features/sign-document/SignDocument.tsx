import React, { useState } from 'react'
import { LuBriefcase, LuCheck, LuClock3, LuMail, LuX } from 'react-icons/lu'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { IconBadge } from '@/components/ui/IconBadge'
import { Spinner } from '@/components/ui/Spinner'
import { DocumentPaper } from '@/features/people/components/DocumentPaper'
import {
  declineDocumentWithLink,
  fetchSigningDocument,
  signDocumentWithLink,
} from '@/features/people/services/peopleService'
import { SignedCopy, SigningDocument } from '@/features/people/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './SignDocument.module.scss'

const LINK_GONE_STATUSES = [404, 410]

type GoneDetails = {
  documentTitle: string | null
  companyName: string | null
  companyEmail: string | null
}

const isLinkGone = (error: unknown) =>
  LINK_GONE_STATUSES.includes(
    (error as { response?: { status?: number } })?.response?.status ?? 0,
  )

const goneDetailsFrom = (error: unknown): GoneDetails | null =>
  (error as { response?: { data?: { error?: { details?: GoneDetails } } } })
    ?.response?.data?.error?.details ?? null

const downloadSignedCopy = (fileName: string, pdfBase64: string) => {
  const bytes = Uint8Array.from(atob(pdfBase64), (char) => char.charCodeAt(0))
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/pdf' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

const LinkGone = ({ details }: { details: GoneDetails | null }) => {
  const company = details?.companyName ?? 'the company'
  const title = details?.documentTitle?.toLowerCase() ?? 'document'
  return (
    <PublicShell
      companyName={details?.companyName}
      title={
        details?.documentTitle
          ? `Signing · ${details.documentTitle}`
          : undefined
      }
      width="narrow">
      <section className={styles.message}>
        <IconBadge icon={<LuClock3 />} tone="warning" size="lg" />
        <h1>This link no longer works</h1>
        <p>
          It has expired or was already used. Ask {company} to send your {title}{' '}
          again.
        </p>
        {details?.companyEmail && (
          <Button
            variant="outline"
            icon={<LuMail aria-hidden />}
            onClick={() => {
              window.location.href = `mailto:${details.companyEmail}`
            }}>
            Email {company}
          </Button>
        )}
      </section>
    </PublicShell>
  )
}

const stampOf = (date: Date) =>
  `${date.getDate()} ${date.toLocaleDateString('en-GB', {
    month: 'short',
  })} ${date.getFullYear()} at ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

const Signed: React.FC<{ copy: SignedCopy; document: SigningDocument }> = ({
  copy,
  document,
}) => (
  <PublicShell
    companyName={document.companyName}
    title={`Signing · ${document.title}`}
    width="narrow">
    <section className={styles.message}>
      <IconBadge icon={<LuCheck />} tone="success" size="lg" />
      <h1>Signed. A copy has been emailed to you.</h1>
      <p>
        You signed your {document.title.toLowerCase()} at {document.companyName}{' '}
        on {stampOf(new Date())}.
      </p>
      <CheckList
        variant="summary"
        className={styles.summary}
        items={[
          {
            label: copy.copyPending
              ? 'Your signed copy is on its way by email and may take a few minutes'
              : 'Signed copy emailed to you',
          },
          { label: `${document.companyName} can see your signature` },
          { label: 'Find it any time in My work' },
        ]}
      />
      {copy.pdfBase64 && (
        <Button
          variant="brand"
          pill
          onClick={() => downloadSignedCopy(copy.fileName, copy.pdfBase64!)}>
          Download signed copy
        </Button>
      )}
    </section>
  </PublicShell>
)

const Declined: React.FC<{ document: SigningDocument }> = ({ document }) => (
  <PublicShell
    companyName={document.companyName}
    title={`Signing · ${document.title}`}
    width="narrow">
    <section className={styles.message}>
      <IconBadge icon={<LuX />} tone="danger" size="lg" />
      <h1>You declined to sign</h1>
      <p>
        We told {document.companyName}. They can send your{' '}
        {document.title.toLowerCase()} again if this was a mistake.
      </p>
    </section>
  </PublicShell>
)

interface SigningFormProps {
  document: SigningDocument
  onSign: (fullName: string) => Promise<void>
  onDecline?: () => Promise<void>
}

const SigningForm: React.FC<SigningFormProps> = ({
  document,
  onSign,
  onDecline,
}) => {
  const [fullName, setFullName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false)
  const canSign = fullName.trim().length > 0 && agreed

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSign) return
    setIsSigning(true)
    try {
      await onSign(fullName.trim())
    } finally {
      setIsSigning(false)
    }
  }

  const handleDecline = async () => {
    if (!onDecline) return
    setIsDeclining(true)
    try {
      await onDecline()
    } finally {
      setIsDeclining(false)
      setIsConfirmingDecline(false)
    }
  }

  return (
    <PublicShell
      companyName={document.companyName}
      title={`Signing · ${document.title}`}
      width="medium">
      <h1 className={styles.title}>
        {document.title} for {document.employeeName}
      </h1>
      <p className={styles.lead}>
        Read the whole document, then sign at the bottom.
      </p>
      <div className={styles.paper}>
        <DocumentPaper
          companyName={document.companyName}
          title={document.title}
          dateLabel={document.dateLabel}
          paragraphs={document.body.split('\n\n')}
          signatory={document.signatory}
          signerName={document.employeeName}
        />
      </div>
      <form className={styles.sign} onSubmit={handleSubmit}>
        <h2>Sign this document</h2>
        <label className={styles.nameField}>
          <span>Type your full name</span>
          <input
            value={fullName}
            maxLength={120}
            autoComplete="name"
            placeholder="Full name"
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label className={styles.agree}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          I agree to sign this document electronically
        </label>
        <div className={styles.actions}>
          <Button
            type="submit"
            variant="ink"
            pill
            disabled={!canSign}
            loading={isSigning}>
            Sign
          </Button>
          {onDecline && (
            <Button
              type="button"
              variant="ghost"
              icon={<LuBriefcase aria-hidden />}
              onClick={() => setIsConfirmingDecline(true)}>
              Decline to sign
            </Button>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={isConfirmingDecline}
        title="Decline to sign?"
        description={`${document.companyName} will be told you declined. They can send it to you again.`}
        confirmLabel="Decline"
        variant="danger"
        isConfirming={isDeclining}
        onConfirm={() => void handleDecline()}
        onCancel={() => setIsConfirmingDecline(false)}
      />
    </PublicShell>
  )
}

interface SigningPageProps {
  cacheKey: string
  loadDocument: () => Promise<SigningDocument>
  submitSignature: (fullName: string) => Promise<SignedCopy>
  submitDecline?: () => Promise<void>
  onSigned?: () => void
}

export const SigningPage: React.FC<SigningPageProps> = ({
  cacheKey,
  loadDocument,
  submitSignature,
  submitDecline,
  onSigned,
}) => {
  const [copy, setCopy] = useState<SignedCopy | null>(null)
  const [declined, setDeclined] = useState(false)
  const [goneDetails, setGoneDetails] = useState<GoneDetails | null>(null)
  const [isGone, setIsGone] = useState(false)
  const { data, error, isLoading } = useSWR(cacheKey, loadDocument, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })

  const fail = (failure: unknown, fallback: string) => {
    if (isLinkGone(failure)) {
      setGoneDetails(goneDetailsFrom(failure))
      setIsGone(true)
    } else {
      notify('error', getErrorMessage(failure, fallback))
    }
  }

  const handleSign = async (fullName: string) => {
    try {
      setCopy(await submitSignature(fullName))
      onSigned?.()
    } catch (signError) {
      fail(signError, 'Could not sign. Try again.')
    }
  }

  const handleDecline = async () => {
    try {
      await submitDecline?.()
      setDeclined(true)
      onSigned?.()
    } catch (declineError) {
      fail(declineError, 'Could not decline. Try again.')
    }
  }

  if (isLoading) return <Spinner fullPage />
  if (data && copy) return <Signed copy={copy} document={data} />
  if (data && declined) return <Declined document={data} />
  if (isGone || error || !data) {
    return <LinkGone details={goneDetails ?? goneDetailsFrom(error)} />
  }
  return (
    <SigningForm
      document={data}
      onSign={handleSign}
      onDecline={submitDecline ? handleDecline : undefined}
    />
  )
}

export const SignDocument = () => {
  const { token = '' } = useParams<{ token: string }>()
  return (
    <SigningPage
      cacheKey={`/staff-documents/${token}`}
      loadDocument={() => fetchSigningDocument(token)}
      submitSignature={(fullName) => signDocumentWithLink(token, fullName)}
      submitDecline={() => declineDocumentWithLink(token)}
    />
  )
}
