import '../TalentProfile/TalentProfileSidebar.scss'

import React, { useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import {
  sidebarData,
  sidebarFooterData,
} from '@/components/features/recruiter/SideBar/sidebarData'
import { ProductTourHost } from '@/features/product-tour'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { LoggedInUserBadge } from '../LoggedInUserBadge'
import { CompanyBanner } from './CompanyBanner/CompanyBanner'

const RecruiterProfileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

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
            sideBarData={sidebarData}
            handleClick={() => setIsOpen(false)}
            topSlot={<CompanyBanner onNavigate={() => setIsOpen(false)} />}
            footerItems={sidebarFooterData}
          />
          <button className="close" onClick={() => setIsOpen(!isOpen)}>
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
