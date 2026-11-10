import '../TalentProfile/TalentProfileSidebar.scss'

import React, { useState } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { IoMdMenu } from 'react-icons/io'
import { Outlet } from 'react-router-dom'

import { adminSidebarData } from '@/components/features/admin/SideBar/adminSidebarData'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { LoggedInUserBadge } from '../LoggedInUserBadge'

const ADMIN_SECTIONS = [{ items: adminSidebarData }]

const AdminProfileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
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
          <LoggedInUserBadge />
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
          <SideBar sections={ADMIN_SECTIONS} handleClick={close} />
          <button className="close" aria-label="Close menu" onClick={close}>
            {isOpen && <AiOutlineCloseCircle className="close-icon" />}
          </button>
        </div>
        <div className="outlet">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default AdminProfileSidebar
