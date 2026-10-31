import { Form } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { PROFILE_CURRENCY_OPTIONS, Select } from '@/components/forms/Select'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { VestingTimeline } from '@/features/people/components/VestingTimeline'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { PayCurrency, ShareGrant, StaffMember } from '@/features/people/types'
import { todayDateOnly } from '@/features/people/utils/formatDate'
import { formatCount } from '@/features/people/utils/formatMoney'
import { nameParts } from '@/features/people/utils/nameParts'

import styles from './PayTab.module.scss'

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

const EMPTY_GRANT: GrantFormValues = {
  shares: '',
  grantedOn: todayDateOnly(),
  cliffMonths: 12,
  vestingMonths: 48,
  strikePrice: '',
  currency: 'NGN',
}

interface ShareOptionsCardProps {
  organizationId: string
  staff: StaffMember
  grants: ShareGrant[]
}

export const ShareOptionsCard: React.FC<ShareOptionsCardProps> = ({
  organizationId,
  staff,
  grants,
}) => {
  const { addGrant, removeGrant, isSaving } = useStaffActions(organizationId)
  const [isAdding, setIsAdding] = useState(false)
  const [grantToRemove, setGrantToRemove] = useState<ShareGrant | null>(null)
  const isEnded = staff.status === 'ended'
  const { firstName } = nameParts(staff.fullName)

  const handleAdd = async (values: GrantFormValues) => {
    const created = await addGrant(staff.id, {
      shares: Number(values.shares),
      grantedOn: values.grantedOn,
      cliffMonths: Number(values.cliffMonths),
      vestingMonths: Number(values.vestingMonths),
      strikePrice: Number(values.strikePrice),
      currency: values.currency,
    })
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
      action={
        !isEnded && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            Add grant
          </Button>
        )
      }>
      {grants.length === 0 ? (
        <p className={styles.previewEmpty}>No share options granted yet.</p>
      ) : (
        <ul className={styles.grants}>
          {grants.map((grant) => (
            <li key={grant.id} className={styles.grant}>
              <div className={styles.grantHeader}>
                <h4>{formatCount(grant.shares)} shares</h4>
                {!isEnded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setGrantToRemove(grant)}>
                    Remove
                  </Button>
                )}
              </div>
              <VestingTimeline grant={grant} ownerFirstName={firstName} />
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add share grant"
        subtitle={`Shares granted to ${staff.fullName}`}>
        <ValidatedForm
          initialValues={EMPTY_GRANT}
          validationSchema={grantSchema}
          onSubmit={handleAdd}>
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className={styles.fields} noValidate>
              <FormikFocusOnError />
              <TextField
                name="shares"
                label="Number of shares"
                type="number"
                placeholder="10000"
              />
              <TextField name="grantedOn" label="Grant date" type="date" />
              <div className={styles.row}>
                <TextField
                  name="cliffMonths"
                  label="Cliff (months)"
                  type="number"
                  hint="Months before any shares are theirs"
                />
                <TextField
                  name="vestingMonths"
                  label="Vesting period (months)"
                  type="number"
                />
              </div>
              <div className={styles.row}>
                <TextField
                  name="strikePrice"
                  label="Strike price per share"
                  type="number"
                  placeholder="50"
                />
                <Select
                  name="currency"
                  label="Currency"
                  options={PROFILE_CURRENCY_OPTIONS}
                  value={values.currency}
                  onChange={(value) => setFieldValue('currency', value)}
                />
              </div>
              <div className={styles.actions}>
                <Button type="submit" loading={isSubmitting}>
                  Add grant
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}>
                  Cancel
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
