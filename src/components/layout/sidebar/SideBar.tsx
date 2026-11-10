import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import logoMark from '@/components/features/landing/landingPageComponents/newLanding/assets/logo-mark.png'
import { Text } from '@/components/ui/Typography'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'

import { SidebarList } from '../lists'
import styles from './sidebar.module.scss'

export interface SideBarItem {
  name: string
  icon: ReactNode
  count?: number
  tag?: string
  link?: string
  end?: boolean
  tourId?: string
}

export interface SideBarSection {
  label?: string
  items: SideBarItem[]
}

interface SideBarProps {
  sections: SideBarSection[]
  handleClick?: () => void
  topSlot?: ReactNode
  promoSlot?: ReactNode
  footerSlot?: ReactNode
}

export const SideBar: React.FC<SideBarProps> = ({
  sections,
  handleClick,
  topSlot,
  promoSlot,
  footerSlot,
}) => {
  const userRole = useAuthStore((state) => state.user?.userRole)

  return (
    <aside className={styles.sideBar}>
      <div className={styles.logo} onClick={handleClick}>
        <Link to={dashboardPathForRole(userRole)}>
          <img src={logoMark} alt="AuxHR" />
        </Link>
      </div>

      <div className={styles.scroll}>
        {topSlot}
        <nav aria-label="Main">
          {sections.map((section, index) => (
            <div key={section.label ?? index} className={styles.section}>
              {section.label && (
                <Text
                  as="p"
                  size="fs-sm"
                  weight="bolder"
                  color="muted"
                  className={styles.sectionLabel}>
                  {section.label}
                </Text>
              )}
              {section.items.map((item) => (
                <SidebarList
                  key={item.name}
                  icon={item.icon}
                  name={item.name}
                  count={item.count}
                  tag={item.tag}
                  link={item.link}
                  end={item.end}
                  tourId={item.tourId}
                  onClick={handleClick}
                />
              ))}
            </div>
          ))}
        </nav>
        {promoSlot && <div className={styles.promo}>{promoSlot}</div>}
      </div>

      {footerSlot && <div className={styles.footer}>{footerSlot}</div>}
    </aside>
  )
}
