import React, {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

import styles from './PillButton.module.scss'

type CommonProps = {
  variant?: 'solid' | 'outline'
  fullWidth?: boolean
  icon?: ReactNode
  children: ReactNode
}

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string
  }

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined
  }

export type PillButtonProps = LinkProps | ButtonProps

export const PillButton = ({
  variant = 'solid',
  fullWidth,
  icon,
  children,
  ...rest
}: PillButtonProps) => {
  const className = [
    styles.pill,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
  ].join(' ')
  const content = (
    <>
      {children}
      {icon && <span className={styles.icon}>{icon}</span>}
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a className={className} {...(rest as LinkProps)}>
        {content}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } = rest as ButtonProps
  return (
    <button type={type} className={className} {...buttonProps}>
      {content}
    </button>
  )
}
