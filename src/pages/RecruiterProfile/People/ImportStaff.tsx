import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { Dropzone } from '@/components/ui/Dropzone/Dropzone'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { peoplePaths } from '@/features/people/paths'
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

import styles from './ImportStaff.module.scss'

export const MAX_ROWS = 500
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
  | { name: 'upload' }
  | { name: 'reading'; rows: number }
  | { name: 'error'; reason: string }
  | { name: 'preview'; rows: ImportStaffRow[]; results: ImportRowResult[] }
  | { name: 'done'; rows: ImportStaffRow[]; result: ImportCommitResult }

const STEP_LABEL: Record<Step['name'], string> = {
  upload: 'Step 1 of 3 · Upload your file',
  reading: 'Step 1 of 3 · Upload your file',
  error: 'Step 1 of 3 · Upload your file',
  preview: 'Step 2 of 3 · Check the rows before you import',
  done: 'Step 3 of 3 · Done',
}

type PreviewRow = { result: ImportRowResult; row: ImportStaffRow }

export const ImportStaff = () => {
  const navigate = useNavigate()
  const { organizationId } = usePeopleAccess()
  const { checkImport, importStaff, isSaving } = useStaffActions(organizationId)
  const [step, setStep] = useState<Step>({ name: 'upload' })

  const handleFile = async ([file]: File[]) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStep({ name: 'error', reason: 'It must be a CSV file.' })
      return
    }
    const { rows, missingColumns } = toImportRows(parseCsv(await file.text()))
    if (missingColumns.length > 0 || rows.length === 0) {
      setStep({
        name: 'error',
        reason:
          rows.length === 0 && missingColumns.length === 0
            ? 'The file has no staff rows.'
            : 'It must be a CSV file with the columns from our sample file.',
      })
      return
    }
    if (rows.length > MAX_ROWS) {
      setStep({
        name: 'error',
        reason: `The file has ${rows.length} rows. Split it into files of ${MAX_ROWS} rows or fewer.`,
      })
      return
    }
    setStep({ name: 'reading', rows: rows.length })
    const results = await checkImport(rows)
    setStep(results ? { name: 'preview', rows, results } : { name: 'upload' })
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

  const uploadBox = (
    <Dropzone
      files={[]}
      onAdd={handleFile}
      onRemove={() => undefined}
      accept=".csv,text/csv"
      maxFiles={1}
      label="Drop your CSV file here"
      hint={`CSV only, up to ${MAX_ROWS} rows`}
    />
  )

  const previewColumns: ColumnDef<PreviewRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: ({ result }) => (
        <span className={styles.person}>
          <strong>{result.fullName}</strong>
          <span className={styles.muted}>{result.email}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: ({ result }) =>
        result.error ? (
          <StatusBadge
            status={result.error}
            backgroundColor="var(--color-danger-tint)"
            color="var(--color-danger)"
            showDot
          />
        ) : (
          <StatusBadge
            status="Ready"
            backgroundColor="var(--color-positive-tint)"
            color="var(--color-positive)"
            showDot
          />
        ),
    },
    {
      key: 'jobTitle',
      header: 'Job title',
      hideBelow: 640,
      render: ({ row }) => row.jobTitle,
    },
    {
      key: 'manager',
      header: 'Manager email',
      hideBelow: 768,
      render: ({ row }) => row.managerEmail || '—',
    },
  ]

  const readyCount =
    step.name === 'preview'
      ? step.results.filter((result) => !result.error).length
      : 0

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People · Employees · Import from file"
        title="Import staff"
        lead={STEP_LABEL[step.name]}
      />

      {step.name === 'upload' && (
        <PagePanel title="Add staff from a file">
          <div className={styles.stack}>
            <p className={styles.muted}>
              Use our sample file so the columns match: name, email, job title,
              manager email.
            </p>
            <div>
              <Button variant="outline" onClick={downloadSample}>
                Download sample file
              </Button>
            </div>
            {uploadBox}
          </div>
        </PagePanel>
      )}

      {step.name === 'reading' && (
        <PagePanel title="Reading your file…">
          <div className={styles.stack}>
            <p className={styles.muted}>
              {step.rows} rows so far. This takes a few seconds.
            </p>
            <Spinner />
          </div>
        </PagePanel>
      )}

      {step.name === 'error' && (
        <PagePanel title="We could not read this file">
          <div className={styles.stack}>
            <p className={styles.muted}>{step.reason} Nothing was imported.</p>
            <div>
              <Pill tone="danger" size="sm">
                Error
              </Pill>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={downloadSample}>
                Download sample file
              </Button>
              <Button
                variant="ink"
                pill
                onClick={() => setStep({ name: 'upload' })}>
                Choose another file
              </Button>
            </div>
          </div>
        </PagePanel>
      )}

      {step.name === 'preview' && (
        <>
          <PagePanel>
            <div className={styles.summary}>
              <strong>
                {readyCount} rows ready, {step.results.length - readyCount} with
                problems.
              </strong>
              <Button
                variant="ink"
                pill
                loading={isSaving}
                disabled={readyCount === 0}
                onClick={() => void handleImport(step.rows)}>
                Import {readyCount} staff
              </Button>
            </div>
          </PagePanel>
          <PagePanel title="Rows in your file" hint="Red rows will be skipped">
            <DataTable
              columns={previewColumns}
              data={step.results.map((result) => ({
                result,
                row: step.rows[result.row - 1]!,
              }))}
              pageSize={25}
              getRowKey={({ result }) => result.row}
              getRowClassName={({ result }) =>
                result.error ? styles.problem! : ''
              }
              ariaLabel="Rows in your file"
              showRowNumber={false}
            />
          </PagePanel>
        </>
      )}

      {step.name === 'done' && (
        <PagePanel>
          <div className={styles.stack}>
            <div>
              <Pill tone="success" size="sm">
                Imported
              </Pill>
            </div>
            <h2 className={styles.done}>
              {step.result.added} staff added. {step.result.skipped.length} rows
              skipped.
            </h2>
            {step.result.skipped.length > 0 && (
              <p className={styles.muted}>
                The {step.result.skipped.length} skipped rows had problems.
                Download them, fix them and import again.
              </p>
            )}
            <div className={styles.actions}>
              {step.result.skipped.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadSkipped(step.rows, step.result.skipped)
                  }>
                  Download skipped rows
                </Button>
              )}
              <Button
                variant="ink"
                pill
                onClick={() => navigate(peoplePaths.employees)}>
                Go to Employees
              </Button>
            </div>
          </div>
        </PagePanel>
      )}
    </PageShell>
  )
}
