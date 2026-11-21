import React, { ReactNode } from 'react'

import { Avatar } from '@/components/ui/Avatar'

import styles from './DocumentPaper.module.scss'

type DocumentPaperProps = {
  companyName: string
  title: string
  dateLabel: string
  paragraphs: ReactNode[]
  signatory: string | null
  signerName: string
}

const nameParts = (name: string) => {
  const [first = '', second = ''] = name.trim().split(/\s+/)
  return { firstName: first, lastName: second }
}

/** One page of a contract as the employee will read it: logo, title, text and the signature block. */
export const DocumentPaper = ({
  companyName,
  title,
  dateLabel,
  paragraphs,
  signatory,
  signerName,
}: DocumentPaperProps) => (
  <article className={styles.paper} aria-label={title}>
    <header className={styles.brand}>
      <Avatar {...nameParts(companyName)} size="md" className={styles.mark} />
      <span>{companyName}</span>
    </header>
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.date}>{dateLabel}</p>
    <div className={styles.body}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
    <footer className={styles.signatures}>
      <div>
        <strong>For {companyName}</strong>
        <span>{signatory ?? ''}</span>
      </div>
      <div>
        <strong>Accepted by</strong>
        <span>{signerName} · Date</span>
      </div>
    </footer>
  </article>
)
