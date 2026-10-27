import React, { ReactNode } from 'react'

import styles from './DocSection.module.scss'

type DocSectionProps = {
  id: string
  index: number
  title: string
  children: ReactNode
}

export const DocSection = ({ id, index, title, children }: DocSectionProps) => (
  <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
    <p className={styles.eyebrow}>Section {String(index).padStart(2, '0')}</p>
    <h2 id={`${id}-title`} className={styles.title}>
      {title}
    </h2>
    <div className={styles.body}>{children}</div>
  </section>
)
