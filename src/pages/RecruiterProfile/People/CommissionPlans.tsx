import { ErrorMessage, Field, FieldArray, Form, useFormikContext } from 'formik'
import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineChartBar, HiOutlineTrash } from 'react-icons/hi2'
import * as Yup from 'yup'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { HeroAction, PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Dropdown } from '@/components/ui/Dropdown'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useCommissionPlans } from '@/features/people/hooks/useStaffData'
import { CommissionPlan, CommissionTier } from '@/features/people/types'
import { commissionPayout } from '@/features/people/utils/commissionPayout'
import { formatCount } from '@/features/people/utils/formatMoney'

import styles from './CommissionPlans.module.scss'
import payStyles from './PayTab.module.scss'

interface TierRow {
  toPercent: number | ''
  ratePercent: number | ''
  boost: number | ''
}

interface PlanFormValues {
  name: string
  tiers: TierRow[]
}

type EditingPlan = CommissionPlan | 'new' | null

const EXAMPLE_TIERS: TierRow[] = [
  { toPercent: 80, ratePercent: 5, boost: '' },
  { toPercent: 100, ratePercent: 8, boost: '' },
  { toPercent: '', ratePercent: 12, boost: 1.5 },
]

const emptyToUndefined = (value: unknown, original: unknown) =>
  original === '' ? undefined : value

const planSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Name the plan')
    .max(120, 'Keep the name under 120 characters'),
  tiers: Yup.array()
    .of(
      Yup.object({
        toPercent: Yup.number()
          .transform(emptyToUndefined)
          .typeError('Enter a percentage')
          .max(1000, 'Use at most 1000%'),
        ratePercent: Yup.number()
          .transform(emptyToUndefined)
          .typeError('Enter a rate')
          .required('Enter a rate')
          .min(0, 'The rate can’t be negative')
          .max(100, 'Use at most 100%'),
        boost: Yup.number()
          .transform(emptyToUndefined)
          .typeError('Enter a number')
          .min(1, 'A boost is at least 1×')
          .max(10, 'Use at most 10×'),
      }),
    )
    .min(1, 'Add at least one tier')
    .max(10, 'Use at most 10 tiers')
    .test('rising-limits', function (rows = []) {
      for (let index = 0; index < rows.length - 1; index++) {
        const to = rows[index]?.toPercent
        const from = index === 0 ? 0 : rows[index - 1]?.toPercent ?? 0
        const path = `tiers.${index}.toPercent`
        if (to === undefined) {
          return this.createError({
            path,
            message: 'Enter where this tier ends',
          })
        }
        if (to <= from) {
          return this.createError({ path, message: `Must be above ${from}%` })
        }
      }
      return true
    }),
})

const toTiers = (rows: TierRow[]): CommissionTier[] =>
  rows.map((row, index) => ({
    fromPercent: index === 0 ? 0 : Number(rows[index - 1]!.toPercent),
    toPercent: index === rows.length - 1 ? null : Number(row.toPercent),
    ratePercent: Number(row.ratePercent),
    boost: row.boost === '' ? null : Number(row.boost),
  }))

const toRows = (tiers: CommissionTier[]): TierRow[] =>
  tiers.map((tier) => ({
    toPercent: tier.toPercent ?? '',
    ratePercent: tier.ratePercent,
    boost: tier.boost ?? '',
  }))

const describeTier = (tier: CommissionTier) =>
  `${tier.ratePercent}%${tier.boost ? ` ×${tier.boost}` : ''}`

const tierRange = (tier: CommissionTier) =>
  tier.toPercent === null
    ? `${tier.fromPercent}% and above`
    : `${tier.fromPercent}% to under ${tier.toPercent}%`

const NumberCell: React.FC<{ name: string; label: string; suffix: string }> = ({
  name,
  label,
  suffix,
}) => (
  <label className={styles.cell}>
    <span className={styles.cellLabel}>{label}</span>
    <span className={styles.inputWrap}>
      <Field
        name={name}
        type="number"
        aria-label={label}
        className={styles.input}
      />
      <span>{suffix}</span>
    </span>
    <ErrorMessage name={name}>
      {(message) => (
        <span className={styles.error} role="alert">
          {message}
        </span>
      )}
    </ErrorMessage>
  </label>
)

const TiersEditor = () => {
  const { values } = useFormikContext<PlanFormValues>()

  return (
    <FieldArray name="tiers">
      {({ push, remove }) => (
        <fieldset className={styles.tiers}>
          <legend>Tiers, by share of target reached</legend>
          {values.tiers.map((row, index) => {
            const from = index === 0 ? 0 : values.tiers[index - 1]!.toPercent
            const isLast = index === values.tiers.length - 1
            return (
              <div key={index} className={styles.tier}>
                <div className={styles.cell}>
                  <span className={styles.cellLabel}>From</span>
                  <span className={styles.fixed}>
                    {from === '' ? '—' : `${from}%`}
                  </span>
                </div>
                {isLast ? (
                  <div className={styles.cell}>
                    <span className={styles.cellLabel}>To</span>
                    <span className={styles.fixed}>No limit</span>
                  </div>
                ) : (
                  <NumberCell
                    name={`tiers.${index}.toPercent`}
                    label="To under"
                    suffix="%"
                  />
                )}
                <NumberCell
                  name={`tiers.${index}.ratePercent`}
                  label="Rate"
                  suffix="%"
                />
                <NumberCell
                  name={`tiers.${index}.boost`}
                  label="Boost"
                  suffix="×"
                />
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remove tier ${index + 1}`}
                  disabled={values.tiers.length === 1}
                  onClick={() => remove(index)}>
                  <HiOutlineTrash />
                </button>
                {row.boost === '' && isLast && (
                  <span className={styles.tierHint}>
                    Add a boost to pay extra for going over target.
                  </span>
                )}
              </div>
            )
          })}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={values.tiers.length >= 10}
            onClick={() => push({ toPercent: '', ratePercent: '', boost: '' })}>
            Add tier
          </Button>
          <ErrorMessage name="tiers">
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
  const [target, setTarget] = useState('')
  const [actual, setActual] = useState('')
  const isReady =
    planSchema.isValidSync(values) && target !== '' && actual !== ''
  const tiers = toTiers(values.tiers)
  const result = isReady
    ? commissionPayout(tiers, Number(target), Number(actual))
    : null

  return (
    <aside className={payStyles.preview} aria-live="polite">
      <h4>Try it</h4>
      <p className={payStyles.previewHint}>
        Type a target and a result to see the payout.
      </p>
      <div className={styles.tryInputs}>
        <label>
          <span>Target</span>
          <input
            type="number"
            min={0}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>
        <label>
          <span>Actual result</span>
          <input
            type="number"
            min={0}
            value={actual}
            onChange={(event) => setActual(event.target.value)}
          />
        </label>
      </div>
      {result ? (
        <p className={styles.tryResult}>
          {result.attainmentPercent === null ? (
            'Enter a target above 0.'
          ) : (
            <>
              <strong>{formatCount(result.payout)}</strong> payout at{' '}
              {Math.round(result.attainmentPercent * 10) / 10}% of target
              {result.tierIndex !== null &&
                ` (${describeTier(tiers[result.tierIndex]!)})`}
            </>
          )}
        </p>
      ) : (
        <p className={payStyles.previewEmpty}>
          Finish the tiers, then type a target and a result.
        </p>
      )}
    </aside>
  )
}

export const CommissionPlans = () => {
  const { organizationId } = usePeopleAccess()
  const { plans, isLoading, hasError } = useCommissionPlans(organizationId)
  const { saveCommissionPlan, removeCommissionPlan, isSaving } =
    useStaffActions(organizationId)
  const [editing, setEditing] = useState<EditingPlan>(null)
  const [planToDelete, setPlanToDelete] = useState<CommissionPlan | null>(null)

  const columns: ColumnDef<CommissionPlan>[] = [
    {
      key: 'name',
      header: 'Plan',
      render: (plan) => <strong>{plan.name}</strong>,
    },
    {
      key: 'tiers',
      header: 'Tiers',
      hideBelow: 768,
      render: (plan) => (
        <ul className={styles.tierList}>
          {plan.tiers.map((tier) => (
            <li key={tier.fromPercent}>
              {tierRange(tier)}: {describeTier(tier)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (plan) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Plan actions" />}
            items={[
              { label: 'Edit', onClick: () => setEditing(plan) },
              { label: 'Delete', onClick: () => setPlanToDelete(plan) },
            ]}
          />
        </TableActions>
      ),
    },
  ]

  const handleSave = async (values: PlanFormValues) => {
    const saved = await saveCommissionPlan(
      { name: values.name.trim(), tiers: toTiers(values.tiers) },
      editing && editing !== 'new' ? editing.id : undefined,
    )
    if (saved) setEditing(null)
  }

  const handleDelete = async () => {
    if (planToDelete && (await removeCommissionPlan(planToDelete))) {
      setPlanToDelete(null)
    }
  }

  const initialValues: PlanFormValues =
    editing && editing !== 'new'
      ? { name: editing.name, tiers: toRows(editing.tiers) }
      : { name: '', tiers: EXAMPLE_TIERS }

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Commission plans"
        lead="Tiers of commission for salespeople. Give a plan to someone on their Pay tab."
        actions={
          <HeroAction onClick={() => setEditing('new')}>New plan</HeroAction>
        }
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load commission plans"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <DataTable
          columns={columns}
          data={plans}
          isLoading={isLoading}
          getRowKey={(plan) => plan.id}
          ariaLabel="Commission plans"
          showRowNumber={false}
          emptyState={
            <EmptyState
              icon={<HiOutlineChartBar />}
              title="No commission plans yet"
              description="Create a plan with tiers, for example 5% below 80% of target and 12% above it."
              action={
                <Button onClick={() => setEditing('new')}>New plan</Button>
              }
            />
          }
        />
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === 'new' ? 'New commission plan' : 'Edit commission plan'
        }>
        <ValidatedForm
          initialValues={initialValues}
          enableReinitialize
          validationSchema={planSchema}
          onSubmit={handleSave}>
          {({ isSubmitting }) => (
            <Form className={payStyles.fields} noValidate>
              <FormikFocusOnError />
              <TextField
                name="name"
                label="Plan name"
                placeholder="Sales 2027"
              />
              <TiersEditor />
              <TryIt />
              <div className={payStyles.actions}>
                <Button type="submit" loading={isSubmitting}>
                  Save plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </ValidatedForm>
      </Drawer>

      <ConfirmDialog
        open={!!planToDelete}
        title={`Delete ${planToDelete?.name ?? 'this plan'}?`}
        message="Plans given to someone can't be deleted. Remove the plan from their pay first."
        confirmLabel="Delete plan"
        variant="danger"
        isConfirming={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setPlanToDelete(null)}
      />
    </PageShell>
  )
}
