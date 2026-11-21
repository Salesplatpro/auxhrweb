import { Form } from 'formik'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'

import { CheckBox } from '@/components/forms/CheckBox'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { TextInput } from '@/components/forms/TextInput'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { applicationPath } from '@/features/talent-applications/steps'
import { useApplicationPipelineQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ChecksConsentPage.module.scss'
import {
  agreeToChecks,
  consentKey,
  declineChecks,
  fetchMyConsent,
} from './checksService'
import {
  ConsentFormValues,
  consentSchema,
  digitsOnly,
  ID_KIND_OPTIONS,
  INITIAL_CONSENT,
} from './consentRules'
import type { IdKind } from './types'

export const ChecksConsentPage = () => {
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const { data: pipeline } = useApplicationPipelineQuery(applicationId)
  const { data, isLoading, error, mutate } = useSWR(
    consentKey(applicationId),
    () => fetchMyConsent(applicationId),
    { revalidateOnFocus: false },
  )

  const job = pipeline?.application.job
  const company = job?.organization?.name ?? 'The company'
  const shell = {
    companyName: job?.organization?.name,
    title: job ? `Application · ${job.title}` : 'Application',
  }
  const backToApplication = () => navigate(applicationPath(applicationId))

  if (isLoading) return <Spinner fullPage />
  if (error || !data) {
    return (
      <PublicShell {...shell} width="narrow">
        <EmptyState
          title="We could not load this page"
          description="Check your connection and try again."
          action={<Button onClick={() => void mutate()}>Try again</Button>}
        />
      </PublicShell>
    )
  }

  if (data.state === 'not_requested') {
    return (
      <PublicShell {...shell} width="narrow">
        <EmptyState
          title="Nothing to answer yet"
          description={`${company} has not asked for any checks on this application.`}
          action={
            <Button onClick={backToApplication}>Back to application</Button>
          }
        />
      </PublicShell>
    )
  }

  if (data.state === 'agreed') {
    return (
      <PublicShell {...shell} width="narrow">
        <EmptyState
          title="You agreed to these checks"
          description={`${company} can now run them. We never show your ${
            data.idKind?.toUpperCase() ?? 'ID number'
          } again, only its last four digits (${data.idNumberLast4 ?? ''}).`}
          action={
            <Button onClick={backToApplication}>Back to application</Button>
          }
        />
      </PublicShell>
    )
  }

  const handleAgree = async (values: ConsentFormValues) => {
    try {
      await agreeToChecks(applicationId, values.idKind, values.idNumber)
      await mutate()
      notify('success', 'Thank you. You agreed to these checks')
      backToApplication()
    } catch (submitError) {
      notify(
        'error',
        getErrorMessage(
          submitError,
          "We couldn't save your answer. Try again.",
        ),
        { autoClose: 4000 },
      )
    }
  }

  const handleDecline = async () => {
    try {
      await declineChecks(applicationId)
      await mutate()
      notify('success', `We told ${company} you declined these checks`)
      backToApplication()
    } catch (declineError) {
      notify(
        'error',
        getErrorMessage(
          declineError,
          "We couldn't save your answer. Try again.",
        ),
        { autoClose: 4000 },
      )
    }
  }

  return (
    <PublicShell {...shell} width="narrow">
      <h1 className={styles.title}>Checks for your application</h1>
      <p className={styles.lead}>
        {company} asks for your permission to run these checks.
      </p>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>What will be checked</h2>
        <p>Identity: we compare your name with your NIN or BVN.</p>
        <p>Past jobs: we confirm the jobs on your CV with the companies.</p>
        <p>Education: we confirm your degrees with your school.</p>
        <h2 className={styles.cardTitle}>Why</h2>
        <p>To confirm what you told us is true before an offer.</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Who will see the results</h2>
        <p>
          Only the recruiter who ordered the check and the company owner. You
          can ask us to delete your results after the hiring decision.
        </p>
      </section>

      <ValidatedForm
        initialValues={INITIAL_CONSENT}
        validationSchema={consentSchema}
        onSubmit={handleAgree}>
        {({
          values,
          setFieldValue,
          handleBlur,
          isSubmitting,
          isValid,
          dirty,
        }) => (
          <Form className={styles.card} noValidate>
            <FormikFocusOnError />
            <h2 className={styles.cardTitle}>Your answer</h2>
            <SegmentedControl
              label="ID type"
              options={ID_KIND_OPTIONS}
              value={[values.idKind]}
              onChange={([kind]) =>
                void setFieldValue('idKind', (kind ?? 'nin') as IdKind)
              }
            />
            <TextInput
              title="NIN or BVN (for the identity check)"
              name="idNumber"
              label="NIN or BVN (for the identity check)"
              placeholder="Enter 11 digits"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              value={values.idNumber}
              onChange={(event) =>
                void setFieldValue('idNumber', digitsOnly(event.target.value))
              }
              onBlur={handleBlur}
            />
            <CheckBox
              name="agreed"
              label="I agree to these checks"
              checked={values.agreed}
              onChange={(event) =>
                void setFieldValue('agreed', event.target.checked)
              }
            />
            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void handleDecline()}>
                Decline
              </Button>
              <Button
                type="submit"
                variant="ink"
                pill
                loading={isSubmitting}
                disabled={!dirty || !isValid}>
                Agree
              </Button>
            </div>
          </Form>
        )}
      </ValidatedForm>
    </PublicShell>
  )
}
