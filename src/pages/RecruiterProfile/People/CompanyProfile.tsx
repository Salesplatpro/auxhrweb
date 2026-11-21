import { Form } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { TextArea } from '@/components/forms/TextArea'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Dropzone } from '@/components/ui/Dropzone/Dropzone'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCompanyProfile } from '@/features/people/hooks/useStaffData'
import { CompanyProfile as Profile } from '@/features/people/types'
import { notify } from '@/utils/toastNotifications'

import styles from './CompanyProfile.module.scss'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_GOALS = 10
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx']

interface ProfileFormValues {
  mission: string
  vision: string
  yearlyGoals: string
}

const goalLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const profileSchema = Yup.object({
  mission: Yup.string().trim().max(2000, 'Keep it under 2000 characters'),
  vision: Yup.string().trim().max(2000, 'Keep it under 2000 characters'),
  yearlyGoals: Yup.string()
    .test(
      'goal-count',
      `Add at most ${MAX_GOALS} goals, one on each line`,
      (value) => goalLines(value ?? '').length <= MAX_GOALS,
    )
    .test('goal-length', 'Keep each goal under 500 characters', (value) =>
      goalLines(value ?? '').every((line) => line.length <= 500),
    ),
})

const toValues = (profile: Profile): ProfileFormValues => ({
  mission: profile.mission ?? '',
  vision: profile.vision ?? '',
  yearlyGoals: profile.yearlyGoals.join('\n'),
})

const isEmpty = (profile: Profile) =>
  !profile.mission && !profile.vision && profile.yearlyGoals.length === 0

const FIELD_TITLES = {
  mission: 'Mission',
  vision: 'Vision',
  yearlyGoals: 'Yearly goals',
} as const

const FIELD_PLACEHOLDERS = {
  mission: 'What you do and for whom',
  vision: 'Where you want to be in the long run',
  yearlyGoals: 'One goal on each line',
} as const

export const CompanyProfile = () => {
  const { organizationId } = usePeopleAccess()
  const { profile, isLoading, hasError } = useCompanyProfile(organizationId)
  const { saveProfile, fillProfileFromFile } = useStaffActions(organizationId)
  const [draft, setDraft] = useState<Profile | null>(null)
  const [readingFile, setReadingFile] = useState<string | null>(null)

  const readDocument = async ([file]: File[]) => {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!DOCUMENT_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      notify('error', 'Upload a PDF or Word (.docx) file')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      notify('error', 'The file must be 20 MB or smaller')
      return
    }
    setReadingFile(file.name)
    const filled = await fillProfileFromFile(file)
    setReadingFile(null)
    if (filled) setDraft(filled)
  }

  const handleSave = async (values: ProfileFormValues) => {
    const saved = await saveProfile({
      mission: values.mission.trim() || null,
      vision: values.vision.trim() || null,
      yearlyGoals: goalLines(values.yearlyGoals),
    })
    if (saved) setDraft(null)
  }

  const shown = draft ?? profile

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Company profile"
        lead={
          draft
            ? 'Check what we filled in, change anything that is wrong, then save.'
            : 'Tell AuxHR about the company. We use it when we write job descriptions and goals.'
        }
      />

      {isLoading ? (
        <Spinner />
      ) : hasError || !shown ? (
        <EmptyState
          title="We could not load the company profile"
          description="Check your connection and refresh the page to try again."
        />
      ) : readingFile ? (
        <PagePanel title="Reading your document…">
          <div className={styles.reading}>
            <Spinner />
            <p>{readingFile}. This takes about a minute.</p>
            <Pill tone="warning" size="sm">
              Reading
            </Pill>
          </div>
        </PagePanel>
      ) : (
        <>
          {!draft && isEmpty(shown) && (
            <PagePanel
              title="Upload your company profile"
              hint="Upload your company profile, pitch deck or annual report and we'll fill this in for you.">
              <Dropzone
                files={[]}
                onAdd={readDocument}
                onRemove={() => undefined}
                accept=".pdf,.docx"
                maxFiles={1}
                label="Drop a PDF or Word file here"
                hint="PDF or Word, up to 20 MB"
              />
              <p className={styles.or}>Or fill the form yourself below.</p>
            </PagePanel>
          )}
          <ValidatedForm
            initialValues={toValues(shown)}
            enableReinitialize
            validationSchema={profileSchema}
            onSubmit={handleSave}>
            {({ values, handleChange, isSubmitting, dirty }) => (
              <Form className={styles.form} noValidate>
                <FormikFocusOnError />
                {(Object.keys(FIELD_TITLES) as (keyof ProfileFormValues)[]).map(
                  (field) => (
                    <PagePanel
                      key={field}
                      title={FIELD_TITLES[field]}
                      action={
                        draft ? (
                          <Pill tone="warning" size="sm">
                            Filled by AI, please check
                          </Pill>
                        ) : undefined
                      }>
                      <TextArea
                        title={FIELD_TITLES[field]}
                        name={field}
                        value={values[field]}
                        rows={field === 'yearlyGoals' ? 5 : 3}
                        placeholder={FIELD_PLACEHOLDERS[field]}
                        onChange={handleChange}
                      />
                    </PagePanel>
                  ),
                )}
                <div className={styles.actions}>
                  {draft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDraft(null)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="ink"
                    pill
                    loading={isSubmitting}
                    disabled={!draft && !dirty}>
                    Save
                  </Button>
                </div>
              </Form>
            )}
          </ValidatedForm>
          {!draft && !isEmpty(shown) && (
            <PagePanel
              title="Upload a new document"
              hint="Upload a new document to fill these in again.">
              <Dropzone
                files={[]}
                onAdd={readDocument}
                onRemove={() => undefined}
                accept=".pdf,.docx"
                maxFiles={1}
                label="Drop a PDF or Word file here"
                hint="PDF or Word, up to 20 MB"
              />
            </PagePanel>
          )}
        </>
      )}
    </PageShell>
  )
}
