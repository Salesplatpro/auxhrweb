import './TalentProfileSidebar.scss'

import React, { useEffect, useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { HiOutlineBriefcase } from 'react-icons/hi2'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import { sidebarData as originalSidebarData } from '@/components/features/talent/SideBar/SideBarData'
import { SideBar } from '@/components/layout/sidebar/SideBar'
import { useMyWork } from '@/features/people/hooks/useStaffData'
import { myWorkPath } from '@/features/people/paths'
import { NavigationLockOverlay } from '@/features/pre-assessment/components/NavigationLockOverlay'
import { useAssessmentNavigationBlocker } from '@/features/pre-assessment/useAssessmentNavigationBlocker'
import { ProductTourHost } from '@/features/product-tour'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { LoggedInUserBadge } from '../LoggedInUserBadge'

interface TalentSidebarContext {
  setUnreadCount: (count: number) => void
}

const TalentProfileSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [currentSidebarData, setCurrentSidebarData] =
    useState(originalSidebarData)

  const { isLocked } = useAssessmentNavigationBlocker()
  const { records: workRecords } = useMyWork()
  const worksSomewhere = workRecords.length > 0

  useEffect(() => {
    const updatedData = originalSidebarData.map((item) => {
      if (item.name === 'Inbox') {
        return { ...item, count: unreadCount }
      }
      return item
    })
    if (worksSomewhere) {
      updatedData.splice(1, 0, {
        name: 'My work',
        icon: <HiOutlineBriefcase size={20} />,
        link: myWorkPath,
      })
    }
    setCurrentSidebarData(updatedData)
  }, [unreadCount, worksSomewhere])

  return (
    <ThemeProvider>
      <div className="dashboard">
        <div className="dashboard-nav">
          <button className="menu" onClick={() => setIsOpen(!isOpen)}>
            {!isOpen && <IoMdMenu className="menu-icon" />}
          </button>
          <LoggedInUserBadge />
        </div>

        {isOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          />
        )}
        <div className={`sidebar-container ${isOpen ? 'open' : 'closed'}`}>
          <SideBar
            sideBarData={currentSidebarData}
            handleClick={() => setIsOpen(false)}
          />

          <button className="close" onClick={() => setIsOpen(!isOpen)}>
            {isOpen && <AiOutlineCloseCircle className="close-icon" />}
          </button>

          {isLocked && <NavigationLockOverlay />}
        </div>

        <div className="outlet">
          <Outlet context={{ setUnreadCount } as TalentSidebarContext} />
        </div>
        <ProductTourHost audience="talent" blocked={isLocked} />
      </div>
    </ThemeProvider>
  )
}

export default TalentProfileSidebar
