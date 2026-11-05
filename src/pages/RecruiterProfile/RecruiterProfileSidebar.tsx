import '../TalentProfile/TalentProfileSidebar.scss'

import React, { useMemo, useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { HiOutlineUsers } from 'react-icons/hi2'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import {
  sidebarData,
  sidebarFooterData,
} from '@/components/features/recruiter/SideBar/sidebarData'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { peoplePaths } from '@/features/people/paths'
import { ProductTourHost } from '@/features/product-tour'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { LoggedInUserBadge } from '../LoggedInUserBadge'
import { CompanyBanner } from './CompanyBanner/CompanyBanner'

const RecruiterProfileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { hasPeopleAccess } = usePeopleAccess()

  const navItems = useMemo(
    () =>
      hasPeopleAccess
        ? [
            ...sidebarData,
            {
              name: 'People',
              icon: <HiOutlineUsers size={20} />,
              link: peoplePaths.root,
              end: false,
            },
          ]
        : sidebarData,
    [hasPeopleAccess],
  )

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
            sideBarData={navItems}
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
