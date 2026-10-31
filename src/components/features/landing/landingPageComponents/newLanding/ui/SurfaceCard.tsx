import React, { ReactNode } from 'react'

import styles from './SurfaceCard.module.scss'

type SurfaceCardProps = {
  children: ReactNode
  className?: string
}

export const SurfaceCard = ({ children, className }: SurfaceCardProps) => (
  <div className={[styles.card, className ?? ''].join(' ')}>{children}</div>
)
