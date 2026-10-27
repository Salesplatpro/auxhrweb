import React, { ReactNode } from 'react'

import { IconTile } from './IconTile'
import styles from './InfoCard.module.scss'
import { SurfaceCard } from './SurfaceCard'

export type InfoCardAction = {
  label: string
  href?: string
  showArrow?: boolean
}

type InfoCardProps = {
  icon: ReactNode
  title: string
  body: ReactNode
  action?: InfoCardAction
}

export const InfoCard = ({ icon, title, body, action }: InfoCardProps) => (
  <SurfaceCard className={styles.card}>
    <IconTile>{icon}</IconTile>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.body}>{body}</p>
    {action?.href ? (
      <a href={action.href} className={styles.action}>
        {action.label}
        {action.showArrow && <span aria-hidden>→</span>}
      </a>
    ) : (
      action && <span className={styles.action}>{action.label}</span>
    )}
  </SurfaceCard>
)
