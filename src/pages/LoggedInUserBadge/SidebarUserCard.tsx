import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { HiChevronUpDown } from 'react-icons/hi2'

import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Typography'

import styles from './SidebarUserCard.module.scss'
import { UserMenu } from './UserMenu'
import { useUserIdentity } from './useUserIdentity'

export const SidebarUserCard = () => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { role, profile, firstName, lastName, fullName, imageUrl, roleLabel } =
    useUserIdentity()

  const subtitle =
    role === 'recruiter'
      ? profile?.activeOrganization?.name ?? roleLabel
      : roleLabel

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isOpen])

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={cn(styles.card, { [styles.open]: isOpen })}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Account menu for ${fullName}`}>
        <Avatar
          firstName={firstName}
          lastName={lastName}
          src={imageUrl}
          size="sm"
        />
        <span className={styles.identity}>
          <Text as="span" size="fs-md" weight="bolder" className={styles.line}>
            {fullName}
          </Text>
          {subtitle && (
            <Text as="span" size="fs-sm" color="muted" className={styles.line}>
              {subtitle}
            </Text>
          )}
        </span>
        <HiChevronUpDown className={styles.chevron} size={18} aria-hidden />
      </button>
      {isOpen && (
        <UserMenu placement="above" onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
}
