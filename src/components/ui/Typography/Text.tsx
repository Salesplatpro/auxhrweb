import cn from 'classnames'
import React, { ReactNode } from 'react'

import styles from './Text.module.scss'

type TextSize =
  | 'fs-xs'
  | 'fs-sm'
  | 'fs-md'
  | 'fs-lg'
  | 'fs-xl'
  | 'fs-2xl'
  | 'fs-3xl'
  | 'fs-4xl'
  | 'fs-5xl'

type TextColor =
  | 'default'
  | 'primary'
  | 'tag'
  | 'secondary'
  | 'white'
  | 'hero'
  | 'muted'

type TextWeight = 'normal' | 'bold' | 'bolder'

type TextProps = {
  children: ReactNode
  size?: TextSize
  color?: TextColor
  weight?: TextWeight
  as?: 'div' | 'p' | 'span'
  onClick?: () => void
  className?: string
}

export const Text = ({
  children,
  size = 'fs-md',
  color = 'default',
  weight = 'normal',
  as: Component = 'div',
  onClick,
  className,
}: TextProps) => (
  <Component
    className={cn(styles[size], styles[color], styles[weight], className)}
    onClick={onClick}>
    {children}
  </Component>
)
