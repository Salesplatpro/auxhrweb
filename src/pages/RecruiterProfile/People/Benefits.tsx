import { Form } from 'formik'
import React, { useState } from 'react'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlineGift } from 'react-icons/hi2'
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
import { useBenefits } from '@/features/people/hooks/useStaffData'
import { Benefit } from '@/features/people/types'

import styles from './PayTab.module.scss'

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
      render: (benefit) => <strong>{benefit.name}</strong>,
    },
    {
      key: 'description',
      header: 'Description',
      hideBelow: 768,
      render: (benefit) => benefit.description || '—',
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
              { label: 'Delete', onClick: () => setBenefitToDelete(benefit) },
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

  const addButton = (
    <Button onClick={() => setEditing('new')}>Add benefit</Button>
  )

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Benefits"
        lead="The benefits your company offers. Pick them for each person on their Pay tab."
        actions={
          <HeroAction onClick={() => setEditing('new')}>Add benefit</HeroAction>
        }
      />

      {hasError ? (
        <EmptyState
          title="Couldn't load benefits"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : (
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
              action={addButton}
            />
          }
        />
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add benefit' : 'Edit benefit'}>
        <ValidatedForm
          initialValues={{
            name: editing && editing !== 'new' ? editing.name : '',
            description:
              editing && editing !== 'new' ? editing.description ?? '' : '',
          }}
          enableReinitialize
          validationSchema={benefitSchema}
          onSubmit={handleSave}>
          {({ isSubmitting }) => (
            <Form className={styles.fields} noValidate>
              <FormikFocusOnError />
              <TextField name="name" label="Name" placeholder="Health cover" />
              <TextField
                name="description"
                label="Description"
                placeholder="HMO cover for the employee and two dependants"
              />
              <div className={styles.actions}>
                <Button type="submit" loading={isSubmitting}>
                  Save benefit
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
        open={!!benefitToDelete}
        title={`Delete ${benefitToDelete?.name ?? 'this benefit'}?`}
        message="It will be removed from every pay package that includes it."
        confirmLabel="Delete benefit"
        variant="danger"
        isConfirming={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setBenefitToDelete(null)}
      />
    </PageShell>
  )
}
