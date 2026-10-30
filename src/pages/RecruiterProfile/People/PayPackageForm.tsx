import { Form, useFormikContext } from 'formik'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Yup from 'yup'

import { CheckBox } from '@/components/forms/CheckBox'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { PROFILE_CURRENCY_OPTIONS, Select } from '@/components/forms/Select'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCommissionPlans } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { previewPayParagraph } from '@/features/people/services/peopleService'
import {
  Benefit,
  PayCurrency,
  PayPackage,
  PayPackagePayload,
  PayPeriod,
} from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'
import { useDebouncedValue } from '@/hooks'

import styles from './PayTab.module.scss'

interface PayFormValues {
  currency: PayCurrency
  period: PayPeriod
  baseSalary: number | ''
  bonus: number | ''
  commissionTarget: number | ''
  startsOn: string
  benefitIds: string[]
  commissionPlanId: string
}

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const MAX_AMOUNT = 1_000_000_000_000

const amountSchema = Yup.number()
  .transform((value, original) => (original === '' ? undefined : value))
  .typeError('Enter an amount')
  .min(0, 'The amount can’t be negative')
  .max(MAX_AMOUNT, 'That amount is too large')
  .test(
    'two-decimals',
    'Use at most 2 decimal places',
    (value) => value === undefined || Number.isInteger(value * 100),
  )

const paySchema = Yup.object({
  baseSalary: amountSchema.required('Enter the base salary'),
  bonus: amountSchema,
  commissionTarget: amountSchema,
  startsOn: Yup.string().required('Pick the date this package starts'),
})

const toPayload = (values: PayFormValues): PayPackagePayload => ({
  currency: values.currency,
  period: values.period,
  baseSalary: Number(values.baseSalary || 0),
  bonus: Number(values.bonus || 0),
  commissionTarget: Number(values.commissionTarget || 0),
  startsOn: values.startsOn,
  benefitIds: values.benefitIds,
  commissionPlanId: values.commissionPlanId || null,
})

const initialValuesFrom = (current: PayPackage | null): PayFormValues =>
  current
    ? {
        currency: current.currency,
        period: current.period,
        baseSalary: current.baseSalary,
        bonus: current.bonus || '',
        commissionTarget: current.commissionTarget || '',
        startsOn: current.startsOn,
        benefitIds: current.benefits.map((benefit) => benefit.id),
        commissionPlanId: current.commissionPlanId ?? '',
      }
    : {
        currency: 'NGN',
        period: 'monthly',
        baseSalary: '',
        bonus: '',
        commissionTarget: '',
        startsOn: todayDateOnly(),
        benefitIds: [],
        commissionPlanId: '',
      }

const ParagraphPreview: React.FC<{ organizationId: string }> = ({
  organizationId,
}) => {
  const { values } = useFormikContext<PayFormValues>()
  const debouncedValues = useDebouncedValue(values, 400)
  const [paragraph, setParagraph] = useState<string | null>(null)
  const isPreviewable = paySchema.isValidSync(debouncedValues)
  const payloadKey = JSON.stringify(toPayload(debouncedValues))

  useEffect(() => {
    if (!isPreviewable) {
      setParagraph(null)
      return
    }
    let isCurrent = true
    previewPayParagraph(organizationId, JSON.parse(payloadKey))
      .then((text) => isCurrent && setParagraph(text))
      .catch(() => isCurrent && setParagraph(null))
    return () => {
      isCurrent = false
    }
  }, [organizationId, payloadKey, isPreviewable])

  return (
    <aside className={styles.preview} aria-live="polite">
      <h4>Pay paragraph</h4>
      <p className={styles.previewHint}>This text goes into their contracts.</p>
      {paragraph ? (
        <blockquote className={styles.paragraph}>{paragraph}</blockquote>
      ) : (
        <p className={styles.previewEmpty}>
          Enter the base salary and start date to see the paragraph.
        </p>
      )}
    </aside>
  )
}

interface BenefitPickerProps {
  benefits: Benefit[]
}

const BenefitPicker: React.FC<BenefitPickerProps> = ({ benefits }) => {
  const { values, setFieldValue } = useFormikContext<PayFormValues>()

  const toggle = (benefitId: string, checked: boolean) =>
    setFieldValue(
      'benefitIds',
      checked
        ? [...values.benefitIds, benefitId]
        : values.benefitIds.filter((id) => id !== benefitId),
    )

  return (
    <fieldset className={styles.benefits}>
      <legend>Benefits</legend>
      {benefits.length === 0 ? (
        <p className={styles.previewEmpty}>
          Your company has no benefits yet.{' '}
          <Link to={peoplePaths.benefits}>Add benefits</Link>
        </p>
      ) : (
        benefits.map((benefit) => (
          <CheckBox
            key={benefit.id}
            name="benefitIds"
            value={benefit.id}
            label={benefit.name}
            checked={values.benefitIds.includes(benefit.id)}
            onChange={(event) => toggle(benefit.id, event.target.checked)}
          />
        ))
      )}
    </fieldset>
  )
}

interface PayPackageFormProps {
  organizationId: string
  staffId: string
  current: PayPackage | null
  benefits: Benefit[]
  onDone: () => void
}

export const PayPackageForm: React.FC<PayPackageFormProps> = ({
  organizationId,
  staffId,
  current,
  benefits,
  onDone,
}) => {
  const { savePayPackage } = useStaffActions(organizationId)
  const { plans } = useCommissionPlans(organizationId)
  const planOptions = [
    { value: '', label: 'No commission plan' },
    ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
  ]

  const handleSubmit = async (values: PayFormValues) => {
    if (await savePayPackage(staffId, toPayload(values))) onDone()
  }

  return (
    <ValidatedForm
      initialValues={initialValuesFrom(current)}
      validationSchema={paySchema}
      onSubmit={handleSubmit}>
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className={styles.payForm} noValidate>
          <FormikFocusOnError />
          <div className={styles.fields}>
            <div className={styles.row}>
              <Select
                name="currency"
                label="Currency"
                options={PROFILE_CURRENCY_OPTIONS}
                value={values.currency}
                onChange={(value) => setFieldValue('currency', value)}
              />
              <Select
                name="period"
                label="Paid"
                options={PERIOD_OPTIONS}
                value={values.period}
                onChange={(value) => setFieldValue('period', value)}
              />
            </div>
            <TextField
              name="baseSalary"
              label="Base salary"
              type="number"
              placeholder="400000"
            />
            <div className={styles.row}>
              <TextField
                name="bonus"
                label="Bonus"
                type="number"
                placeholder="0"
              />
              <TextField
                name="commissionTarget"
                label="Commission target"
                type="number"
                placeholder="0"
              />
            </div>
            <Select
              name="commissionPlanId"
              label="Commission plan"
              options={planOptions}
              value={values.commissionPlanId}
              onChange={(value) => setFieldValue('commissionPlanId', value)}
            />
            <TextField
              name="startsOn"
              label="Package starts on"
              type="date"
              hint={
                current
                  ? 'Keep the same date to correct this package, or pick a new date to record a change in pay.'
                  : undefined
              }
            />
            <BenefitPicker benefits={benefits} />
            <div className={styles.actions}>
              <Button type="submit" loading={isSubmitting}>
                Save pay
              </Button>
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
            </div>
          </div>
          <ParagraphPreview organizationId={organizationId} />
        </Form>
      )}
    </ValidatedForm>
  )
}
