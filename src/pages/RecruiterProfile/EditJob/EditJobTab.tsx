import { Form, FormikHelpers, useFormikContext } from 'formik'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useJobEditDraftStore } from '@/features/jobs/store/useJobEditDraftStore'
import {
  useAiConfigMutation,
  useGetAiConfigQuery,
  usePatchAiConfigMutation,
  useUpdateJobMutation,
} from '@/redux/api/recruiter'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { PostJobFormValues } from '@/utils/jobPostTypes'
import { notify } from '@/utils/toastNotifications'

import { AiConfigFields } from '../PostJobs/AiConfig/AiConfigFields'
import {
  AI_CONFIG_DEFAULT_VALUES,
  AiConfigFieldValues,
} from '../PostJobs/AiConfig/aiConfigModel'
import {
  aiConfigFromApi,
  aiConfigToPayload,
} from '../PostJobs/AiConfig/aiConfigPayload'
import { JobDetailsFields } from '../PostJobs/JobDetailsFields'
import postJobStyles from '../PostJobs/PostJob.module.scss'
import tabStyles from '../PostJobs/PostJobTab.module.scss'
import { htmlToPlainText } from '../PostJobs/utils/aiText'
import {
  jobFormToPayload,
  jobToFormValues,
} from '../PostJobs/utils/jobFormValues'
import { editJobValidationSchema } from './editJobValidationSchema'
import { JobStatusControl } from './JobStatusControl'

type EditJobFormValues = PostJobFormValues & {
  status: string
  aiConfig: AiConfigFieldValues
}

const FormObserver: React.FC<{ saveDraft: (v: EditJobFormValues) => void }> = ({
  saveDraft,
}) => {
  const { values } = useFormikContext<EditJobFormValues>()
  useEffect(() => {
    saveDraft(values)
  }, [values, saveDraft])
  return null
}

export const EditJobTab = () => {
  const { jobId } = useParams()
  const { data, error, isLoading } = useIndividualJobQuery(jobId)
  const [updateJob] = useUpdateJobMutation()
  const [patchAiConfig] = usePatchAiConfigMutation()
  const [createAiConfig] = useAiConfigMutation()
  const { drafts, saveDraft, clearDraft } = useJobEditDraftStore()

  const job = data?.data?.job ?? data?.data
  const nestedAiConfig = job?.aiConfig ?? null
  const aiConfigId: string = nestedAiConfig?.id ?? job?.aiConfigId ?? ''

  const { data: aiConfigResp, isLoading: aiConfigLoading } =
    useGetAiConfigQuery(aiConfigId, { skip: !aiConfigId })

  const draftSaver = useCallback(
    (v: EditJobFormValues) => saveDraft(jobId ?? '', v),
    [saveDraft, jobId],
  )

  useEffect(() => {
    if (error) {
      notify('error', 'Error loading job post')
    }
  }, [error])

  const fetchedAiConfig = aiConfigResp?.data?.aiConfig ?? nestedAiConfig ?? null

  const aiConfigInitialValues = useMemo<AiConfigFieldValues>(
    () =>
      fetchedAiConfig
        ? aiConfigFromApi(fetchedAiConfig)
        : AI_CONFIG_DEFAULT_VALUES,
    [fetchedAiConfig],
  )

  if (isLoading || (aiConfigId && aiConfigLoading)) {
    return <Spinner fullPage />
  }

  if (!job) {
    return null
  }

  const jobInitialValues: PostJobFormValues = jobToFormValues(job)

  const savedDraft = drafts[jobId ?? ''] as EditJobFormValues | undefined

  // Prefer the live attached AI config over any stale local draft so Edit Job
  // always shows the configuration currently linked to this job. Job detail
  // fields may still come from the draft.
  const initialValues: EditJobFormValues = {
    jobBrief: savedDraft?.jobBrief ?? jobInitialValues.jobBrief,
    role: jobInitialValues.role,
    requirements: savedDraft?.requirements ?? jobInitialValues.requirements,
    minSalary: savedDraft?.minSalary ?? jobInitialValues.minSalary,
    maxSalary: savedDraft?.maxSalary ?? jobInitialValues.maxSalary,
    compensationPeriod:
      savedDraft?.compensationPeriod ?? jobInitialValues.compensationPeriod,
    currency: savedDraft?.currency ?? jobInitialValues.currency,
    workMode: savedDraft?.workMode ?? jobInitialValues.workMode,
    experienceLevel:
      savedDraft?.experienceLevel ?? jobInitialValues.experienceLevel,
    location: savedDraft?.location ?? jobInitialValues.location,
    skills: savedDraft?.skills ?? jobInitialValues.skills,
    goals: savedDraft?.goals ?? jobInitialValues.goals,
    status: savedDraft?.status ?? job.status ?? 'draft',
    aiConfig: aiConfigInitialValues,
  }

  const onSubmit = async (
    values: EditJobFormValues,
    { setSubmitting }: FormikHelpers<EditJobFormValues>,
  ) => {
    // Status changes go through JobStatusControl, not this submit.
    const { aiConfig: aiConfigValues, status, ...jobValues } = values
    void status
    const jobPayload = jobFormToPayload(jobValues)

    const aiConfigPayload = aiConfigToPayload(aiConfigValues)

    const [jobResult, aiConfigResult] = await Promise.allSettled([
      updateJob({ jobId, data: jobPayload }).unwrap(),
      aiConfigId
        ? patchAiConfig({ aiConfigId, data: aiConfigPayload }).unwrap()
        : createAiConfig({ ...aiConfigPayload, jobId }).unwrap(),
    ])

    if (jobResult.status === 'rejected') {
      notify(
        'error',
        getErrorMessage(jobResult.reason, 'Failed to update job details'),
      )
    }
    if (aiConfigResult.status === 'rejected') {
      notify(
        'error',
        getErrorMessage(aiConfigResult.reason, 'Failed to update AI config'),
      )
    }
    if (
      jobResult.status === 'fulfilled' &&
      aiConfigResult.status === 'fulfilled'
    ) {
      clearDraft(jobId ?? '')
      notify('success', 'Job updated successfully')
    }

    setSubmitting(false)
  }

  return (
    <PageShell>
      <BackButton />
      <PageHero
        compact
        title={`Edit ${capitalizeEachWord(job.role?.name)} Job`}
        lead="Modify your existing job post"
      />

      <JobStatusControl
        jobId={jobId ?? ''}
        status={job.status ?? 'draft'}
        aiConfigId={aiConfigId}
      />

      <ValidatedForm
        initialValues={initialValues}
        validationSchema={editJobValidationSchema}
        onSubmit={onSubmit}
        enableReinitialize>
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form noValidate>
            <FormikFocusOnError />
            <FormObserver saveDraft={draftSaver} />

            <JobDetailsFields
              values={values}
              errors={errors}
              touched={touched}
              setFieldValue={(key, value) => setFieldValue(key, value)}
              roleDisabled
              jobId={jobId}
            />

            <h2 className={tabStyles.heading}>Screening</h2>

            <AiConfigFields
              values={values.aiConfig}
              errors={errors.aiConfig ?? {}}
              fieldName={(key) => `aiConfig.${key}`}
              setFieldValue={(key, value) =>
                setFieldValue(`aiConfig.${key}`, value)
              }
              jobId={jobId}
              jobContext={{
                role: job.role?.name ?? '',
                experienceLevel: values.experienceLevel,
                jobBrief: htmlToPlainText(values.jobBrief ?? ''),
                requirements: htmlToPlainText(values.requirements ?? ''),
                skills: values.skills,
                goals: values.goals,
              }}
            />

            <div className={postJobStyles.actions}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </Form>
        )}
      </ValidatedForm>
    </PageShell>
  )
}
