import { Form } from 'formik'
import React, { useEffect, useState } from 'react'
import { HiOutlineUserGroup } from 'react-icons/hi2'
import { useSearchParams } from 'react-router-dom'

import { LocationSelect } from '@/components/forms/LocationSelect'
import { EMPTY_LOCATION } from '@/components/forms/LocationSelect/useLocationSelect'
import { RoleSelect } from '@/components/forms/Roles/RoleSelect'
import {
  EXPERIENCE_LEVEL_OPTIONS,
  WORK_MODE_OPTIONS,
} from '@/components/forms/Select/options'
import { Select } from '@/components/forms/Select/Select'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Avatar, Button, EmptyState, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/Badge'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { MatchScoreRing } from '@/components/ui/MatchScoreRing'
import { ScoutTextArea } from '@/features/scout/components/ScoutTextArea'
import { useScoutStore } from '@/features/scout/store/useScoutStore'
import type {
  TalentSearchFormValues,
  TalentSearchResult,
} from '@/features/scout/types'
import { useSearchTalentsMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { Pagination } from '../MyJobPosts/Pagination'
import { talentSearchValidationSchema } from '../Scout/validationSchema'
import { MessageCandidateModal } from './MessageCandidateModal'
import styles from './TalentSearch.module.scss'

const PAGE_SIZE = 20

const emptyValues: TalentSearchFormValues = {
  description: '',
  role: '',
  experienceLevel: '',
  workMode: '',
  location: { ...EMPTY_LOCATION },
}

const verdictFor = (score: number) =>
  score >= 75
    ? ('high' as const)
    : score >= 50
    ? ('medium' as const)
    : ('low' as const)

export const TalentSearch = () => {
  const { criteria, page, setCriteria, setSearchPage, clearSearch } =
    useScoutStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const headerQuery = (searchParams.get('q') ?? '').trim()
  const [search, { data, isLoading, isError, reset }] =
    useSearchTalentsMutation()
  const [messageTarget, setMessageTarget] = useState<TalentSearchResult | null>(
    null,
  )

  const run = React.useCallback(
    async (values: TalentSearchFormValues, offsetPage: number) => {
      try {
        await search({
          description: values.description.trim(),
          roleId: values.role || null,
          experienceLevel: values.experienceLevel || null,
          workMode: values.workMode || null,
          country: values.location?.country?.name || null,
          state: values.location?.state?.name || null,
          city: values.location?.city?.name || null,
          limit: PAGE_SIZE,
          offset: offsetPage * PAGE_SIZE,
        }).unwrap()
      } catch (err) {
        notify('error', getErrorMessage(err, 'Could not run that search'))
      }
    },
    [search],
  )

  // A search typed in the header only fills the form: every search is charged, and the
  // backend needs a longer description than a header search usually has.
  useEffect(() => {
    if (headerQuery && (criteria || data)) {
      clearSearch()
      reset()
    }
  }, [headerQuery, criteria, data, clearSearch, reset])

  // Re-runs the stored search on a page change, so paging doesn't need the form.
  useEffect(() => {
    if (criteria && !headerQuery) void run(criteria, page)
  }, [criteria, page, run, headerQuery])

  const results = data?.data?.results ?? []
  const total = data?.data?.total ?? 0

  const columns: ColumnDef<TalentSearchResult>[] = [
    {
      key: 'name',
      header: 'Candidate',
      sortAccessor: (row) => row.name,
      render: (row) => (
        <div className={styles.candidateCell}>
          <Avatar
            firstName={row.name.split(' ')[0] ?? 'C'}
            lastName={row.name.split(' ')[1] ?? ''}
            size="sm"
          />
          <div className={styles.candidateMeta}>
            <span className={styles.candidateName}>{row.name}</span>
            <span className={styles.candidateSub}>
              {row.headline ?? row.experienceLevel ?? '—'}
            </span>
          </div>
          <StatusBadge
            status={row.source === 'registered' ? 'Registered' : 'Sourced'}
            backgroundColor={
              row.source === 'registered'
                ? 'var(--color-success-tint)'
                : 'var(--color-info-tint)'
            }
            color={
              row.source === 'registered'
                ? 'var(--color-success)'
                : 'var(--color-info)'
            }
          />
        </div>
      ),
    },
    {
      key: 'matchScore',
      header: 'Match',
      align: 'center',
      hideBelow: 640,
      sortAccessor: (row) => row.matchScore,
      render: (row) => (
        <MatchScoreRing
          verdict={verdictFor(row.matchScore)}
          averageScore={row.matchScore}
        />
      ),
    },
    {
      key: 'why',
      header: 'Why they fit',
      hideBelow: 900,
      render: (row) =>
        row.strengths?.length ? (
          <ul className={styles.evidence}>
            {row.strengths.slice(0, 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <span className={styles.muted}>Ranked on CV similarity</span>
        ),
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 768,
      render: (row) => (
        <span className={styles.muted}>
          {[row.city, row.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <TableActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessageTarget(row)}>
            Message
          </Button>
        </TableActions>
      ),
    },
  ]

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="Talent search"
        title="Describe who you're looking for"
        lead="The AI reads your description like a hiring manager would, then finds the closest matches across everyone on SalesPlat."
      />

      <ValidatedForm<TalentSearchFormValues>
        initialValues={
          headerQuery
            ? { ...emptyValues, description: headerQuery }
            : criteria ?? emptyValues
        }
        validationSchema={talentSearchValidationSchema}
        enableReinitialize
        onSubmit={(values) => {
          // Stored so paging and a return visit can replay it without the form.
          reset()
          if (headerQuery) setSearchParams({}, { replace: true })
          setCriteria(values)
        }}>
        {({ values, setFieldValue, errors, touched }) => (
          <Form noValidate className={styles.form}>
            <ScoutTextArea
              name="description"
              label="Who are you looking for?"
              hint="Describe the person in plain English — the work they've done, the tools they use, the kind of company they've worked at."
              placeholder="An enterprise account executive who has sold payments software to Nigerian banks and closed six-figure deals..."
              maxLength={2000}
              rows={5}
            />

            <div className={styles.filters}>
              <div className={styles.filterField}>
                <RoleSelect
                  name="role"
                  label="Role you're hiring for"
                  value={values.role}
                  creatable={false}
                  onChange={(value) => setFieldValue('role', value)}
                  error={touched.role ? errors.role : undefined}
                />
                <p className={styles.fieldHint}>
                  Optional. Helps the AI understand the job you&apos;re matching
                  against.
                </p>
              </div>

              <div className={styles.filterField}>
                <Select
                  name="experienceLevel"
                  label="Seniority"
                  options={EXPERIENCE_LEVEL_OPTIONS}
                  value={values.experienceLevel}
                  onChange={(value) => setFieldValue('experienceLevel', value)}
                  placeholder="Any"
                />
                <p className={styles.fieldHint}>
                  Optional. Narrows results to people at this level.
                </p>
              </div>

              <div className={styles.filterField}>
                <Select
                  name="workMode"
                  label="Work setup"
                  options={WORK_MODE_OPTIONS}
                  value={values.workMode}
                  onChange={(value) => setFieldValue('workMode', value)}
                  placeholder="Any"
                />
                <p className={styles.fieldHint}>
                  Optional. Remote, hybrid or on-site.
                </p>
              </div>
            </div>

            <LocationSelect
              value={values.location}
              onChange={(value) => setFieldValue('location', value)}
              countryLabel="Country"
              stateLabel="State"
              cityLabel="City"
            />

            <div className={styles.formActions}>
              <Button type="submit" loading={isLoading}>
                Find candidates
              </Button>
            </div>
          </Form>
        )}
      </ValidatedForm>

      {isLoading && <Spinner fullPage />}

      {isError && (
        <EmptyState
          title="That search didn't work"
          description="Something went wrong on our side. Try running it again."
        />
      )}

      {!isLoading && !isError && criteria && results.length === 0 && (
        <EmptyState
          icon={<HiOutlineUserGroup />}
          title="No one matched that description"
          description="Try describing the role more broadly, or remove a filter."
        />
      )}

      {!isLoading && results.length > 0 && (
        <>
          <p className={styles.resultsCount}>
            {total === 1 ? '1 candidate found' : `${total} candidates found`}
          </p>
          <DataTable
            columns={columns}
            data={results}
            getRowKey={(row) => `${row.source}-${row.id}`}
            ariaLabel="Talent search results"
            showRowNumber={false}
          />
          {total > PAGE_SIZE && (
            <Pagination
              totalItems={total}
              itemsPerPage={PAGE_SIZE}
              currentPage={page + 1}
              onPageChange={(next) => setSearchPage(next - 1)}
            />
          )}
        </>
      )}

      <MessageCandidateModal
        target={messageTarget}
        onClose={() => setMessageTarget(null)}
      />
    </PageShell>
  )
}
