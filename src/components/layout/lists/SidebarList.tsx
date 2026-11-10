import cn from 'classnames'
import React, { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { CountBadge } from '@/components/ui/Badge'
import { Pill } from '@/components/ui/Pill'
import { Text } from '@/components/ui/Typography'

import styles from './sidebarList.module.scss'

type SidebarListProps = {
  icon: ReactNode
  name: string
  count?: number
  tag?: string
  onClick?: () => void
  link?: string
  /** Exact-match the route; set false for items that own nested routes so they stay highlighted on them. */
  end?: boolean
  /** Anchor for the product tour (`data-tour`). */
  tourId?: string
}

export const SidebarList = ({
  icon,
  name,
  count,
  tag,
  onClick,
  link,
  end = true,
  tourId,
}: SidebarListProps) => {
  const content = (
    <>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <Text as="span" size="fs-md" weight="bold" className={styles.name}>
        {name}
      </Text>
      {tag && (
        <Pill tone="success" size="sm">
          {tag}
        </Pill>
      )}
      <CountBadge item={count} />
    </>
  )

  if (!link) {
    return (
      <div className={styles.item} onClick={onClick} data-tour={tourId}>
        {content}
      </div>
    )
  }

  return (
    <NavLink
      to={link}
      end={end}
      data-tour={tourId}
      className={({ isActive }) => cn(styles.item, isActive && styles.active)}
      onClick={onClick}>
      {content}
    </NavLink>
  )
}
