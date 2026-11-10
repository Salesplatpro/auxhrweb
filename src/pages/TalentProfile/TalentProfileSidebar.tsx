import './TalentProfileSidebar.scss'

import React, { useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import { talentNavSections } from '@/components/features/talent/SideBar/SideBarData'
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
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

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
      <div className="dashboard">
        <div className="dashboard-nav">
          <button
            className="menu"
            aria-label="Open menu"
            onClick={() => setIsOpen(!isOpen)}>
            {!isOpen && <IoMdMenu className="menu-icon" />}
          </button>
          <DashboardHeader audience="talent" />
        </div>

        {isOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={close}
          />
        )}
        <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
          <SideBar
            sections={sections}
            handleClick={close}
            promoSlot={<ProfilePromoCard onNavigate={close} />}
            footerSlot={<SidebarUserCard />}
          />

          <button className="close" aria-label="Close menu" onClick={close}>
            {isOpen && <AiOutlineCloseCircle className="close-icon" />}
          </button>

          {isLocked && <NavigationLockOverlay />}
        </div>

        <div className="outlet">
          <Outlet />
        </div>
        <ProductTourHost audience="talent" blocked={isLocked} />
      </div>
    </ThemeProvider>
  )
}

export default TalentProfileSidebar
