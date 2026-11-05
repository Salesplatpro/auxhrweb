import React, { useState } from 'react'
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'

import { Button } from '@/components/ui/Button'
import {
  checkSignedDocumentCode,
  checkSignedDocumentFile,
} from '@/features/people/services/peopleService'
import { DocumentCheck } from '@/features/people/types'
import { formatDateTime } from '@/features/people/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'

import styles from './VerifyDocument.module.scss'

const MAX_FILE_BYTES = 5 * 1024 * 1024

const RESULT_TEXT: Record<DocumentCheck['result'], string> = {
  verified: 'This matches the document that was signed.',
  limited:
    'This is an older document. The code matches our record, but its file cannot be compared.',
  changed:
    'The code matches, but our record of this document has changed since it was signed. Contact the company.',
}

const Result: React.FC<{ check: DocumentCheck }> = ({ check }) => (
  <section className={styles.result} data-result={check.result} role="status">
    {check.result === 'changed' ? (
      <HiOutlineExclamationTriangle aria-hidden />
    ) : (
      <HiOutlineCheckCircle aria-hidden />
    )}
    <div>
      <p className={styles.resultText}>{RESULT_TEXT[check.result]}</p>
      <dl>
        <dt>Document</dt>
        <dd>{check.title}</dd>
        <dt>Company</dt>
        <dd>{check.companyName}</dd>
        <dt>Signed by</dt>
        <dd>{check.signerName}</dd>
        <dt>Signed at</dt>
        <dd>{formatDateTime(check.signedAt)}</dd>
      </dl>
    </div>
  </section>
)

export const VerifyDocument = () => {
  const [documentId, setDocumentId] = useState('')
  const [checkCode, setCheckCode] = useState('')
  const [check, setCheck] = useState<DocumentCheck | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const run = async (request: () => Promise<DocumentCheck>) => {
    setCheck(null)
    setProblem(null)
    setIsChecking(true)
    try {
      setCheck(await request())
    } catch (error) {
      setProblem(getErrorMessage(error, 'Could not check this document.'))
    } finally {
      setIsChecking(false)
    }
  }

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setCheck(null)
      setProblem('The file must be 5 MB or smaller.')
      return
    }
    void run(() => checkSignedDocumentFile(file))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void run(() => checkSignedDocumentCode(documentId.trim(), checkCode.trim()))
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1>Check a signed document</h1>
        <p className={styles.lead}>
          Find the document ID and check code on the last page of the signed
          PDF, or upload the PDF to confirm the file has not changed.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Document ID</span>
            <input
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
            />
          </label>
          <label>
            <span>Check code</span>
            <input
              value={checkCode}
              onChange={(event) => setCheckCode(event.target.value)}
            />
          </label>
          <Button
            type="submit"
            loading={isChecking}
            disabled={!documentId.trim() || !checkCode.trim()}>
            Check code
          </Button>
        </form>

        <label className={styles.upload}>
          <span>Or upload the signed PDF</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={isChecking}
            onChange={handleFile}
          />
        </label>

        {problem && (
          <p className={styles.problem} role="alert">
            {problem}
          </p>
        )}
        {check && <Result check={check} />}
      </main>
    </div>
  )
}
