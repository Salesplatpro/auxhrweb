import { ErrorMessage, Field, FieldArray, Form, useFormikContext } from 'formik'
import React, { useState } from 'react'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2'
import { useNavigate, useParams } from 'react-router-dom'
import * as Yup from 'yup'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { Select } from '@/components/forms/Select'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCommissionPlans } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import {
  CommissionBand,
  CommissionFrequency,
  CommissionPaidOn,
} from '@/features/people/types'
import {
  FREQUENCY_LABELS,
  PAID_ON_LABELS,
  toOptions,
} from '@/features/people/utils/commissionLabels'
import { commissionPayout } from '@/features/people/utils/commissionPayout'
import { formatCurrency } from '@/features/people/utils/formatMoney'

import styles from './CommissionPlanEditor.module.scss'

const CURRENCY = 'NGN'
const SYMBOL = '₦'
const MAX_BANDS = 10

interface BandRow {
  toAmount: number | ''
  ratePercent: number | ''
}

interface PlanFormValues {
  name: string
  paidOn: CommissionPaidOn
  frequency: CommissionFrequency
  bands: BandRow[]
}

const BLANK_BANDS: BandRow[] = [
  { toAmount: '', ratePercent: '' },
  { toAmount: '', ratePercent: '' },
]

const emptyToUndefined = (value: unknown, original: unknown) =>
  original === '' ? undefined : value

const planSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Name the plan')
    .max(120, 'Keep the name under 120 characters'),
  paidOn: Yup.string().oneOf(Object.keys(PAID_ON_LABELS)).required(),
  frequency: Yup.string().oneOf(Object.keys(FREQUENCY_LABELS)).required(),
  bands: Yup.array()
    .of(
      Yup.object({
        toAmount: Yup.number()
          .transform(emptyToUndefined)
          .typeError('Enter an amount')
          .min(0, 'Can’t be negative'),
        ratePercent: Yup.number()
          .transform(emptyToUndefined)
          .typeError('Enter a rate')
          .required('Enter a rate')
          .min(0, 'Can’t be negative')
          .max(100, 'Use at most 100%'),
      }),
    )
    .min(1, 'Add at least one tier')
    .max(MAX_BANDS, `Use at most ${MAX_BANDS} tiers`)
    .test('rising-limits', function (rows = []) {
      for (let index = 0; index < rows.length - 1; index++) {
        const to = rows[index]?.toAmount
        const from = index === 0 ? 0 : rows[index - 1]?.toAmount ?? 0
        const path = `bands.${index}.toAmount`
        if (to === undefined) {
          return this.createError({
            path,
            message: 'Enter where this tier ends',
          })
        }
        if (to <= from) {
          return this.createError({
            path,
            message: 'Must be above the tier before',
          })
        }
      }
      return true
    }),
})

const toBands = (rows: BandRow[]): CommissionBand[] =>
  rows.map((row, index) => ({
    fromAmount: index === 0 ? 0 : Number(rows[index - 1]!.toAmount),
    toAmount: index === rows.length - 1 ? null : Number(row.toAmount),
    ratePercent: Number(row.ratePercent),
  }))

const toRows = (bands: CommissionBand[]): BandRow[] =>
  bands.map((band) => ({
    toAmount: band.toAmount ?? '',
    ratePercent: band.ratePercent,
  }))

const AmountField: React.FC<{ name: string; label: string }> = ({
  name,
  label,
}) => (
  <div className={styles.cell}>
    <span className={styles.field}>
      <span className={styles.prefix} aria-hidden>
        {SYMBOL}
      </span>
      <Field name={name} type="number" aria-label={label} />
    </span>
    <ErrorMessage name={name}>
      {(message) => (
        <span className={styles.error} role="alert">
          {message}
        </span>
      )}
    </ErrorMessage>
  </div>
)

const RateField: React.FC<{ name: string; label: string }> = ({
  name,
  label,
}) => (
  <div className={styles.cell}>
    <span className={styles.rateField}>
      <Field name={name} type="number" step="any" aria-label={label} />
      <span className={styles.suffix} aria-hidden>
        %
      </span>
    </span>
    <ErrorMessage name={name}>
      {(message) => (
        <span className={styles.error} role="alert">
          {message}
        </span>
      )}
    </ErrorMessage>
  </div>
)

const TiersEditor = () => {
  const { values } = useFormikContext<PlanFormValues>()

  return (
    <FieldArray name="bands">
      {({ push, remove }) => (
        <fieldset className={styles.tiers}>
          <legend>Tiers</legend>
          <div className={`${styles.tierRow} ${styles.tierHead}`} aria-hidden>
            <span>#</span>
            <span>From</span>
            <span>To</span>
            <span>Rate</span>
            <span />
          </div>
          {values.bands.map((_, index) => {
            const from = index === 0 ? 0 : values.bands[index - 1]!.toAmount
            const isLast = index === values.bands.length - 1
            return (
              <div key={index} className={styles.tierRow}>
                <span className={styles.index}>{index + 1}</span>
                <div className={styles.cell}>
                  <span className={styles.field}>
                    <span className={styles.prefix} aria-hidden>
                      {SYMBOL}
                    </span>
                    <input
                      readOnly
                      tabIndex={-1}
                      aria-label={`Tier ${index + 1} starts at`}
                      value={
                        from === '' ? '' : Number(from).toLocaleString('en-NG')
                      }
                    />
                  </span>
                </div>
                {isLast ? (
                  <div className={styles.cell}>
                    <input
                      readOnly
                      tabIndex={-1}
                      aria-label={`Tier ${index + 1} ends at`}
                      value="No limit"
                      className={styles.noLimit}
                    />
                  </div>
                ) : (
                  <AmountField
                    name={`bands.${index}.toAmount`}
                    label={`Tier ${index + 1} ends at`}
                  />
                )}
                <RateField
                  name={`bands.${index}.ratePercent`}
                  label={`Tier ${index + 1} rate`}
                />
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remove tier ${index + 1}`}
                  disabled={values.bands.length === 1}
                  onClick={() => remove(index)}>
                  <HiOutlineTrash />
                </button>
              </div>
            )
          })}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            icon={<HiOutlinePlus />}
            className={styles.addTier}
            disabled={values.bands.length >= MAX_BANDS}
            onClick={() => push({ toAmount: '', ratePercent: '' })}>
            Add tier
          </Button>
          <ErrorMessage name="bands">
            {(message) =>
              typeof message === 'string' ? (
                <span className={styles.error} role="alert">
                  {message}
                </span>
              ) : null
            }
          </ErrorMessage>
        </fieldset>
      )}
    </FieldArray>
  )
}

const TryIt = () => {
  const { values } = useFormikContext<PlanFormValues>()
  const [sales, setSales] = useState('')
  const isReady = planSchema.isValidSync(values) && sales !== ''
  const result = isReady
    ? commissionPayout(toBands(values.bands), Number(sales))
    : null

  return (
    <PagePanel title="Try it" hint="See what someone would earn">
      <div className={styles.cell}>
        <label htmlFor="try-sales">Sales this year</label>
        <span className={styles.field}>
          <span className={styles.prefix} aria-hidden>
            {SYMBOL}
          </span>
          <input
            id="try-sales"
            type="number"
            min={0}
            value={sales}
            onChange={(event) => setSales(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
          />
        </span>
      </div>
      {result && (
        <div className={styles.result} aria-live="polite">
          {result.lines.map((line, index) => (
            <div key={index} className={styles.line}>
              <span>
                {index === 0 ? 'First' : 'Next'}{' '}
                {formatCurrency(CURRENCY, line.inside)} × {line.ratePercent}%
              </span>
              <strong>{formatCurrency(CURRENCY, line.amount)}</strong>
            </div>
          ))}
          <div className={styles.total}>
            <span>Commission</span>
            <strong>{formatCurrency(CURRENCY, result.total)}</strong>
          </div>
        </div>
      )}
    </PagePanel>
  )
}

export const CommissionPlanEditor = () => {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const { organizationId } = usePeopleAccess()
  const { plans, isLoading, hasError } = useCommissionPlans(organizationId)
  const { saveCommissionPlan } = useStaffActions(organizationId)

  const plan = planId ? plans.find((item) => item.id === planId) : undefined
  const backToList = () => navigate(peoplePaths.commissionPlans)

  const breadcrumbs = [
    { label: 'People', to: peoplePaths.employees },
    { label: 'Commission plans', to: peoplePaths.commissionPlans },
    { label: planId ? 'Edit plan' : 'New plan' },
  ]

  if (planId && isLoading) return <Spinner fullPage />

  if (hasError || (planId && !plan)) {
    return (
      <PageShell wide>
        <EmptyState
          title="Couldn't find this plan"
          description="It may have been deleted. Go back to the list and try again."
          action={<Button onClick={backToList}>Back to plans</Button>}
        />
      </PageShell>
    )
  }

  const initialValues: PlanFormValues = {
    name: plan?.name ?? '',
    paidOn: plan?.paidOn ?? 'yearly_sales',
    frequency: plan?.frequency ?? 'quarterly',
    bands: plan?.bands ? toRows(plan.bands) : BLANK_BANDS,
  }

  const handleSave = async (values: PlanFormValues) => {
    const saved = await saveCommissionPlan(
      {
        name: values.name.trim(),
        paidOn: values.paidOn,
        frequency: values.frequency,
        bands: toBands(values.bands),
      },
      plan?.id,
    )
    if (saved) backToList()
  }

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={breadcrumbs}
        title={planId ? 'Edit commission plan' : 'New commission plan'}
        description="Each tier pays its rate on the sales inside it."
      />

      <ValidatedForm
        initialValues={initialValues}
        enableReinitialize
        validationSchema={planSchema}
        onSubmit={handleSave}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form noValidate>
            <FormikFocusOnError />
            <div className={styles.layout}>
              <PagePanel title="Plan">
                <div className={styles.form}>
                  <div className={styles.details}>
                    <TextField
                      name="name"
                      label="Plan name"
                      placeholder="Sales team 2026"
                    />
                    <Select
                      name="paidOn"
                      label="Paid on"
                      options={toOptions(PAID_ON_LABELS)}
                      value={values.paidOn}
                      onChange={(value) => setFieldValue('paidOn', value)}
                    />
                    <Select
                      name="frequency"
                      label="Paid"
                      options={toOptions(FREQUENCY_LABELS)}
                      value={values.frequency}
                      onChange={(value) => setFieldValue('frequency', value)}
                    />
                  </div>
                  <TiersEditor />
                  <div className={styles.actions}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={backToList}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                      Save plan
                    </Button>
                  </div>
                </div>
              </PagePanel>
              <TryIt />
            </div>
          </Form>
        )}
      </ValidatedForm>
    </PageShell>
  )
}
