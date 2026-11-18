import React, { useEffect, useState } from 'react'
import { IoMdMenu } from 'react-icons/io'
import { LuX } from 'react-icons/lu'
import { Outlet, useLocation } from 'react-router-dom'

import styles from './DashboardShell.module.scss'

export const DASHBOARD_SCROLL_ROOT = 'dashboard'

type DashboardShellProps = {
  header: React.ReactNode
  sidebar: (close: () => void) => React.ReactNode
  sidebarOverlay?: React.ReactNode
  children?: React.ReactNode
}

export const DashboardShell = ({
  header,
  sidebar,
  sidebarOverlay,
  children,
}: DashboardShellProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const close = () => setIsOpen(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}>
          <IoMdMenu aria-hidden />
        </button>
        {header}
      </header>

      {isOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={close}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        aria-label="Main navigation">
        {sidebar(close)}
        {isOpen && (
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close menu"
            onClick={close}>
            <LuX aria-hidden />
          </button>
        )}
        {sidebarOverlay}
      </aside>

      <main className={styles.content} data-scroll-root={DASHBOARD_SCROLL_ROOT}>
        <Outlet />
      </main>
      {children}
    </div>
  )
}
