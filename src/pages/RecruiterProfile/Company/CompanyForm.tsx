import { Form, useFormikContext } from 'formik'
import React from 'react'

import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import {
  CompanyFormValues,
  CompanyPreviewCard,
  ContactFields,
  editCompanySchema,
  IdentityFields,
  PresenceFields,
} from '@/features/organizations/companyForm'
import { OrganizationStatus } from '@/features/organizations/types'

import styles from './CompanyForm.module.scss'
import { CompanyLogoUpload } from './CompanyLogoUpload'

const LivePreview = ({
  logoUrl,
  status,
}: {
  logoUrl?: string | null
  status: OrganizationStatus
}) => {
  const { values } = useFormikContext<CompanyFormValues>()
  return (
    <aside className={styles.preview}>
      <p className={styles.previewLabel}>How it will look</p>
      <CompanyPreviewCard values={values} logoUrl={logoUrl} status={status} />
    </aside>
  )
}

interface CompanyFormProps {
  initialValues: CompanyFormValues
  isSubmitting: boolean
  onSubmit: (values: CompanyFormValues) => void | Promise<void>
  onCancel: () => void
  organizationId: string
  logoUrl?: string | null
  status: OrganizationStatus
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
  organizationId,
  logoUrl,
  status,
}) => (
  <ValidatedForm
    initialValues={initialValues}
    enableReinitialize
    validationSchema={editCompanySchema}
    onSubmit={onSubmit}>
    <div className={styles.layout}>
      <Form className={styles.form} noValidate>
        <FormikFocusOnError />
        <PagePanel
          title="Company identity"
          hint="This is the name and location candidates see on your jobs.">
          <div className={styles.fields}>
            <IdentityFields mode="edit" />
          </div>
        </PagePanel>
        <PagePanel
          title="Contact"
          hint="Used for verification and so the team can reach you.">
          <div className={styles.fields}>
            <ContactFields mode="edit" />
          </div>
        </PagePanel>
        <PagePanel
          title="Online presence"
          hint="Help candidates recognise your brand and confirm you are real.">
          <div className={styles.fields}>
            <PresenceFields mode="edit" />
            <CompanyLogoUpload
              organizationId={organizationId}
              companyName={initialValues.name}
              logoUrl={logoUrl}
            />
          </div>
        </PagePanel>

        <div className={styles.actions}>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </Form>
      <LivePreview logoUrl={logoUrl} status={status} />
    </div>
  </ValidatedForm>
)
