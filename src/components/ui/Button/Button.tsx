import cn from 'classnames'
import React, { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'

import { Spinner } from '@/components/ui/Spinner'

import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ink' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg' | 'wide' | 'xl'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  iconEnd?: ReactNode
  pill?: boolean
  stretch?: boolean
} & ComponentPropsWithoutRef<'button'>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconEnd,
      pill = false,
      stretch = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pill && styles.pill,
        stretch && styles.stretch,
        className,
      )}
      {...rest}>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {children}
          {iconEnd && <span className={styles.icon}>{iconEnd}</span>}
        </>
      )}
    </button>
  ),
)

Button.displayName = 'Button'
