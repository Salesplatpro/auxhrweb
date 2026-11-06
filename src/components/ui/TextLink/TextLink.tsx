import cn from 'classnames'
import React, { ReactNode } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import styles from './TextLink.module.scss'

type TextLinkProps = {
  to: LinkProps['to']
  icon?: ReactNode
  tone?: 'link' | 'muted'
  external?: boolean
  className?: string
  children: ReactNode
}

export const TextLink = ({
  to,
  icon,
  tone = 'link',
  external = false,
  className,
  children,
}: TextLinkProps) => {
  const classes = cn(styles.link, styles[tone], className)
  const content = (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </>
  )

  if (external && typeof to === 'string') {
    return (
      <a
        href={to}
        className={classes}
        target="_blank"
        rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link to={to} className={classes}>
      {content}
    </Link>
  )
}
