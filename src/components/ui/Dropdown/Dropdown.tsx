import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import styles from './Dropdown.module.scss'

export interface DropdownItem {
  key?: string
  label: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  /** Extra class for the trigger button, for placing it on a surface the default style doesn't suit. */
  triggerClassName?: string
  items: DropdownItem[]
  align?: 'left' | 'right'
  /** Set to false for checkbox-style menus (e.g. a column picker) where the menu should stay open after each selection. */
  closeOnSelect?: boolean
}

const VIEWPORT_GUTTER = 8

export const Dropdown = ({
  trigger,
  triggerClassName,
  items,
  align = 'right',
  closeOnSelect = true,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const triggerEl = containerRef.current
    if (!triggerEl) return
    const rect = triggerEl.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? 0
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = menuHeight > 0 && spaceBelow < menuHeight + VIEWPORT_GUTTER
    const next: React.CSSProperties = {
      position: 'fixed',
      maxWidth: `calc(100vw - ${VIEWPORT_GUTTER * 2}px)`,
    }
    if (openUp) {
      next.bottom = Math.max(window.innerHeight - rect.top + 4, VIEWPORT_GUTTER)
    } else {
      next.top = rect.bottom + 4
    }
    if (align === 'left') {
      next.left = Math.max(rect.left, VIEWPORT_GUTTER)
    } else {
      next.right = Math.max(window.innerWidth - rect.right, VIEWPORT_GUTTER)
    }
    setMenuStyle(next)
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
    const frame = window.requestAnimationFrame(updatePosition)
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, align])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    const handleDismiss = () => setIsOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleDismiss)
    window.addEventListener('scroll', handleDismiss, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleDismiss)
      window.removeEventListener('scroll', handleDismiss, true)
    }
  }, [isOpen])

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return
    item.onClick()
    if (closeOnSelect) setIsOpen(false)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={[styles.trigger, triggerClassName].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={menuStyle}
            role="menu">
            {items.map((item, index) => (
              <button
                key={item.key ?? index}
                type="button"
                className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}>
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
