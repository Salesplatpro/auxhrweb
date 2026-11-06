import React from 'react'
import { BsBuilding } from 'react-icons/bs'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHero, pageHeroStyles } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  CompanyFormValues,
  EMPTY_COMPANY_FORM,
  toUpdatePayload,
} from '@/features/organizations/companyForm'
import { useMyOrganizations } from '@/features/organizations/hooks/useMyOrganizations'
import { useUpdateOrganization } from '@/features/organizations/hooks/useUpdateOrganization'

import listStyles from './Company.module.scss'
import { CompanyForm } from './CompanyForm'

const EditCompany = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { organizations, isLoading } = useMyOrganizations()
  const { updateOrganization, isUpdating } = useUpdateOrganization()

  const organization = organizations.find((org) => org.id === id)

  const goBack = () => navigate('/recruiterDashboard/company')

  const handleSubmit = async (values: CompanyFormValues) => {
    if (!organization) return
    const updated = await updateOrganization(
      organization.id,
      toUpdatePayload(values),
    )
    if (updated) {
      navigate('/recruiterDashboard/company')
    }
  }

  const initialValues: CompanyFormValues = organization
    ? {
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
      }
    : EMPTY_COMPANY_FORM

  return (
    <PageShell>
      <BackButton onClick={goBack} />
      {isLoading ? (
        <Spinner />
      ) : !organization ? (
        <div className={listStyles.empty}>
          <div className={listStyles.emptyIcon}>
            <BsBuilding size={24} />
          </div>
          <p className={listStyles.emptyTitle}>Company not found</p>
          <p className={listStyles.emptyCopy}>
            This company either does not exist or is not one you created.
          </p>
          <Button onClick={goBack}>Back to companies</Button>
        </div>
      ) : (
        <>
          <PageHero
            compact
            kicker="Edit workspace"
            title={organization.name}
            lead="Change the details candidates see. Locked fields stay as they were registered so verification remains consistent."
            chips={
              <>
                <span className={pageHeroStyles.chip}>Identity</span>
                <span className={pageHeroStyles.chip}>Contact</span>
                <span className={pageHeroStyles.chip}>Presence</span>
              </>
            }
          />

          <CompanyForm
            initialValues={initialValues}
            isSubmitting={isUpdating}
            onSubmit={handleSubmit}
            onCancel={goBack}
            organizationId={organization.id}
            logoUrl={organization.logoUrl}
            status={organization.status}
          />
        </>
      )}
    </PageShell>
  )
}

export default EditCompany
