import { Form, FormikHelpers, useFormikContext } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
import { HiArrowLeft, HiArrowRight } from 'react-icons/hi2'
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
import { formatTimeAgo } from '@/utils'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { PostJobFormValues } from '@/utils/jobPostTypes'
import { notify } from '@/utils/toastNotifications'

import { JobDetailsFields } from './JobDetailsFields'
import { JobPreview } from './JobPreview/JobPreview'
import styles from './PostJob.module.scss'
import {
  EMPTY_JOB_FORM,
  jobFormToPayload,
  jobToFormValues,
} from './utils/jobFormValues'
import { useRoleName } from './utils/useRoleName'
import { validationSchema } from './validationSchema'

const BASE_PATH = '/recruiterDashboard/postjob'
const JOB_POSTS_PATH = '/recruiterDashboard/myJobPosts'

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
}

const PostJob: React.FC<PostJobProps> = ({ jobId }) => {
  const navigate = useNavigate()
  const isUpdate = !!jobId
  const [jobPostCreation] = useJobPostCreationMutation()
  const [updateJob] = useUpdateJobMutation()
  const { draft, savedAt, saveDraft, clearDraft } = useJobDraftStore()
  const saveAsDraft = useRef(false)
  const { data: jobData, isLoading: jobLoading } = useIndividualJobQuery(
    jobId,
    { skip: !isUpdate },
  )

  // Read the draft once at mount: re-deriving it from the store would reset
  // the form (and re-save it) every time the draft is cleared or saved.
  const [initialDraft] = useState(() => (isUpdate ? null : draft))

  if (isUpdate && jobLoading) return <Spinner fullPage />

  const job = jobData?.data?.job ?? jobData?.data
  const initialValues: PostJobFormValues = isUpdate
    ? job
      ? jobToFormValues(job)
      : EMPTY_JOB_FORM
    : { ...EMPTY_JOB_FORM, ...(initialDraft ?? {}) }
  const lastSaved = isUpdate ? job?.updatedAt : savedAt && new Date(savedAt)

  const onSubmit = async (
    values: PostJobFormValues,
    { setSubmitting }: FormikHelpers<PostJobFormValues>,
  ) => {
    const payload = jobFormToPayload(values)

    try {
      let savedJobId = jobId
      if (isUpdate) {
        await updateJob({ jobId, data: payload }).unwrap()
      } else {
        const response = await jobPostCreation(payload).unwrap()
        savedJobId = response?.data?.job?.id
        if (!savedJobId) {
          notify(
            'error',
            'Job was saved but no ID came back. Find it in Job Posts to finish it.',
          )
          return
        }
        clearDraft()
      }

      if (saveAsDraft.current) {
        notify('success', 'Saved as a draft. Finish it from Job Posts anytime.')
        navigate(JOB_POSTS_PATH)
        return
      }
      navigate(`${BASE_PATH}/${savedJobId}`)
    } catch (err) {
      notify(
        'error',
        getErrorMessage(
          err,
          isUpdate
            ? 'Failed to save job details. Please try again.'
            : 'Failed to save the job. Your progress is kept — please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ValidatedForm
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize>
      {({
        values,
        setFieldValue,
        errors,
        touched,
        isSubmitting,
        submitForm,
      }) => (
        <Form noValidate>
          <FormikFocusOnError />
          {!isUpdate && <FormObserver saveDraft={saveDraft} />}

          <div className={styles.layout}>
            <div className={styles.formCard}>
              <JobDetailsFields
                values={values}
                errors={errors}
                touched={touched}
                setFieldValue={(key, value) => setFieldValue(key, value)}
                roleDisabled={isUpdate}
                jobId={jobId}
              />
            </div>
            <aside className={styles.sideColumn}>
              <LivePreview />
              {lastSaved && (
                <section className={styles.savedCard}>
                  <p className={styles.savedTitle}>Draft saved</p>
                  <p className={styles.savedText}>
                    Saved {formatTimeAgo(lastSaved)}. You can leave and finish
                    later.
                  </p>
                </section>
              )}
            </aside>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              size="lg"
              icon={<HiArrowLeft size={16} />}
              onClick={() => navigate(JOB_POSTS_PATH)}>
              Back
            </Button>
            <div className={styles.actionsEnd}>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={isSubmitting}
                onClick={() => {
                  saveAsDraft.current = true
                  void submitForm()
                }}>
                Save as draft
              </Button>
              <Button
                type="submit"
                variant="ink"
                size="lg"
                loading={isSubmitting && !saveAsDraft.current}
                iconEnd={<HiArrowRight size={16} />}
                onClick={() => {
                  saveAsDraft.current = false
                }}>
                Continue to AI Configuration
              </Button>
            </div>
          </div>
        </Form>
      )}
    </ValidatedForm>
  )
}

export default PostJob
