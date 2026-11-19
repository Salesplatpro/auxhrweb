import React from 'react'

import { adminSidebarData } from '@/components/features/admin/SideBar/adminSidebarData'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { LoggedInUserBadge } from '../LoggedInUserBadge'
import styles from './AdminProfileSidebar.module.scss'

const ADMIN_SECTIONS = [{ items: adminSidebarData }]

const AdminProfileSidebar = () => (
  <ThemeProvider>
    <DashboardShell
      header={
        <div className={styles.header}>
          <LoggedInUserBadge />
        </div>
      }
      sidebar={(close) => (
        <SideBar sections={ADMIN_SECTIONS} handleClick={close} />
      )}
    />
  </ThemeProvider>
)

export default AdminProfileSidebar
