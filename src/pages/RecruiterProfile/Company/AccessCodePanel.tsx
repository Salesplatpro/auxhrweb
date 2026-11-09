import React, { useRef, useState } from 'react'
import { LuCopy, LuRefreshCw } from 'react-icons/lu'

import { Alert, ConfirmDialog } from '@/components/feedback'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useOrganizationAccessCode } from '@/features/organizations/hooks/useOrganizationAccessCode'
import { Organization } from '@/features/organizations/types'

import styles from './AccessCodePanel.module.scss'

const HINT =
  'Recruiters with an email on your company domain can join with this code. Share it only with your team.'

export const AccessCodePanel = ({
  organization,
}: {
  organization: Organization
}) => {
  const {
    code,
    isLoading,
    loadError,
    isUnavailable,
    actionError,
    isWorking,
    rotate,
    disable,
    retry,
  } = useOrganizationAccessCode(organization.id)
  const [confirmingNew, setConfirmingNew] = useState(false)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      codeRef.current?.select()
    }
  }

  const body = () => {
    if (organization.status !== 'verified') {
      return (
        <p className={styles.note}>
          Access codes are available once AuxHR verifies your company.
        </p>
      )
    }
    if (isLoading) return <Spinner />
    if (isUnavailable) {
      return (
        <p className={styles.note}>Access codes aren&apos;t available yet.</p>
      )
    }
    if (loadError) {
      return (
        <Alert variant="error">
          We couldn&apos;t load your access code.{' '}
          <button type="button" className={styles.link} onClick={retry}>
            Try again
          </button>
        </Alert>
      )
    }
    if (!code) {
      return (
        <Button type="button" loading={isWorking} onClick={() => rotate()}>
          Create access code
        </Button>
      )
    }
    return (
      <>
        <div className={styles.codeRow}>
          <input
            ref={codeRef}
            className={styles.code}
            value={code}
            readOnly
            aria-label="Access code"
            onFocus={(event) => event.target.select()}
          />
          <Button
            type="button"
            variant="outline"
            icon={<LuCopy />}
            onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            icon={<LuRefreshCw />}
            disabled={isWorking}
            onClick={() => setConfirmingNew(true)}>
            New code
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isWorking}
            onClick={() => {
              setCopied(false)
              void disable()
            }}>
            Turn off
          </Button>
        </div>
      </>
    )
  }

  return (
    <PagePanel title="Access code" hint={HINT}>
      {actionError && <Alert variant="error">{actionError}</Alert>}
      {body()}
      <ConfirmDialog
        open={confirmingNew}
        title="Make a new access code?"
        message="The current code stops working straight away. Anyone who hasn't joined yet will need the new one."
        confirmLabel="Make new code"
        isConfirming={isWorking}
        onCancel={() => setConfirmingNew(false)}
        onConfirm={() => {
          setConfirmingNew(false)
          setCopied(false)
          void rotate()
        }}
      />
    </PagePanel>
  )
}
