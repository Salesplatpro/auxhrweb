import React from 'react'

import { SidebarPromoCard } from '@/components/layout/sidebar/SidebarPromoCard/SidebarPromoCard'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { usePricingCatalog } from '@/features/pricing/hooks/usePricingCatalog'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getPlanDisplayName } from '@/features/pricing/utils/getPlanDisplayName'
import { useProfile } from '@/features/profile/hooks/useProfile'

const PLAN_PATH = '/recruiterDashboard/plan'

type PlanPromoCardProps = {
  onNavigate?: () => void
}

export const PlanPromoCard = ({ onNavigate }: PlanPromoCardProps) => {
  const { profile } = useProfile()
  const organizationId = profile?.activeOrganizationId ?? null
  const { usage } = useOrganizationUsage(organizationId)
  const { catalog } = usePricingCatalog()

  if (!organizationId) return null

  const { billingPlan } = getActiveOrganizationBilling(profile)
  const planName = getPlanDisplayName(billingPlan, catalog)
  const slots = usage?.meters.find((meter) => meter.key === 'job_listings')
  const limit = slots?.limit ?? null
  const used = slots?.used ?? 0

  return (
    <SidebarPromoCard
      title={`${planName} plan`}
      body={
        limit === null
          ? 'Unlimited job posts.'
          : `${used} of ${limit} job post slots used.`
      }
      progress={
        limit === null ? undefined : limit > 0 ? (used / limit) * 100 : 100
      }
      actionLabel="Upgrade Plan"
      actionTo={PLAN_PATH}
      onAction={onNavigate}
    />
  )
}
