import { Form, FormikHelpers, useFormikContext } from 'formik'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useJobDraftStore } from '@/features/jobs/store/useJobDraftStore'
import { useProfile } from '@/features/profile/hooks/useProfile'
import {
  useJobPostCreationMutation,
  useUpdateJobMutation,
} from '@/redux/api/recruiter'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { PostJobFormValues } from '@/utils/jobPostTypes'
import { notify } from '@/utils/toastNotifications'

import { JobDetailsFields } from './JobDetailsFields'
import { JobPreview } from './JobPreview/JobPreview'
import styles from './PostJob.module.scss'
import { EMPTY_JOB_FORM } from './utils/generatedJobToForm'
import { jobFormToPayload, jobToFormValues } from './utils/jobFormValues'
import { useRoleName } from './utils/useRoleName'
import { validationSchema } from './validationSchema'

const BASE_PATH = '/recruiterDashboard/postjob'

// Syncs Formik values into the draft store on every change.
const FormObserver: React.FC<{ saveDraft: (v: PostJobFormValues) => void }> = ({
  saveDraft,
}) => {
  const { values } = useFormikContext<PostJobFormValues>()
  useEffect(() => {
    saveDraft(values)
  }, [values, saveDraft])
  return null
}

const LivePreview = () => {
  const { values } = useFormikContext<PostJobFormValues>()
  const { profile } = useProfile()
  const roleName = useRoleName(values.role)
  return (
    <JobPreview
      values={values}
      roleName={roleName}
      companyName={profile?.activeOrganization?.name}
    />
  )
}

type PostJobProps = {
  /** Set when editing the details of a job already saved as a draft. */
  jobId?: string
  /** Number of fields the AI filled in on the Start step, if it was used. */
  aiFilledCount?: number | null
  onBackToStart?: () => void
}

const PostJob: React.FC<PostJobProps> = ({
  jobId,
  aiFilledCount,
  onBackToStart,
}) => {
  const navigate = useNavigate()
  const isUpdate = !!jobId
  const [jobPostCreation] = useJobPostCreationMutation()
  const [updateJob] = useUpdateJobMutation()
  const { draft, saveDraft, clearDraft } = useJobDraftStore()
  const { data: jobData, isLoading: jobLoading } = useIndividualJobQuery(
    jobId,
    { skip: !isUpdate },
  )

  // Read the draft once at mount: re-deriving it from the store would reset
  // the form (and re-save it) every time the draft is cleared or saved.
  const [initialDraft] = useState(() => (isUpdate ? null : draft))
  const hadDraft = initialDraft != null

  if (isUpdate && jobLoading) return <Spinner fullPage />

  const job = jobData?.data?.job ?? jobData?.data
  const initialValues: PostJobFormValues = isUpdate
    ? job
      ? jobToFormValues(job)
      : EMPTY_JOB_FORM
    : { ...EMPTY_JOB_FORM, ...(initialDraft ?? {}) }

  const onSubmit = async (
    values: PostJobFormValues,
    { setSubmitting }: FormikHelpers<PostJobFormValues>,
  ) => {
    const payload = jobFormToPayload(values)

    try {
      if (isUpdate) {
        await updateJob({ jobId, data: payload }).unwrap()
        notify('success', 'Job details saved.')
        navigate(`${BASE_PATH}/${jobId}`)
        return
      }

      const response = await jobPostCreation(payload).unwrap()
      const newJobId: string = response?.data?.job?.id

      if (!newJobId) {
        notify(
          'error',
          'Job was created but no ID was returned. Please check Job Posts and add an AI Config from there.',
        )
        return
      }

      clearDraft()
      notify(
        'success',
        'Job saved as a draft. Now choose how to screen applicants.',
      )
      navigate(`${BASE_PATH}/${newJobId}`)
    } catch (err) {
      notify(
        'error',
        getErrorMessage(
          err,
          isUpdate
            ? 'Failed to save job details. Please try again.'
            : 'Failed to post job. Your progress has been saved — please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h2 className={styles.pageHeading}>Tell candidates about the role</h2>
          <p className={styles.pageSubheading}>
            A clear brief and requirements help the right people apply — and
            give AI better material to screen them.
          </p>
        </div>
        {onBackToStart && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToStart}>
            Back to start options
          </Button>
        )}
      </div>

      {aiFilledCount != null ? (
        <div className={styles.draftNotice} role="status">
          AI filled in {aiFilledCount} field{aiFilledCount === 1 ? '' : 's'}.
          Check each one before you continue — you can change anything.
        </div>
      ) : (
        hadDraft && (
          <div className={styles.draftNotice}>
            Restored your unsaved draft from last time.
          </div>
        )
      )}

      <ValidatedForm
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize>
        {({ values, setFieldValue, errors, touched, isSubmitting }) => (
          <Form noValidate>
            <FormikFocusOnError />
            {!isUpdate && <FormObserver saveDraft={saveDraft} />}

            <div className={styles.layout}>
              <div className={styles.formColumn}>
                <JobDetailsFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  setFieldValue={(key, value) => setFieldValue(key, value)}
                  roleDisabled={isUpdate}
                />
              </div>
              <LivePreview />
            </div>

            <div className={styles.actions}>
              {!isUpdate && (
                <p className={styles.autosaveHint}>
                  Your progress is saved automatically as you go.
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}>
                {isUpdate ? 'Save and continue' : 'Continue to screening'}
              </Button>
            </div>
          </Form>
        )}
      </ValidatedForm>
    </div>
  )
}

export default PostJob
