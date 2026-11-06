import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { LuChevronDown, LuLayoutDashboard, LuLogOut } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'

import styles from './AccountChip.module.scss'

type AccountChipProps = {
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  subtitle: string
}

export const AccountChip = ({
  firstName,
  lastName,
  avatarUrl,
  subtitle,
}: AccountChipProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const userRole = useAuthStore((state) => state.user?.userRole)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}>
        <Avatar
          firstName={firstName}
          lastName={lastName}
          src={avatarUrl}
          size="sm"
        />
        <span className={styles.text}>
          <span className={styles.name}>{name}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>
        <LuChevronDown
          className={cn(styles.chevron, open && styles.open)}
          aria-hidden
        />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            onClick={() => navigate(dashboardPathForRole(userRole))}>
            <LuLayoutDashboard aria-hidden />
            Go to dashboard
          </button>
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            onClick={() => logout()}>
            <LuLogOut aria-hidden />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
