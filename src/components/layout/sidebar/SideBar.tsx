import React, { ReactNode } from 'react'
import { CgProfile } from 'react-icons/cg'
import { Link } from 'react-router-dom'

import auxHrLogo from '@/assets/aux_logo.png'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  dashboardPathForRole,
  feedbackPathForRole,
} from '@/features/auth/utils/dashboardPath'

import { SidebarList } from '../lists'
import styles from './sidebar.module.scss'

interface SideBarItem {
  name: string
  icon: ReactNode
  count?: number
  link?: string
  end?: boolean
  tourId?: string
}

interface sideBarProps {
  sideBarData: SideBarItem[]
  handleClick?: () => void
  /** Optional content rendered between the logo and the nav list (e.g. a company switcher). */
  topSlot?: ReactNode
  /** Extra links pinned to the bottom of the sidebar, above "Leave us feedback". */
  footerItems?: SideBarItem[]
}

export const SideBar: React.FC<sideBarProps> = ({
  sideBarData,
  handleClick,
  topSlot,
  footerItems = [],
}) => {
  const userRole = useAuthStore((state) => state.user?.userRole)
  const homePath = dashboardPathForRole(userRole)
  const feedbackPath = feedbackPathForRole(userRole)

  return (
    <div className={styles.sideBarContainer}>
      <div>
        <div className={styles.imageContainer}>
          <Link to={homePath}>
            <img src={auxHrLogo} alt="Aux HR Logo" />
          </Link>
        </div>

        {topSlot}

        <div className={styles.sidebarList}>
          {sideBarData.map((data, index) => (
            <SidebarList
              key={index}
              icon={data.icon}
              name={data.name}
              count={data.count}
              link={data.link}
              end={data.end}
              tourId={data.tourId}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
      <div>
        {footerItems.map((item) => (
          <SidebarList
            key={item.name}
            icon={item.icon}
            name={item.name}
            link={item.link}
            end={item.end}
            tourId={item.tourId}
            onClick={handleClick}
          />
        ))}
        <SidebarList
          icon={<CgProfile size={20} />}
          name="Leave us feedback"
          link={feedbackPath}
          onClick={handleClick}
        />
      </div>
    </div>
  )
}
