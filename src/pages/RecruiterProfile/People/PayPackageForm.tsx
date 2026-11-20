import { Form, useFormikContext } from 'formik'
import React from 'react'
import { LuCalendar, LuInfo, LuPlus } from 'react-icons/lu'
import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'

import { CheckBox } from '@/components/forms/CheckBox'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { PROFILE_CURRENCY_OPTIONS, Select } from '@/components/forms/Select'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import {
  useBenefits,
  useCommissionPlans,
} from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import {
  Benefit,
  PayCurrency,
  PayPackage,
  PayPackagePayload,
  PayPeriod,
} from '@/features/people/types'
import {
  formatDateOnly,
  todayDateOnly,
} from '@/features/people/utils/formatDate'
import { firstNameOf } from '@/features/people/utils/nameParts'
import {
  currencySymbol,
  formatAmount,
  perPeriod,
  planSummary,
  yearlyTotal,
} from '@/features/people/utils/payPlan'

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

export const toPayload = (values: PayFormValues): PayPackagePayload => ({
  currency: values.currency,
  period: values.period,
  baseSalary: Number(values.baseSalary || 0),
  bonusPerYear: Number(values.bonus || 0),
  commissionTargetPerYear: Number(values.commissionTarget || 0),
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

export const paySentence = (name: string, values: PayFormValues) => {
  const payload = toPayload(values)
  const money = (amount: number) => formatAmount(values.currency, amount)
  const extras = [
    payload.bonusPerYear > 0 && `a ${money(payload.bonusPerYear)} yearly bonus`,
    payload.commissionTargetPerYear > 0 &&
      `a ${money(payload.commissionTargetPerYear)} commission target`,
  ].filter(Boolean)
  const total = yearlyTotal(
    payload.period,
    payload.baseSalary,
    payload.bonusPerYear,
    payload.commissionTargetPerYear,
  )
  return {
    lead: `${name} will be paid `,
    base: `${money(payload.baseSalary)} ${values.period}`,
    rest: ` from ${formatDateOnly(values.startsOn)}${
      extras.length ? `, plus ${extras.join(' and ')}` : ''
    }. Total yearly pay: `,
    total: money(total),
  }
}

const PaySummaryLine: React.FC<{ name: string }> = ({ name }) => {
  const { values } = useFormikContext<PayFormValues>()
  if (values.baseSalary === '' || !values.startsOn) return null
  const sentence = paySentence(name, values)
  return (
    <p className={styles.summaryLine} aria-live="polite">
      <LuInfo aria-hidden className={styles.summaryIcon} />
      <span>
        {sentence.lead}
        <strong>{sentence.base}</strong>
        {sentence.rest}
        <strong>{sentence.total}</strong>.
      </span>
    </p>
  )
}

const BenefitPicker: React.FC<{ benefits: Benefit[] }> = ({ benefits }) => {
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
        <p className={styles.hint}>
          Your company has no benefits yet.{' '}
          <Link to={peoplePaths.benefits}>Add benefits</Link>
        </p>
      ) : (
        <>
          <div className={styles.benefitGrid}>
            {benefits.map((benefit) => {
              const checked = values.benefitIds.includes(benefit.id)
              return (
                <div
                  key={benefit.id}
                  className={
                    checked
                      ? `${styles.benefitTile} ${styles.benefitChecked}`
                      : styles.benefitTile
                  }>
                  <CheckBox
                    name="benefitIds"
                    value={benefit.id}
                    label={benefit.name}
                    checked={checked}
                    onChange={(event) =>
                      toggle(benefit.id, event.target.checked)
                    }
                  />
                </div>
              )
            })}
          </div>
          <p className={styles.hint}>
            Manage the list in{' '}
            <Link to={peoplePaths.benefits}>People › Benefits</Link>.
          </p>
        </>
      )}
    </fieldset>
  )
}

interface PayPackageFormProps {
  organizationId: string
  staffId: string
  staffName: string
  current: PayPackage | null
  onDone: () => void
}

export const PayPackageForm: React.FC<PayPackageFormProps> = ({
  organizationId,
  staffId,
  staffName,
  current,
  onDone,
}) => {
  const { savePayPackage } = useStaffActions(organizationId)
  const { benefits } = useBenefits(organizationId)
  const { plans } = useCommissionPlans(organizationId)
  const firstName = firstNameOf(staffName)
  const navigate = useNavigate()
  const planOptions = [
    { value: '', label: 'No commission', description: 'Base and bonus only' },
    ...plans.map((plan) => ({
      value: plan.id,
      label: plan.name,
      description: planSummary(plan),
    })),
  ]

  const handleSubmit = async (values: PayFormValues) => {
    if (await savePayPackage(staffId, toPayload(values), firstName)) onDone()
  }

  return (
    <ValidatedForm
      initialValues={initialValuesFrom(current)}
      validationSchema={paySchema}
      onSubmit={handleSubmit}>
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className={styles.payForm} noValidate>
          <FormikFocusOnError />
          <div className={styles.grid}>
            <TextField
              name="baseSalary"
              label="Base salary"
              type="number"
              placeholder="350000"
              prefix={currencySymbol(values.currency)}
              suffix={perPeriod(values.period)}
            />
            <Select
              name="period"
              label="Pay frequency"
              options={PERIOD_OPTIONS}
              value={values.period}
              onChange={(value) => setFieldValue('period', value)}
            />
            <TextField
              name="startsOn"
              label="Starts from"
              type="date"
              icon={<LuCalendar />}
              hint={
                current
                  ? 'Keep the date to correct this package, or pick a new one to record a pay change.'
                  : undefined
              }
            />
            <TextField
              name="bonus"
              label="Bonus"
              type="number"
              placeholder="0"
              prefix={currencySymbol(values.currency)}
              suffix="per year"
            />
            <Select
              name="commissionPlanId"
              label="Commission plan"
              options={planOptions}
              value={values.commissionPlanId}
              onChange={(value) => setFieldValue('commissionPlanId', value)}
              footerAction={{
                label: 'New commission plan',
                icon: <LuPlus aria-hidden />,
                onClick: () => navigate(peoplePaths.newCommissionPlan),
              }}
            />
            <TextField
              name="commissionTarget"
              label="Commission target"
              type="number"
              placeholder="0"
              prefix={currencySymbol(values.currency)}
              suffix="per year"
            />
            <Select
              name="currency"
              label="Currency"
              options={PROFILE_CURRENCY_OPTIONS}
              value={values.currency}
              onChange={(value) => setFieldValue('currency', value)}
            />
          </div>
          <BenefitPicker benefits={benefits} />
          <PaySummaryLine name={firstName} />
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save pay
            </Button>
          </div>
        </Form>
      )}
    </ValidatedForm>
  )
}
