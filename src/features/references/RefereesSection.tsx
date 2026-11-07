import { Form } from 'formik'
import React, { useState } from 'react'
import useSWR from 'swr'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { TextInput } from '@/components/forms/TextInput'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './RefereesSection.module.scss'
import {
  canNameAnotherReferee,
  EMPTY_REFEREE,
  MAX_REFEREES,
  RefereeFormValues,
  refereeSchema,
  REFERENCE_STATUS_LABEL,
} from './referenceRules'
import { addReferee, listReferees } from './referencesService'

const keyFor = (applicationId: string) =>
  `/references/applications/${applicationId}`

export const RefereesSection = ({
  applicationId,
}: {
  applicationId: string
}) => {
  const { data, isLoading, error, mutate } = useSWR(
    keyFor(applicationId),
    () => listReferees(applicationId),
    { revalidateOnFocus: false },
  )
  const [isAdding, setIsAdding] = useState(false)
  const referees = data?.references ?? []
  const canAdd = canNameAnotherReferee(referees.length)

  const handleSubmit = async (values: RefereeFormValues, reset: () => void) => {
    try {
      await addReferee(applicationId, values)
      await mutate()
      reset()
      setIsAdding(false)
      notify('success', `We've asked ${values.name.trim()} for a reference`)
    } catch (submitError) {
      notify(
        'error',
        getErrorMessage(
          submitError,
          "We couldn't add that referee. Try again.",
        ),
        { autoClose: 4000 },
      )
    }
  }

  return (
    <PagePanel
      title="References"
      hint={`Name up to ${MAX_REFEREES} people who can speak to your work. We email each one a link to answer six short questions.`}>
      {isLoading ? null : error ? (
        <p className={styles.empty}>Unable to load your references.</p>
      ) : referees.length === 0 ? (
        <p className={styles.empty}>No one named yet.</p>
      ) : (
        <ul className={styles.list}>
          {referees.map((referee) => (
            <li key={referee.id} className={styles.referee}>
              <div>
                <p className={styles.name}>{referee.name}</p>
                <p className={styles.meta}>
                  {referee.relationship} · {referee.email}
                </p>
              </div>
              <StatusBadge status={REFERENCE_STATUS_LABEL[referee.status]} />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !error && canAdd && !isAdding && (
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            Add a referee
          </Button>
        </div>
      )}

      {isAdding && (
        <ValidatedForm
          initialValues={EMPTY_REFEREE}
          validationSchema={refereeSchema}
          onSubmit={(values, { resetForm }) => handleSubmit(values, resetForm)}>
          {({ values, handleChange, isSubmitting }) => (
            <Form className={styles.form} noValidate>
              <FormikFocusOnError />
              <TextInput
                title="Full name"
                name="name"
                label="Full name"
                maxLength={120}
                value={values.name}
                onChange={handleChange}
              />
              <TextInput
                title="Email address"
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
              />
              <TextInput
                title="How do you know them?"
                name="relationship"
                label="How do you know them?"
                placeholder="e.g. Former manager"
                maxLength={120}
                value={values.relationship}
                onChange={handleChange}
              />
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Send request
                </Button>
              </div>
            </Form>
          )}
        </ValidatedForm>
      )}
    </PagePanel>
  )
}
