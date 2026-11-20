import { Form, useFormikContext } from 'formik'
import React, { useState } from 'react'
import { BsThreeDots } from 'react-icons/bs'
import { LuCheck, LuLayers, LuPlus } from 'react-icons/lu'
import * as Yup from 'yup'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { PROFILE_CURRENCY_OPTIONS, Select } from '@/components/forms/Select'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Dropdown } from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { VestingTimeline } from '@/features/people/components/VestingTimeline'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { PayCurrency, ShareGrant, StaffMember } from '@/features/people/types'
import {
  formatDateOnly,
  todayDateOnly,
} from '@/features/people/utils/formatDate'
import { formatCount } from '@/features/people/utils/formatMoney'
import { firstNameOf } from '@/features/people/utils/nameParts'
import { currencySymbol, formatAmount } from '@/features/people/utils/payPlan'
import {
  vestingDates,
  vestingPreview,
  VestingStage,
  vestingStage,
} from '@/features/people/utils/vesting'

import styles from './ShareOptionsCard.module.scss'

interface GrantFormValues {
  shares: number | ''
  grantedOn: string
  cliffMonths: number | ''
  vestingMonths: number | ''
  strikePrice: number | ''
  currency: PayCurrency
}

const MAX_MONTHS = 240

const wholeMonths = Yup.number()
  .typeError('Enter a number of months')
  .integer('Use whole months')
  .max(MAX_MONTHS, `Use at most ${MAX_MONTHS} months`)

const grantSchema = Yup.object({
  shares: Yup.number()
    .typeError('Enter the number of shares')
    .required('Enter the number of shares')
    .integer('Use a whole number of shares')
    .min(1, 'Grant at least 1 share')
    .max(1_000_000_000, 'That is too many shares'),
  grantedOn: Yup.string().required('Pick the grant date'),
  vestingMonths: wholeMonths
    .required('Enter the vesting period')
    .min(1, 'Vest over at least 1 month'),
  cliffMonths: wholeMonths
    .required('Enter the cliff, or 0 for none')
    .min(0, 'The cliff can’t be negative')
    .test(
      'within-vesting',
      'The cliff can’t be longer than the vesting period',
      function (cliff) {
        const vesting = this.parent.vestingMonths
        return cliff === undefined || vesting === '' || cliff <= vesting
      },
    ),
  strikePrice: Yup.number()
    .typeError('Enter the strike price')
    .required('Enter the strike price')
    .min(0, 'The price can’t be negative')
    .test('two-decimals', 'Use at most 2 decimal places', (value) =>
      value === undefined ? true : Number.isInteger(value * 100),
    ),
})

const emptyGrant = (): GrantFormValues => ({
  shares: '',
  grantedOn: todayDateOnly(),
  cliffMonths: 12,
  vestingMonths: 48,
  strikePrice: '',
  currency: 'NGN',
})

const STAGE_STYLE: Record<
  VestingStage,
  { label: string; backgroundColor: string; color: string }
> = {
  'before-cliff': {
    label: 'Before cliff',
    backgroundColor: 'var(--color-warning-tint)',
    color: 'var(--color-warning)',
  },
  vesting: {
    label: 'Vesting',
    backgroundColor: 'var(--color-success-tint)',
    color: 'var(--color-success)',
  },
  'fully-owned': {
    label: 'Fully owned',
    backgroundColor: 'var(--color-info-tint)',
    color: 'var(--color-info)',
  },
}

const GrantPreview: React.FC<{ firstName: string }> = ({ firstName }) => {
  const { values } = useFormikContext<GrantFormValues>()
  const isComplete = grantSchema.isValidSync(values)
  if (!isComplete) return null
  const preview = vestingPreview({
    shares: Number(values.shares),
    grantedOn: values.grantedOn,
    cliffMonths: Number(values.cliffMonths),
    vestingMonths: Number(values.vestingMonths),
  })
  const lines = [
    `${formatCount(
      preview.firstShares,
    )} shares become ${firstName}'s on ${formatDateOnly(preview.firstDate)}${
      preview.afterCliff ? ' (after the cliff)' : ''
    }`,
    preview.monthlyShares > 0 &&
      `Then about ${formatCount(preview.monthlyShares)} shares each month`,
    `All ${formatCount(
      Number(values.shares),
    )} shares are ${firstName}'s on ${formatDateOnly(preview.fullyOwnedDate)}`,
  ].filter(Boolean) as string[]

  return (
    <section className={styles.preview} aria-live="polite">
      <h4>Preview</h4>
      <ul>
        {lines.map((line) => (
          <li key={line}>
            <LuCheck aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}

interface GrantCardProps {
  grant: ShareGrant
  number: number
  firstName: string
  canRemove: boolean
  onRemove: () => void
}

const GrantCard: React.FC<GrantCardProps> = ({
  grant,
  number,
  firstName,
  canRemove,
  onRemove,
}) => {
  const stage = STAGE_STYLE[vestingStage(grant, todayDateOnly())]
  const { fullyVestedDate } = vestingDates(grant)
  const meta = [
    { label: 'Grant date', value: formatDateOnly(grant.grantedOn) },
    { label: 'Cliff', value: `${grant.cliffMonths} months` },
    { label: 'Vesting period', value: `${grant.vestingMonths} months` },
    {
      label: 'Strike price',
      value: `${formatAmount(grant.currency, grant.strikePrice)} per share`,
    },
    { label: 'Fully owned', value: formatDateOnly(fullyVestedDate) },
  ]

  return (
    <li className={styles.grant}>
      <div className={styles.grantHeader}>
        <div>
          <h4>
            Grant {number} · {formatCount(grant.shares)} shares
          </h4>
          {grant.createdByName && grant.createdAt && (
            <p className={styles.addedBy}>
              Added by {grant.createdByName} on{' '}
              {formatDateOnly(grant.createdAt)}
            </p>
          )}
        </div>
        <div className={styles.grantActions}>
          <StatusBadge
            status={stage.label}
            backgroundColor={stage.backgroundColor}
            color={stage.color}
            showDot
          />
          {canRemove && (
            <Dropdown
              trigger={<BsThreeDots aria-label={`Grant ${number} actions`} />}
              items={[{ label: 'Remove grant', onClick: onRemove }]}
            />
          )}
        </div>
      </div>
      <dl className={styles.meta}>
        {meta.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <VestingTimeline grant={grant} ownerFirstName={firstName} />
    </li>
  )
}

interface ShareOptionsCardProps {
  organizationId: string
  staff: StaffMember
  grants: ShareGrant[]
  canEdit: boolean
}

export const ShareOptionsCard: React.FC<ShareOptionsCardProps> = ({
  organizationId,
  staff,
  grants,
  canEdit,
}) => {
  const { addGrant, removeGrant, isSaving } = useStaffActions(organizationId)
  const [isAdding, setIsAdding] = useState(false)
  const [grantToRemove, setGrantToRemove] = useState<ShareGrant | null>(null)
  const firstName = firstNameOf(staff.fullName)

  const handleAdd = async (values: GrantFormValues) => {
    const created = await addGrant(
      staff.id,
      {
        shares: Number(values.shares),
        grantedOn: values.grantedOn,
        cliffMonths: Number(values.cliffMonths),
        vestingMonths: Number(values.vestingMonths),
        strikePrice: Number(values.strikePrice),
        currency: values.currency,
      },
      firstName,
    )
    if (created) setIsAdding(false)
  }

  const handleRemove = async () => {
    if (grantToRemove && (await removeGrant(staff.id, grantToRemove.id))) {
      setGrantToRemove(null)
    }
  }

  return (
    <PagePanel
      title="Share options"
      hint={`Grants of company shares and when they become ${firstName}'s.`}
      action={
        canEdit && (
          <Button
            size="sm"
            variant="ink"
            icon={<LuPlus aria-hidden />}
            onClick={() => setIsAdding(true)}>
            Add grant
          </Button>
        )
      }>
      {grants.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            icon={<LuLayers size={22} />}
            title="No share options yet"
            description={
              canEdit
                ? `Add a grant to show ${firstName} how many shares they get and when they become theirs.`
                : `${firstName} has no share grants.`
            }
          />
        </div>
      ) : (
        <ul className={styles.grants}>
          {grants.map((grant, index) => (
            <GrantCard
              key={grant.id}
              grant={grant}
              number={grants.length - index}
              firstName={firstName}
              canRemove={canEdit}
              onRemove={() => setGrantToRemove(grant)}
            />
          ))}
        </ul>
      )}

      <Drawer
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add grant"
        subtitle={`Share options for ${staff.fullName}`}>
        <ValidatedForm
          initialValues={emptyGrant()}
          validationSchema={grantSchema}
          onSubmit={handleAdd}>
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className={styles.form} noValidate>
              <FormikFocusOnError />
              <TextField
                name="shares"
                label="Number of shares"
                type="number"
                placeholder="10000"
              />
              <div className={styles.row}>
                <TextField name="grantedOn" label="Grant date" type="date" />
                <TextField
                  name="strikePrice"
                  label="Strike price"
                  type="number"
                  placeholder="50.00"
                  prefix={currencySymbol(values.currency)}
                  suffix="per share"
                />
              </div>
              <div className={styles.row}>
                <TextField
                  name="cliffMonths"
                  label="Cliff (months)"
                  type="number"
                  suffix="months"
                />
                <TextField
                  name="vestingMonths"
                  label="Vesting period (months)"
                  type="number"
                  suffix="months"
                />
              </div>
              <p className={styles.hint}>
                The cliff is how long {firstName} waits before any shares are
                theirs. After that, shares become theirs each month until the
                vesting period ends.
              </p>
              <Select
                name="currency"
                label="Currency"
                options={PROFILE_CURRENCY_OPTIONS}
                value={values.currency}
                onChange={(value) => setFieldValue('currency', value)}
              />
              <GrantPreview firstName={firstName} />
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="ink" loading={isSubmitting}>
                  Save grant
                </Button>
              </div>
            </Form>
          )}
        </ValidatedForm>
      </Drawer>

      <ConfirmDialog
        open={!!grantToRemove}
        title="Remove this grant?"
        message={`${
          grantToRemove ? formatCount(grantToRemove.shares) : ''
        } shares will be removed from ${firstName}'s record.`}
        confirmLabel="Remove grant"
        variant="danger"
        isConfirming={isSaving}
        onConfirm={handleRemove}
        onCancel={() => setGrantToRemove(null)}
      />
    </PagePanel>
  )
}
