import '../TalentProfile/TalentProfileSidebar.scss'

import React, { useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import { recruiterNavSections } from '@/components/features/recruiter/SideBar/sidebarData'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader/DashboardHeader'
import { PlanPromoCard } from '@/features/dashboard/components/PlanPromoCard/PlanPromoCard'
import { useRecruiterNavCounts } from '@/features/dashboard/hooks/useRecruiterNavCounts'
import { ProductTourHost } from '@/features/product-tour'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { SidebarUserCard } from '../LoggedInUserBadge'
import { CompanyBanner } from './CompanyBanner/CompanyBanner'

const RecruiterProfileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { counts, showPeople } = useRecruiterNavCounts()
  const close = () => setIsOpen(false)

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
          <DashboardHeader audience="recruiter" />
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
            sections={recruiterNavSections(counts, showPeople)}
            handleClick={close}
            topSlot={<CompanyBanner onNavigate={close} />}
            promoSlot={<PlanPromoCard onNavigate={close} />}
            footerSlot={<SidebarUserCard />}
          />
          <button className="close" aria-label="Close menu" onClick={close}>
            {isOpen && <AiOutlineCloseCircle className="close-icon" />}
          </button>
        </div>
        <div className="outlet">
          <Outlet />
        </div>
        <ProductTourHost audience="recruiter" />
      </div>
    </ThemeProvider>
  )
}

export default RecruiterProfileSidebar
