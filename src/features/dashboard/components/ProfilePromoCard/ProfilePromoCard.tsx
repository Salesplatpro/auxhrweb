import React from 'react'

import { SidebarPromoCard } from '@/components/layout/sidebar/SidebarPromoCard/SidebarPromoCard'
import { useProfile } from '@/features/profile/hooks/useProfile'

const PROFILE_PATH = '/talentDashboard/talentProfile'

type ProfilePromoCardProps = {
  onNavigate?: () => void
}

export const ProfilePromoCard = ({ onNavigate }: ProfilePromoCardProps) => {
  const { profile, isLoading } = useProfile()
  const percentage = profile?.profileCompletion?.percentage

  if (isLoading || percentage === undefined || percentage >= 100) return null

  return (
    <SidebarPromoCard
      title={`Profile ${Math.round(percentage)}% done`}
      body="Complete your profile to stand out to recruiters and get better matches."
      progress={percentage}
      actionLabel="Complete profile"
      actionTo={PROFILE_PATH}
      onAction={onNavigate}
    />
  )
}
