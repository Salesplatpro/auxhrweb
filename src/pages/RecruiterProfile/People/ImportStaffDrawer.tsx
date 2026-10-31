import React, { useState } from 'react'

import { Alert } from '@/components/feedback/Alert'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Dropzone } from '@/components/ui/Dropzone/Dropzone'
import { Spinner } from '@/components/ui/Spinner'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import {
  ImportCommitResult,
  ImportRowResult,
  ImportStaffRow,
} from '@/features/people/types'
import {
  IMPORT_COLUMNS,
  parseCsv,
  toImportRows,
} from '@/features/people/utils/staffCsv'
import { exportRowsToCsv } from '@/utils/exportRowsToCsv'

import styles from './ImportStaffDrawer.module.scss'

const MAX_ROWS = 200
const HEADERS = IMPORT_COLUMNS.map((column) => column.header)

const SAMPLE_ROW: ImportStaffRow = {
  email: 'ada@example.com',
  fullName: 'Ada Obi',
  jobTitle: 'Product Designer',
  department: 'Design',
  managerEmail: '',
  startDate: '2026-01-05',
}

const toCells = (row: ImportStaffRow) =>
  IMPORT_COLUMNS.map((column) => row[column.key])

const downloadSample = () =>
  exportRowsToCsv(HEADERS, [toCells(SAMPLE_ROW)], 'staff-import-sample.csv')

type Step =
  | { name: 'upload'; problem: string | null }
  | { name: 'checking' }
  | { name: 'preview'; rows: ImportStaffRow[]; results: ImportRowResult[] }
  | { name: 'done'; rows: ImportStaffRow[]; result: ImportCommitResult }

interface ImportStaffDrawerProps {
  organizationId: string
  open: boolean
  onClose: () => void
}

export const ImportStaffDrawer: React.FC<ImportStaffDrawerProps> = ({
  organizationId,
  open,
  onClose,
}) => {
  const { checkImport, importStaff, isSaving } = useStaffActions(organizationId)
  const [step, setStep] = useState<Step>({ name: 'upload', problem: null })

  const close = () => {
    setStep({ name: 'upload', problem: null })
    onClose()
  }

  const handleFile = async ([file]: File[]) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStep({ name: 'upload', problem: 'Upload a CSV file.' })
      return
    }
    const { rows, missingColumns } = toImportRows(parseCsv(await file.text()))
    if (missingColumns.length > 0) {
      setStep({
        name: 'upload',
        problem: `The file is missing these columns: ${missingColumns.join(
          ', ',
        )}.`,
      })
      return
    }
    if (rows.length === 0 || rows.length > MAX_ROWS) {
      setStep({
        name: 'upload',
        problem:
          rows.length === 0
            ? 'The file has no staff rows.'
            : `The file has ${rows.length} rows. Import at most ${MAX_ROWS} at a time by splitting it into smaller files.`,
      })
      return
    }
    setStep({ name: 'checking' })
    const results = await checkImport(rows)
    setStep(
      results
        ? { name: 'preview', rows, results }
        : { name: 'upload', problem: null },
    )
  }

  const handleImport = async (rows: ImportStaffRow[]) => {
    const result = await importStaff(rows)
    if (result) setStep({ name: 'done', rows, result })
  }

  const downloadSkipped = (
    rows: ImportStaffRow[],
    skipped: ImportRowResult[],
  ) =>
    exportRowsToCsv(
      [...HEADERS, 'Problem'],
      skipped.map((result) => [
        ...toCells(rows[result.row - 1]!),
        result.error ?? '',
      ]),
      'staff-import-skipped.csv',
    )

  const readyCount =
    step.name === 'preview'
      ? step.results.filter((result) => !result.error).length
      : 0

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Import from file"
      subtitle="Add many existing staff at once from a CSV file. No invite emails are sent."
      actions={
        step.name === 'preview' ? (
          <>
            <Button
              variant="outline"
              onClick={() => setStep({ name: 'upload', problem: null })}>
              Choose another file
            </Button>
            <Button
              loading={isSaving}
              disabled={readyCount === 0}
              onClick={() => handleImport(step.rows)}>
              Import {readyCount} staff
            </Button>
          </>
        ) : step.name === 'done' ? (
          <Button onClick={close}>Done</Button>
        ) : undefined
      }>
      {step.name === 'upload' && (
        <div className={styles.step}>
          <p className={styles.lead}>
            The file needs these columns: {HEADERS.join(', ')}. Dates look like
            2026-01-31.{' '}
            <button
              type="button"
              className={styles.link}
              onClick={downloadSample}>
              Download sample file
            </button>
          </p>
          {step.problem && <Alert variant="error">{step.problem}</Alert>}
          <Dropzone
            files={[]}
            onAdd={handleFile}
            onRemove={() => undefined}
            accept=".csv,text/csv"
            maxFiles={1}
            label="Drop your CSV file here"
            hint={`Up to ${MAX_ROWS} staff per file`}
          />
        </div>
      )}

      {step.name === 'checking' && <Spinner />}

      {step.name === 'preview' && (
        <div className={styles.step}>
          <p className={styles.summary}>
            {readyCount} rows ready, {step.results.length - readyCount} with
            problems.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Problem</th>
                </tr>
              </thead>
              <tbody>
                {step.results.map((result) => (
                  <tr
                    key={result.row}
                    data-problem={!!result.error || undefined}>
                    <td>{result.row}</td>
                    <td>{result.fullName}</td>
                    <td>{result.email}</td>
                    <td>{result.error ?? 'Ready'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step.name === 'done' && (
        <div className={styles.step}>
          <Alert variant="success">
            {step.result.added} staff added. {step.result.skipped.length} rows
            skipped.
          </Alert>
          {step.result.skipped.length > 0 && (
            <button
              type="button"
              className={styles.link}
              onClick={() => downloadSkipped(step.rows, step.result.skipped)}>
              Download the skipped rows
            </button>
          )}
        </div>
      )}
    </Drawer>
  )
}
