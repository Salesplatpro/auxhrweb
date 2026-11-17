import { Form, useFormikContext } from 'formik'
import React from 'react'

import { TextArea, TextInput } from '@/components/forms'
import { FormikFocusOnError } from '@/components/forms/FormikFocusOnError'
import { Select } from '@/components/forms/Select'
import { ValidatedForm } from '@/components/forms/ValidatedForm'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import {
  COMPANY_SIZES,
  ContactFields,
  EditCompanyFormValues,
  editCompanySchema,
  EMPTY_COMPANY_FORM,
  IdentityFields,
  MAX_COMPANY_ABOUT_LENGTH,
  MAX_COMPANY_VALUES_LENGTH,
  PresenceFields,
  toUpdatePayload,
} from '@/features/organizations/companyForm'
import { useUpdateOrganization } from '@/features/organizations/hooks/useUpdateOrganization'
import { Organization } from '@/features/organizations/types'

import { CompanyLogoUpload } from './CompanyLogoUpload'
import styles from './EditCompanyDrawer.module.scss'

const FORM_ID = 'edit-company-form'

const SIZE_OPTIONS = COMPANY_SIZES.map((size) => ({ value: size, label: size }))

const toFormValues = (organization: Organization): EditCompanyFormValues => ({
  ...EMPTY_COMPANY_FORM,
  name: organization.name ?? '',
  domain: organization.domain
    ? `@${organization.domain.replace(/^@/, '')}`
    : '',
  email: organization.email ?? '',
  phone: organization.phone ?? '',
  address: organization.address ?? '',
  industry: organization.industry ?? '',
  website: organization.website ?? '',
  linkedin: organization.linkedin ?? '',
  facebook: organization.facebook ?? '',
  twitter: organization.twitter ?? '',
  size: organization.size ?? '',
  foundedYear: organization.foundedYear ? String(organization.foundedYear) : '',
  about: organization.about ?? '',
  companyValues: organization.companyValues ?? '',
})

const fieldError = (
  formik: ReturnType<typeof useFormikContext<EditCompanyFormValues>>,
  name: keyof EditCompanyFormValues,
) => (formik.touched[name] ? formik.errors[name] : undefined)

const AboutFields = () => {
  const formik = useFormikContext<EditCompanyFormValues>()
  return (
    <>
      <div className={styles.pair}>
        <Select
          name="size"
          label="Company size"
          placeholder="Select a size"
          options={SIZE_OPTIONS}
          value={formik.values.size}
          onChange={(value) => formik.setFieldValue('size', value)}
          error={fieldError(formik, 'size')}
        />
        <TextInput
          name="foundedYear"
          label="foundedYear"
          title="Founded"
          inputMode="numeric"
          placeholder="2019"
          value={formik.values.foundedYear}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </div>
      <TextArea
        name="about"
        title="About the company"
        rows={4}
        maxLength={MAX_COMPANY_ABOUT_LENGTH}
        value={formik.values.about}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={fieldError(formik, 'about')}
      />
      <div className={styles.values}>
        <TextArea
          name="companyValues"
          title="Company values"
          rows={4}
          maxLength={MAX_COMPANY_VALUES_LENGTH}
          placeholder="We share work early and ask for feedback."
          value={formik.values.companyValues}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={fieldError(formik, 'companyValues')}
          footer={
            <>
              Describe how your team works, for example &ldquo;We share work
              early and ask for feedback.&rdquo; Culture-fit questions are
              written from this.
            </>
          }
        />
      </div>
    </>
  )
}

interface EditCompanyDrawerProps {
  open: boolean
  organization: Organization
  onClose: () => void
}

export const EditCompanyDrawer: React.FC<EditCompanyDrawerProps> = ({
  open,
  organization,
  onClose,
}) => {
  const { updateOrganization, isUpdating } = useUpdateOrganization()

  const handleSubmit = async (values: EditCompanyFormValues) => {
    const payload = toUpdatePayload(values)
    const valuesChanged =
      (payload.companyValues ?? null) !== (organization.companyValues ?? null)
    const updated = await updateOrganization(
      organization.id,
      payload,
      valuesChanged
        ? {
            title: 'Company values saved',
            description: 'New culture-fit tests will use them.',
          }
        : undefined,
    )
    if (updated) onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit company"
      subtitle="Shown to candidates on every job post"
      footer={
        <div className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={isUpdating}>
            Save changes
          </Button>
        </div>
      }>
      <ValidatedForm
        initialValues={toFormValues(organization)}
        validationSchema={editCompanySchema}
        onSubmit={handleSubmit}>
        <Form id={FORM_ID} className={styles.form} noValidate>
          <FormikFocusOnError />
          <IdentityFields mode="edit" />
          <AboutFields />
          <ContactFields mode="edit" />
          <PresenceFields mode="edit" />
          <CompanyLogoUpload
            organizationId={organization.id}
            companyName={organization.name}
            logoUrl={organization.logoUrl}
          />
        </Form>
      </ValidatedForm>
    </Drawer>
  )
}
