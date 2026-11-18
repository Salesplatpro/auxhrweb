import React from 'react'

import { talentNavSections } from '@/components/features/talent/SideBar/SideBarData'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SideBar } from '@/components/layout/sidebar/SideBar'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader/DashboardHeader'
import { ProfilePromoCard } from '@/features/dashboard/components/ProfilePromoCard/ProfilePromoCard'
import { useTalentChatSessions } from '@/features/messaging/hooks/useTalentChatSessions'
import { useMyWork } from '@/features/people/hooks/useStaffData'
import { NavigationLockOverlay } from '@/features/pre-assessment/components/NavigationLockOverlay'
import { useAssessmentNavigationBlocker } from '@/features/pre-assessment/useAssessmentNavigationBlocker'
import { ProductTourHost } from '@/features/product-tour'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SidebarUserCard } from '../LoggedInUserBadge'

const TalentProfileSidebar: React.FC = () => {
  const { isLocked } = useAssessmentNavigationBlocker()
  const { records: workRecords } = useMyWork()
  const { unreadCount } = useTalentChatSessions()
  const { profile } = useProfile()
  const preAssessmentPending = !!profile && profile.prescreeningScore == null

  const sections = talentNavSections(
    { messages: unreadCount, assessments: preAssessmentPending ? 1 : 0 },
    workRecords.length > 0,
  )

  return (
    <ThemeProvider>
      <DashboardShell
        header={<DashboardHeader audience="talent" />}
        sidebar={(close) => (
          <SideBar
            sections={sections}
            handleClick={close}
            promoSlot={<ProfilePromoCard onNavigate={close} />}
            footerSlot={<SidebarUserCard />}
          />
        )}
        sidebarOverlay={isLocked ? <NavigationLockOverlay /> : null}>
        <ProductTourHost audience="talent" blocked={isLocked} />
      </DashboardShell>
    </ThemeProvider>
  )
}

export default TalentProfileSidebar
