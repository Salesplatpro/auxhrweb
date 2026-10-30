import React, { useEffect, useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { Spinner } from '@/components/ui/Spinner'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffDocuments } from '@/features/people/hooks/useStaffData'
import { previewStaffDocument } from '@/features/people/services/peopleService'
import {
  DocumentPreview,
  DocumentTemplate,
  StaffDocument,
} from '@/features/people/types'
import { formatDateTime } from '@/features/people/utils/formatDate'
import { nameParts } from '@/features/people/utils/nameParts'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './DocumentsTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'

const TEMPLATES: { value: DocumentTemplate; label: string; hint: string }[] = [
  {
    value: 'offer_letter',
    label: 'Offer letter',
    hint: 'The job, start date and pay',
  },
  {
    value: 'nda',
    label: 'Confidentiality agreement',
    hint: 'Keeping company information private',
  },
  {
    value: 'work_ownership',
    label: 'Work-ownership agreement',
    hint: 'The company owns what they create at work',
  },
  {
    value: 'pay_agreement',
    label: 'Pay agreement',
    hint: 'Their pay paragraph, ready to sign',
  },
]

const STATUS_STYLE = {
  sent: {
    label: 'Sent',
    backgroundColor: 'var(--color-info-tint)',
    color: 'var(--color-info)',
  },
  signed: {
    label: 'Signed',
    backgroundColor: 'var(--color-success-tint)',
    color: 'var(--color-success)',
  },
} as const

const SCAN_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SCAN_BYTES = 10 * 1024 * 1024

const NotarizationCell: React.FC<{
  document: StaffDocument
  staffId: string
  organizationId: string
  readOnly: boolean
}> = ({ document, staffId, organizationId, readOnly }) => {
  const { setNotarization, attachNotarizedScan, downloadScan, isSaving } =
    useStaffActions(organizationId)
  if (document.status !== 'signed')
    return <span className={styles.muted}>—</span>

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!SCAN_TYPES.includes(file.type)) {
      notify('error', 'Upload the scan as a PDF, JPG or PNG file')
      return
    }
    if (file.size > MAX_SCAN_BYTES) {
      notify('error', 'The scan must be 10 MB or smaller')
      return
    }
    void attachNotarizedScan(staffId, document.id, file)
  }

  return (
    <div className={styles.notarization}>
      {document.notarizedAt ? (
        <>
          <StatusBadge
            status="Notarized"
            backgroundColor="var(--color-success-tint)"
            color="var(--color-success)"
          />
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => downloadScan(staffId, document)}>
            View scan
          </button>
        </>
      ) : (
        <label className={styles.flag}>
          <input
            type="checkbox"
            checked={document.needsNotarization}
            disabled={readOnly || isSaving}
            onChange={(event) =>
              setNotarization(staffId, document.id, event.target.checked)
            }
          />
          Needs notarization
        </label>
      )}
      {document.needsNotarization && !readOnly && (
        <label className={styles.linkButton}>
          {document.notarizedAt ? 'Replace scan' : 'Upload notarized copy'}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className={styles.fileInput}
            disabled={isSaving}
            onChange={handleFile}
          />
        </label>
      )}
    </div>
  )
}

const NewDocumentDrawer: React.FC<
  EmployeeTabProps & { open: boolean; onClose: () => void }
> = ({ staff, organizationId, open, onClose }) => {
  const { sendDocument, isSaving } = useStaffActions(organizationId)
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [preview, setPreview] = useState<DocumentPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const { firstName } = nameParts(staff.fullName)

  useEffect(() => {
    if (!open) {
      setTemplate(null)
      setPreview(null)
      setPreviewError(null)
    }
  }, [open])

  useEffect(() => {
    if (!template) return
    let isCurrent = true
    setPreview(null)
    setPreviewError(null)
    previewStaffDocument(organizationId, staff.id, template)
      .then((result) => isCurrent && setPreview(result))
      .catch(
        (error) =>
          isCurrent &&
          setPreviewError(
            getErrorMessage(error, 'Could not load the preview. Try again.'),
          ),
      )
    return () => {
      isCurrent = false
    }
  }, [organizationId, staff.id, template])

  const needsPay = preview?.missing.includes('pay') ?? false

  const handleSend = async () => {
    if (!template) return
    const sent = await sendDocument(staff, template)
    setIsConfirming(false)
    if (sent) onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New document"
      subtitle={`For ${staff.fullName}`}
      actions={
        <Button
          disabled={!preview || needsPay}
          onClick={() => setIsConfirming(true)}>
          Send for signing
        </Button>
      }>
      <fieldset className={styles.templates}>
        <legend>Choose a template</legend>
        {TEMPLATES.map((option) => (
          <label
            key={option.value}
            className={styles.template}
            data-selected={template === option.value || undefined}>
            <input
              type="radio"
              name="template"
              value={option.value}
              checked={template === option.value}
              onChange={() => setTemplate(option.value)}
            />
            <strong>{option.label}</strong>
            <span className={styles.templateHint}>{option.hint}</span>
          </label>
        ))}
      </fieldset>

      {template && !preview && !previewError && <Spinner />}
      {previewError && <Alert variant="error">{previewError}</Alert>}
      {needsPay && (
        <Alert variant="warning">
          No pay set up yet. <Link to="?tab=pay">Set up pay first.</Link>
        </Alert>
      )}
      {preview && (
        <article className={styles.preview} aria-label="Document preview">
          <h3>{preview.title}</h3>
          <div className={styles.body}>{preview.body}</div>
        </article>
      )}

      <ConfirmDialog
        open={isConfirming}
        title="Send for signing?"
        message={`${firstName} will get an email to sign this.`}
        confirmLabel="Send"
        isConfirming={isSaving}
        onConfirm={handleSend}
        onCancel={() => setIsConfirming(false)}
      />
    </Drawer>
  )
}

export const DocumentsTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const { documents, isLoading, hasError } = useStaffDocuments(
    organizationId,
    staff.id,
  )
  const { resendDocument, downloadDocument } = useStaffActions(organizationId)
  const [isCreating, setIsCreating] = useState(false)
  const isEnded = staff.status === 'ended'

  const actionsFor = (document: StaffDocument): DropdownItem[] => [
    {
      label: document.status === 'signed' ? 'Download signed copy' : 'Download',
      onClick: () => downloadDocument(staff.id, document),
    },
    ...(document.status === 'sent' && !isEnded
      ? [
          {
            label: 'Send again',
            onClick: () => resendDocument(staff, document.id),
          },
        ]
      : []),
  ]

  const columns: ColumnDef<StaffDocument>[] = [
    {
      key: 'title',
      header: 'Document',
      render: (document) => <strong>{document.title}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (document) => {
        const style = STATUS_STYLE[document.status]
        return (
          <StatusBadge
            status={style.label}
            backgroundColor={style.backgroundColor}
            color={style.color}
            showDot
          />
        )
      },
    },
    {
      key: 'sent',
      header: 'Sent',
      hideBelow: 640,
      render: (document) => formatDateTime(document.sentAt),
    },
    {
      key: 'opened',
      header: 'Opened',
      hideBelow: 900,
      render: (document) => formatDateTime(document.openedAt),
    },
    {
      key: 'signed',
      header: 'Signed',
      hideBelow: 640,
      render: (document) => formatDateTime(document.signedAt),
    },
    {
      key: 'notarization',
      header: 'Notarization',
      hideBelow: 768,
      render: (document) => (
        <NotarizationCell
          document={document}
          staffId={staff.id}
          organizationId={organizationId}
          readOnly={isEnded}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (document) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Document actions" />}
            items={actionsFor(document)}
          />
        </TableActions>
      ),
    },
  ]

  return (
    <PagePanel
      title="Documents"
      hint="Contracts sent for online signing. Every send, view and signature is recorded."
      action={
        !isEnded && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            New document
          </Button>
        )
      }>
      {hasError ? (
        <p>Couldn&apos;t load documents. Refresh the page to try again.</p>
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          isLoading={isLoading}
          getRowKey={(document) => document.id}
          ariaLabel="Documents"
          showRowNumber={false}
          emptyState={
            <EmptyState
              icon={<HiOutlineDocumentText />}
              title="No documents yet"
              description="Send an offer letter, NDA, work-ownership or pay agreement to sign online."
            />
          }
        />
      )}
      <NewDocumentDrawer
        staff={staff}
        organizationId={organizationId}
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </PagePanel>
  )
}
