import React, { ReactNode } from 'react'

import { EyebrowPill } from './EyebrowPill'
import styles from './PageHero.module.scss'

type PageHeroProps = {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
}

export const PageHero = ({ eyebrow, title, subtitle }: PageHeroProps) => (
  <section className={styles.hero}>
    {eyebrow && <EyebrowPill>{eyebrow}</EyebrowPill>}
    <h1 className={styles.title}>{title}</h1>
    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
  </section>
)
