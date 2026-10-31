import { FieldArray, Form } from 'formik'
import React, { useState } from 'react'
import { HiOutlineSparkles, HiOutlineTrash } from 'react-icons/hi2'
import * as Yup from 'yup'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Dropzone } from '@/components/ui/Dropzone/Dropzone'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCompanyProfile } from '@/features/people/hooks/useStaffData'
import { CompanyProfile as Profile } from '@/features/people/types'
import { notify } from '@/utils/toastNotifications'

import styles from './CompanyProfile.module.scss'
import payStyles from './PayTab.module.scss'

const MAX_FILE_BYTES = 25 * 1024 * 1024
const DOCUMENT_EXTENSIONS = ['.pdf', '.docx']

interface ProfileFormValues {
  mission: string
  vision: string
  yearlyGoals: string[]
}

const profileSchema = Yup.object({
  mission: Yup.string().trim().max(2000, 'Keep it under 2000 characters'),
  vision: Yup.string().trim().max(2000, 'Keep it under 2000 characters'),
  yearlyGoals: Yup.array()
    .max(10, 'Add at most 10 goals')
    .of(
      Yup.string()
        .trim()
        .required('Write the goal or remove it')
        .max(500, 'Keep each goal under 500 characters'),
    ),
})

const toValues = (profile: Profile): ProfileFormValues => ({
  mission: profile.mission ?? '',
  vision: profile.vision ?? '',
  yearlyGoals: profile.yearlyGoals,
})

const isEmpty = (profile: Profile) =>
  !profile.mission && !profile.vision && profile.yearlyGoals.length === 0

const AiNote = () => (
  <span className={styles.aiNote}>
    <HiOutlineSparkles aria-hidden /> Filled by AI, please check
  </span>
)

export const CompanyProfile = () => {
  const { organizationId } = usePeopleAccess()
  const { profile, isLoading, hasError } = useCompanyProfile(organizationId)
  const { saveProfile, fillProfileFromFile } = useStaffActions(organizationId)
  const [draft, setDraft] = useState<Profile | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const readDocument = async ([file]: File[]) => {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!DOCUMENT_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      notify('error', 'Upload a PDF or Word (.docx) file')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      notify('error', 'The file must be 25 MB or smaller')
      return
    }
    setIsReading(true)
    const filled = await fillProfileFromFile(file)
    setIsReading(false)
    if (filled) setDraft(filled)
  }

  const handleSave = async (values: ProfileFormValues) => {
    const saved = await saveProfile({
      mission: values.mission.trim() || null,
      vision: values.vision.trim() || null,
      yearlyGoals: values.yearlyGoals.map((goal) => goal.trim()),
    })
    if (saved) {
      setDraft(null)
      setIsEditing(false)
    }
  }

  const uploadBox = (
    <Dropzone
      files={[]}
      onAdd={readDocument}
      onRemove={() => undefined}
      accept=".pdf,.docx"
      maxFiles={1}
      disabled={isReading}
      label="Drop a PDF or Word file here"
      hint="Up to 25 MB. Only the text is read; the file is not kept."
    />
  )

  const shown = draft ?? profile
  const showForm = !!shown && (!!draft || isEditing || !isEmpty(shown))

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Company profile"
        lead="Your mission, vision and goals for the year. Later features use them to write job descriptions and suggest goals."
      />

      {isLoading ? (
        <Spinner />
      ) : hasError || !shown ? (
        <EmptyState
          title="Couldn't load the company profile"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : isReading ? (
        <PagePanel>
          <div className={styles.reading}>
            <Spinner />
            <p>Reading your document…</p>
          </div>
        </PagePanel>
      ) : !showForm ? (
        <PagePanel>
          <div className={styles.empty}>
            <p>
              Upload your company profile, pitch deck or annual report and
              we&apos;ll fill this in for you.
            </p>
            {uploadBox}
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Fill it in myself
            </Button>
          </div>
        </PagePanel>
      ) : (
        <PagePanel
          title={draft ? 'Check and save' : 'Profile'}
          hint={
            draft
              ? 'Nothing is saved until you click Save.'
              : 'Upload a new document to fill these in again.'
          }>
          <ValidatedForm
            initialValues={toValues(shown)}
            enableReinitialize
            validationSchema={profileSchema}
            onSubmit={handleSave}>
            {({ values, isSubmitting, dirty }) => (
              <Form className={payStyles.fields} noValidate>
                <FormikFocusOnError />
                <div className={styles.field}>
                  <TextField
                    name="mission"
                    label="Mission"
                    placeholder="What you do and for whom"
                  />
                  {draft && <AiNote />}
                </div>
                <div className={styles.field}>
                  <TextField
                    name="vision"
                    label="Vision"
                    placeholder="Where you want to be in the long run"
                  />
                  {draft && <AiNote />}
                </div>
                <FieldArray name="yearlyGoals">
                  {({ push, remove }) => (
                    <fieldset className={styles.goals}>
                      <legend>Goals for this year {draft && <AiNote />}</legend>
                      {values.yearlyGoals.map((_, index) => (
                        <div key={index} className={styles.goal}>
                          <TextField
                            name={`yearlyGoals.${index}`}
                            label={`Goal ${index + 1}`}
                          />
                          <button
                            type="button"
                            className={styles.remove}
                            aria-label={`Remove goal ${index + 1}`}
                            onClick={() => remove(index)}>
                            <HiOutlineTrash />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={values.yearlyGoals.length >= 10}
                        onClick={() => push('')}>
                        Add goal
                      </Button>
                    </fieldset>
                  )}
                </FieldArray>
                <div className={payStyles.actions}>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!draft && !dirty}>
                    Save
                  </Button>
                  {(draft || isEditing) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDraft(null)
                        setIsEditing(false)
                      }}>
                      Cancel
                    </Button>
                  )}
                </div>
                {!draft && uploadBox}
              </Form>
            )}
          </ValidatedForm>
        </PagePanel>
      )}
    </PageShell>
  )
}
