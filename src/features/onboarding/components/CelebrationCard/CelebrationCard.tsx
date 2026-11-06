import React, { ReactNode } from 'react'

import auxHrLogo from '@/assets/aux_logo.png'
import { CheckList, CheckListItem } from '@/components/ui/CheckList'
import { Confetti } from '@/components/ui/Confetti'

import styles from './CelebrationCard.module.scss'

type CelebrationCardProps = {
  title: string
  lead: string
  items: CheckListItem[]
  actions: ReactNode
}

export const CelebrationCard = ({
  title,
  lead,
  items,
  actions,
}: CelebrationCardProps) => (
  <section className={styles.wrap}>
    <Confetti />
    <div className={styles.card}>
      <span className={styles.badge} aria-hidden>
        <img src={auxHrLogo} alt="" />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
      <CheckList variant="summary" items={items} className={styles.list} />
      <div className={styles.actions}>{actions}</div>
    </div>
  </section>
)
