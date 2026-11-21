import { FieldArray, Form, getIn } from 'formik'
import React from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { Select } from '@/components/forms/Select'
import { TextInput } from '@/components/forms/TextInput'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PublicShell } from '@/components/layout/PublicShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApplicationPipelineQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './RefereesPage.module.scss'
import {
  canNameAnotherReferee,
  EMPTY_REFEREE,
  MAX_REFEREES,
  REFEREE_RELATIONSHIPS,
  RefereeFormValues,
  refereesSchema,
  REFERENCE_STATUS_LABEL,
  relationshipLabel,
} from './referenceRules'
import { addReferees, listReferees } from './referencesService'

const STATUS_COLOURS = {
  answered: {
    backgroundColor: 'var(--color-positive-tint)',
    color: 'var(--color-positive)',
  },
  sent: {
    backgroundColor: 'var(--color-caution-tint)',
    color: 'var(--color-caution-text)',
  },
  not_sent: {
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
  expired: {
    backgroundColor: 'var(--color-bg-subtle)',
    color: 'var(--color-text-muted)',
  },
} as const

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const RefereesPage = () => {
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const { data: pipeline } = useApplicationPipelineQuery(applicationId)
  const { data, isLoading, error, mutate } = useSWR(
    `/references/applications/${applicationId}`,
    () => listReferees(applicationId),
    { revalidateOnFocus: false },
  )

  const job = pipeline?.application.job
  const shell = {
    companyName: job?.organization?.name,
    title: job ? `Application · ${job.title}` : 'Application',
  }

  if (isLoading) return <Spinner fullPage />
  if (error || !data) {
    return (
      <PublicShell {...shell}>
        <EmptyState
          title="We could not load your referees"
          description="Check your connection and try again."
          action={<Button onClick={() => void mutate()}>Try again</Button>}
        />
      </PublicShell>
    )
  }

  const existing = data.references
  const slots = MAX_REFEREES - existing.length
  const firstSentAt = existing.find((referee) => referee.sentAt)?.sentAt

  const handleSubmit = async (rows: RefereeFormValues[], reset: () => void) => {
    try {
      const result = await addReferees(applicationId, rows)
      await mutate(result, { revalidate: false })
      reset()
      notify('success', 'We emailed your referees')
    } catch (submitError) {
      notify(
        'error',
        getErrorMessage(
          submitError,
          "We couldn't send the requests. Try again.",
        ),
        { autoClose: 4000 },
      )
    }
  }

  return (
    <PublicShell {...shell}>
      <h1 className={styles.title}>Add your referees</h1>
      <p className={styles.lead}>
        Add up to {MAX_REFEREES} people who can speak about your work. We email
        them once you click Send requests.
      </p>

      {existing.map((referee, index) => (
        <section key={referee.id} className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Referee {index + 1}</h2>
            <StatusBadge
              status={REFERENCE_STATUS_LABEL[referee.status]}
              showDot
              {...STATUS_COLOURS[referee.status]}
            />
          </header>
          <dl className={styles.readOnly}>
            <div>
              <dt>Name</dt>
              <dd>{referee.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{referee.email}</dd>
            </div>
            <div>
              <dt>Relationship</dt>
              <dd>{relationshipLabel(referee.relationship)}</dd>
            </div>
          </dl>
        </section>
      ))}

      {slots > 0 && (
        <ValidatedForm
          initialValues={{
            referees: existing.length === 0 ? [{ ...EMPTY_REFEREE }] : [],
          }}
          validationSchema={refereesSchema(slots)}
          validateOnMount={false}
          onSubmit={(values, { resetForm }) =>
            handleSubmit(values.referees, () =>
              resetForm({ values: { referees: [] } }),
            )
          }>
          {({ values, handleChange, setFieldValue, isSubmitting, errors }) => (
            <Form className={styles.form} noValidate>
              <FormikFocusOnError />
              <FieldArray name="referees">
                {({ push, remove }) => (
                  <>
                    {values.referees.map((row, index) => (
                      <section key={index} className={styles.card}>
                        <header className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>
                            Referee {existing.length + index + 1}
                          </h2>
                          {existing.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}>
                              Remove
                            </Button>
                          )}
                        </header>
                        <div className={styles.fields}>
                          <TextInput
                            title="Name"
                            name={`referees.${index}.name`}
                            label="Name"
                            maxLength={120}
                            value={row.name}
                            onChange={handleChange}
                          />
                          <TextInput
                            title="Email"
                            name={`referees.${index}.email`}
                            label="Email"
                            type="email"
                            autoComplete="off"
                            value={row.email}
                            onChange={handleChange}
                          />
                          <Select
                            label="Relationship"
                            name={`referees.${index}.relationship`}
                            placeholder="Choose one"
                            options={REFEREE_RELATIONSHIPS}
                            value={row.relationship}
                            error={
                              getIn(
                                errors,
                                `referees.${index}.relationship`,
                              ) as string | undefined
                            }
                            onChange={(value) =>
                              void setFieldValue(
                                `referees.${index}.relationship`,
                                value,
                              )
                            }
                          />
                        </div>
                      </section>
                    ))}
                    {typeof errors.referees === 'string' && (
                      <p role="alert" className={styles.error}>
                        {errors.referees}
                      </p>
                    )}
                    <div className={styles.actions}>
                      {canNameAnotherReferee(
                        existing.length + values.referees.length,
                      ) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => push({ ...EMPTY_REFEREE })}>
                          Add another referee
                        </Button>
                      )}
                      {values.referees.length > 0 && (
                        <Button
                          type="submit"
                          variant="ink"
                          pill
                          loading={isSubmitting}
                          className={styles.send}>
                          Send requests
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </FieldArray>
            </Form>
          )}
        </ValidatedForm>
      )}

      {firstSentAt && (
        <p className={styles.note}>
          We emailed your referees on {longDate(firstSentAt)}. We will tell you
          when they answer.
        </p>
      )}
    </PublicShell>
  )
}
