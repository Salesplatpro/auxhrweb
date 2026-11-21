import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { Timeline } from '@/components/ui/Timeline'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useStaffDocuments } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { StaffDocument } from '@/features/people/types'
import {
  DOCUMENT_STATUS,
  documentHistory,
  TONE_COLOURS,
} from '@/features/people/utils/documentStatus'
import {
  formatDateOnly,
  formatDateTime,
} from '@/features/people/utils/formatDate'
import { notify } from '@/utils/toastNotifications'

import styles from './DocumentsTab.module.scss'
import type { EmployeeTabProps } from './employeeTabs'
import { NewDocumentDrawer } from './NewDocumentDrawer'

const SCAN_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SCAN_BYTES = 10 * 1024 * 1024

const shortDate = (value: string | null) =>
  value ? formatDateOnly(value.slice(0, 10)) : '—'

const NotarizationPanel: React.FC<{
  document: StaffDocument
  staffId: string
  organizationId: string
  readOnly: boolean
}> = ({ document, staffId, organizationId, readOnly }) => {
  const {
    setNotarization,
    attachNotarizedScan,
    downloadScan,
    downloadDocument,
    isSaving,
  } = useStaffActions(organizationId)

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
    <PagePanel title={`${document.title} · notarization`}>
      <div className={styles.notarization}>
        <label className={styles.flag}>
          <input
            type="checkbox"
            checked={document.needsNotarization}
            disabled={readOnly || isSaving || !!document.notarizedAt}
            onChange={(event) =>
              setNotarization(staffId, document.id, event.target.checked)
            }
          />
          Needs notarization
        </label>
        {document.needsNotarization && (
          <div className={styles.scanActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDocument(staffId, document)}>
              Download
            </Button>
            {!readOnly && (
              <label className={styles.upload}>
                {document.notarizedAt
                  ? 'Replace scan'
                  : 'Upload notarized copy'}
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
        )}
        {document.needsNotarization && !document.notarizedAt && (
          <p className={styles.muted}>
            Download the signed copy, get it notarized, then upload the scan
            here.
          </p>
        )}
        {document.notarizedAt && (
          <button
            type="button"
            className={styles.scan}
            onClick={() => downloadScan(staffId, document)}>
            <span className={styles.scanType}>
              {document.notarizedScanName?.split('.').pop()?.toUpperCase() ??
                'PDF'}
            </span>
            <span>
              <strong>{document.notarizedScanName ?? 'Notarized scan'}</strong>
              <span className={styles.muted}>
                Scan uploaded by {document.notarizedByName ?? 'HR'} on{' '}
                {shortDate(document.notarizedAt)}
              </span>
            </span>
          </button>
        )}
      </div>
    </PagePanel>
  )
}

const DocumentDetail: React.FC<
  EmployeeTabProps & { document: StaffDocument }
> = ({ staff, organizationId, document }) => {
  const { downloadDocument } = useStaffActions(organizationId)
  const firstName = staff.fullName.split(' ')[0] ?? staff.fullName
  const events = documentHistory(document, firstName, staff.email)
  const isEnded = staff.status === 'ended'
  return (
    <>
      <PagePanel
        title={`${document.title} · history`}
        action={
          document.status === 'signed' && (
            <Button
              variant="ink"
              pill
              size="sm"
              onClick={() => downloadDocument(staff.id, document)}>
              Download signed copy
            </Button>
          )
        }>
        {events.length === 0 ? (
          <p className={styles.muted}>Nothing has happened to this yet.</p>
        ) : (
          <Timeline
            items={events.map((event) => ({
              id: event.key,
              title: event.label,
              detail: event.text,
              time: formatDateTime(event.at),
              tone: event.key === 'declined' ? 'danger' : 'default',
            }))}
          />
        )}
      </PagePanel>
      {document.status === 'signed' && (
        <NotarizationPanel
          document={document}
          staffId={staff.id}
          organizationId={organizationId}
          readOnly={isEnded}
        />
      )}
    </>
  )
}

export const DocumentsTab: React.FC<EmployeeTabProps> = ({
  staff,
  organizationId,
}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { documents, isLoading, hasError } = useStaffDocuments(
    organizationId,
    staff.id,
  )
  const { resendDocument, downloadDocument, retryCopy, deleteDraft } =
    useStaffActions(organizationId)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isEnded = staff.status === 'ended'

  const editId = searchParams.get('edit')
  const editing = editId
    ? documents.find((document) => document.id === editId) ?? null
    : null
  const selected = documents.find((document) => document.id === selectedId)
  const signedCount = documents.filter(
    (document) => document.status === 'signed',
  ).length

  const closeDrawer = () => {
    setIsCreating(false)
    if (editId) {
      const next = new URLSearchParams(searchParams)
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }

  const copyCheckCode = (checkCode: string) =>
    navigator.clipboard.writeText(checkCode).then(
      () => notify('success', 'Check code copied'),
      () => notify('error', 'Could not copy the check code'),
    )

  const actionsFor = (document: StaffDocument): DropdownItem[] => {
    if (document.status === 'draft') {
      return [
        {
          label: 'Preview',
          onClick: () =>
            navigate(peoplePaths.employeeDocument(staff.id, document.id)),
        },
        {
          label: 'Edit draft',
          onClick: () => {
            const next = new URLSearchParams(searchParams)
            next.set('edit', document.id)
            setSearchParams(next, { replace: true })
          },
        },
        {
          label: 'Delete draft',
          onClick: () => void deleteDraft(staff.id, document.id),
        },
      ]
    }
    return [
      { label: 'View details', onClick: () => setSelectedId(document.id) },
      {
        label:
          document.status === 'signed' ? 'Download signed copy' : 'Download',
        onClick: () => downloadDocument(staff.id, document),
      },
      ...(document.copyStatus === 'failed'
        ? [
            {
              label: 'Try the signed copy again',
              onClick: () => retryCopy(staff.id, document.id),
            },
          ]
        : []),
      ...(document.checkCode
        ? [
            {
              label: 'Copy check code',
              onClick: () => copyCheckCode(document.checkCode!),
            },
          ]
        : []),
      ...((document.status === 'sent' || document.status === 'declined') &&
      !isEnded
        ? [
            {
              label: 'Send again',
              onClick: () => resendDocument(staff, document.id),
            },
          ]
        : []),
    ]
  }

  const columns: ColumnDef<StaffDocument>[] = [
    {
      key: 'title',
      header: 'Document',
      render: (document) => (
        <button
          type="button"
          className={styles.titleButton}
          onClick={() =>
            document.status === 'draft'
              ? navigate(peoplePaths.employeeDocument(staff.id, document.id))
              : setSelectedId(document.id)
          }>
          <strong>{document.title}</strong>
          <span className={styles.muted}>For {staff.fullName}</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (document) => {
        const status = DOCUMENT_STATUS[document.displayStatus]
        return (
          <StatusBadge
            status={status.label}
            {...TONE_COLOURS[status.tone]}
            showDot
          />
        )
      },
    },
    {
      key: 'sent',
      header: 'Sent',
      hideBelow: 640,
      render: (document) => shortDate(document.sentAt),
    },
    {
      key: 'signed',
      header: 'Signed',
      hideBelow: 640,
      render: (document) => (
        <>
          {shortDate(document.signedAt)}
          {document.copyStatus === 'pending' && (
            <span className={styles.copyStatus}>Copy on its way</span>
          )}
          {document.copyStatus === 'failed' && (
            <span className={styles.copyStatus} data-failed>
              Copy failed
            </span>
          )}
        </>
      ),
    },
    {
      key: 'sentBy',
      header: 'Sent by',
      hideBelow: 900,
      render: (document) => document.sentByName ?? '—',
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
    <>
      <PagePanel
        title="Documents"
        hint={`${documents.length} document${
          documents.length === 1 ? '' : 's'
        } · ${signedCount} signed`}
        action={
          !isEnded && (
            <Button
              variant="ink"
              pill
              size="sm"
              onClick={() => setIsCreating(true)}>
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
            pageSize={10}
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
      </PagePanel>
      {selected && selected.status !== 'draft' && (
        <DocumentDetail
          staff={staff}
          organizationId={organizationId}
          document={selected}
        />
      )}
      <NewDocumentDrawer
        staff={staff}
        organizationId={organizationId}
        open={isCreating || !!editing}
        draft={editing}
        onClose={closeDrawer}
      />
    </>
  )
}
