import 'react-responsive-modal/styles.css'

import { Form } from 'formik'
import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineGift, HiOutlineTrash } from 'react-icons/hi2'
import { Modal } from 'react-responsive-modal'
import * as Yup from 'yup'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import TextField from '@/components/forms/TextField'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { ColumnDef, DataTable, TableActions } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { useBenefits } from '@/features/people/hooks/useStaffData'
import { peoplePaths } from '@/features/people/paths'
import { Benefit } from '@/features/people/types'
import { formatCount } from '@/features/people/utils/formatMoney'

import styles from './Benefits.module.scss'

const benefitSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Name the benefit')
    .max(120, 'Keep the name under 120 characters'),
  description: Yup.string()
    .trim()
    .max(500, 'Keep the description under 500 characters'),
})

type EditingBenefit = Benefit | 'new' | null

const givenToLabel = (count: number) =>
  count === 0
    ? 'Nobody'
    : `${formatCount(count)} ${count === 1 ? 'person' : 'people'}`

const deleteMessage = (count: number) =>
  count === 0
    ? 'Nobody has it right now. It will be removed from the list.'
    : `${givenToLabel(count)} ${
        count === 1 ? 'has' : 'have'
      } it right now. It will be removed from their pay.`

export const Benefits = () => {
  const { organizationId } = usePeopleAccess()
  const { benefits, isLoading, hasError } = useBenefits(organizationId)
  const { saveBenefit, removeBenefit, isSaving } =
    useStaffActions(organizationId)
  const [editing, setEditing] = useState<EditingBenefit>(null)
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null)

  const columns: ColumnDef<Benefit>[] = [
    {
      key: 'name',
      header: 'Benefit',
      render: (benefit) => (
        <span className={styles.benefit}>
          <strong>{benefit.name}</strong>
          {benefit.description && (
            <span className={styles.description}>{benefit.description}</span>
          )}
        </span>
      ),
    },
    {
      key: 'givenTo',
      header: 'Given to',
      render: (benefit) => givenToLabel(benefit.givenTo),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (benefit) => (
        <TableActions>
          <Dropdown
            trigger={<BsThreeDotsVertical aria-label="Benefit actions" />}
            items={[
              { label: 'Edit', onClick: () => setEditing(benefit) },
              {
                label: 'Delete',
                danger: true,
                onClick: () => setBenefitToDelete(benefit),
              },
            ]}
          />
        </TableActions>
      ),
    },
  ]

  const handleSave = async (values: { name: string; description: string }) => {
    const saved = await saveBenefit(
      {
        name: values.name.trim(),
        description: values.description.trim() || null,
      },
      editing && editing !== 'new' ? editing.id : undefined,
    )
    if (saved) setEditing(null)
  }

  const handleDelete = async () => {
    if (benefitToDelete && (await removeBenefit(benefitToDelete))) {
      setBenefitToDelete(null)
    }
  }

  const existing = editing !== null && editing !== 'new' ? editing : null

  return (
    <PageShell wide>
      <PageHeaderTitle
        breadcrumbs={[
          { label: 'People', to: peoplePaths.employees },
          { label: 'Benefits' },
        ]}
        title="Benefits"
        description="The company's benefit list. Tick them on each person's Pay tab."
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load benefits"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
        <PagePanel
          flush
          title="All benefits"
          hint={`${formatCount(benefits.length)} ${
            benefits.length === 1 ? 'benefit' : 'benefits'
          }`}
          action={
            <Button onClick={() => setEditing('new')}>Add benefit</Button>
          }>
          <DataTable
            columns={columns}
            data={benefits}
            isLoading={isLoading}
            getRowKey={(benefit) => benefit.id}
            ariaLabel="Benefits"
            showRowNumber={false}
            emptyState={
              <EmptyState
                icon={<HiOutlineGift />}
                title="No benefits yet"
                description="Add the benefits you offer, for example health cover, leave days or transport."
              />
            }
          />
        </PagePanel>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        center
        classNames={{ overlay: 'dashboard-modal-overlay' }}>
        <div className={styles.modal}>
          <div>
            <h3 className={styles.title}>
              {existing ? 'Edit benefit' : 'Add benefit'}
            </h3>
            <p className={styles.subtitle}>
              It will show on everyone&apos;s Pay tab to tick.
            </p>
          </div>
          <ValidatedForm
            initialValues={{
              name: existing?.name ?? '',
              description: existing?.description ?? '',
            }}
            enableReinitialize
            validationSchema={benefitSchema}
            onSubmit={handleSave}>
            {({ isSubmitting }) => (
              <Form className={styles.form} noValidate>
                <FormikFocusOnError />
                <TextField
                  name="name"
                  label="Name"
                  placeholder="Health cover"
                />
                <TextField
                  name="description"
                  label="Short description (optional)"
                  placeholder="HMO cover for the employee and two dependants"
                />
                <div className={styles.actions}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    {existing ? 'Save benefit' : 'Add benefit'}
                  </Button>
                </div>
              </Form>
            )}
          </ValidatedForm>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!benefitToDelete}
        title={`Delete ${benefitToDelete?.name ?? 'this benefit'}?`}
        icon={
          <span className={styles.dangerIcon}>
            <HiOutlineTrash aria-hidden />
          </span>
        }
        description={deleteMessage(benefitToDelete?.givenTo ?? 0)}
        confirmLabel="Delete"
        variant="danger"
        isConfirming={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setBenefitToDelete(null)}
      />
    </PageShell>
  )
}
