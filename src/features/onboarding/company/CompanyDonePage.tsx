import React from 'react'
import { LuArrowRight } from 'react-icons/lu'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { getPlanDisplayName } from '@/features/pricing/utils/getPlanDisplayName'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { CelebrationCard } from '../components/CelebrationCard'
import { OnboardingShell } from '../components/OnboardingShell'
import { OnboardingDoneState } from '../done/OnboardingDoneState'
import { ONBOARDING_PATHS } from '../paths'

const DASHBOARD = '/recruiterDashboard/dashboard'
const POST_JOB = '/recruiterDashboard/postjob'

export const CompanyDonePage = () => {
  const navigate = useNavigate()
  const { profile, isLoading, error, mutate } = useProfile()

  if (!profile) {
    return (
      <OnboardingDoneState
        isLoading={isLoading || !error}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  const organization = profile.activeOrganization
  if (!organization) {
    return <Navigate to={ONBOARDING_PATHS.company} replace />
  }

  return (
    <OnboardingShell
      account={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.profileImageUrl,
        subtitle: `Owner · ${organization.name}`,
      }}>
      <CelebrationCard
        title={`You're all set, ${profile.firstName ?? 'there'}`}
        lead={`${organization.name} is ready to hire. Post your first job and AuxHR will screen every applicant for you.`}
        items={[
          { label: 'Account created', value: 'Done' },
          { label: 'Email verified', value: 'Done' },
          { label: 'Company set up', value: organization.name },
          {
            label: 'Plan',
            value: getPlanDisplayName(organization.billingPlan),
          },
        ]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="xl"
              pill
              stretch
              onClick={() => navigate(DASHBOARD)}>
              Go to dashboard
            </Button>
            <Button
              type="button"
              variant="ink"
              size="xl"
              pill
              stretch
              iconEnd={<LuArrowRight />}
              onClick={() => navigate(POST_JOB)}>
              Post your first job
            </Button>
          </>
        }
      />
    </OnboardingShell>
  )
}

export default CompanyDonePage
