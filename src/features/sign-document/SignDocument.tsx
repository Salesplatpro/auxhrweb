import React, { useState } from 'react'
import { HiOutlineCheckCircle } from 'react-icons/hi2'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  fetchSigningDocument,
  signDocumentWithLink,
} from '@/features/people/services/peopleService'
import { SignedCopy, SigningDocument } from '@/features/people/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './SignDocument.module.scss'

const LINK_GONE_STATUSES = [404, 410]

const isLinkGone = (error: unknown) =>
  LINK_GONE_STATUSES.includes(
    (error as { response?: { status?: number } })?.response?.status ?? 0,
  )

const downloadSignedCopy = ({ fileName, pdfBase64 }: SignedCopy) => {
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

const LinkGone = () => (
  <div className={styles.page}>
    <div className={styles.message}>
      <h1>This link no longer works</h1>
      <p>
        This link has expired or was already used. Ask the company that sent it
        to send it again.
      </p>
    </div>
  </div>
)

const Signed: React.FC<{ copy: SignedCopy }> = ({ copy }) => (
  <div className={styles.page}>
    <div className={styles.message}>
      <HiOutlineCheckCircle className={styles.doneIcon} aria-hidden />
      <h1>Signed</h1>
      <p>A copy has been emailed to you.</p>
      <Button onClick={() => downloadSignedCopy(copy)}>Download</Button>
    </div>
  </div>
)

interface SigningFormProps {
  document: SigningDocument
  onSign: (fullName: string) => Promise<void>
}

const SigningForm: React.FC<SigningFormProps> = ({ document, onSign }) => {
  const [fullName, setFullName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
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

  return (
    <div className={styles.page}>
      <article className={styles.document}>
        <header className={styles.header}>
          {document.companyLogoUrl ? (
            <img
              src={document.companyLogoUrl}
              alt={document.companyName}
              className={styles.logo}
            />
          ) : (
            <p className={styles.company}>{document.companyName}</p>
          )}
          <h1>{document.title}</h1>
          <p className={styles.for}>For {document.employeeName}</p>
        </header>
        <div className={styles.body}>{document.body}</div>
        <form className={styles.sign} onSubmit={handleSubmit}>
          <label className={styles.nameField}>
            <span>Type your full name</span>
            <input
              value={fullName}
              maxLength={120}
              autoComplete="name"
              placeholder={document.employeeName}
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
          <Button type="submit" disabled={!canSign} loading={isSigning}>
            Sign
          </Button>
        </form>
      </article>
    </div>
  )
}

interface SigningPageProps {
  cacheKey: string
  loadDocument: () => Promise<SigningDocument>
  submitSignature: (fullName: string) => Promise<SignedCopy>
  onSigned?: () => void
}

export const SigningPage: React.FC<SigningPageProps> = ({
  cacheKey,
  loadDocument,
  submitSignature,
  onSigned,
}) => {
  const [copy, setCopy] = useState<SignedCopy | null>(null)
  const [isGone, setIsGone] = useState(false)
  const { data, error, isLoading } = useSWR(cacheKey, loadDocument, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })

  const handleSign = async (fullName: string) => {
    try {
      setCopy(await submitSignature(fullName))
      onSigned?.()
    } catch (signError) {
      if (isLinkGone(signError)) {
        setIsGone(true)
      } else {
        notify(
          'error',
          getErrorMessage(signError, 'Could not sign. Try again.'),
        )
      }
    }
  }

  if (copy) return <Signed copy={copy} />
  if (isLoading) return <Spinner fullPage />
  if (isGone || error || !data) return <LinkGone />
  return <SigningForm document={data} onSign={handleSign} />
}

export const SignDocument = () => {
  const { token = '' } = useParams<{ token: string }>()
  return (
    <SigningPage
      cacheKey={`/staff-documents/${token}`}
      loadDocument={() => fetchSigningDocument(token)}
      submitSignature={(fullName) => signDocumentWithLink(token, fullName)}
    />
  )
}
