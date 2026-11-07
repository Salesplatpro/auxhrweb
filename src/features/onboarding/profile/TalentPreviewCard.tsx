import React from 'react'
import { LuBriefcase, LuFileText, LuMapPin } from 'react-icons/lu'

import { Avatar } from '@/components/ui/Avatar'
import { Pill } from '@/components/ui/Pill'

import styles from './TalentPreviewCard.module.scss'

type TalentPreviewCardProps = {
  fullName: string
  avatarUrl?: string | null
  headline: string
  percentage?: number
  roles: string[]
  bio: string
  location?: string
  salary?: string
  cvName?: string | null
  skillCount?: number
}

const Row = ({
  icon,
  value,
  empty,
}: {
  icon: React.ReactNode
  value?: string | null
  empty: string
}) => (
  <li className={value ? styles.row : `${styles.row} ${styles.empty}`}>
    <span aria-hidden>{icon}</span>
    {value || empty}
  </li>
)

export const TalentPreviewCard = ({
  fullName,
  avatarUrl,
  headline,
  percentage,
  roles,
  bio,
  location,
  salary,
  cvName,
  skillCount = 0,
}: TalentPreviewCardProps) => {
  const [firstName = '', ...rest] = fullName.trim().split(/\s+/)

  return (
    <article className={styles.card} aria-live="polite">
      <header className={styles.head}>
        <Avatar
          firstName={firstName}
          lastName={rest.join(' ')}
          src={avatarUrl}
          size="lg"
        />
        <div className={styles.identity}>
          <h3 className={styles.name}>{fullName.trim() || 'Your name'}</h3>
          {headline && <p className={styles.headline}>{headline}</p>}
        </div>
        {percentage !== undefined && (
          <p className={styles.score}>
            <strong>{percentage}%</strong>
            <span>profile</span>
          </p>
        )}
      </header>
      {roles.length > 0 && (
        <ul className={styles.roles}>
          {roles.map((role) => (
            <li key={role}>
              <Pill size="sm">{role}</Pill>
            </li>
          ))}
        </ul>
      )}
      {bio.trim() && <p className={styles.bio}>{bio.trim()}</p>}
      <ul className={styles.rows}>
        <Row icon={<LuMapPin />} value={location} empty="Add your location" />
        <Row
          icon={<LuBriefcase />}
          value={salary}
          empty="Add your salary range"
        />
        <Row
          icon={<LuFileText />}
          value={
            cvName
              ? skillCount > 0
                ? `CV added · ${skillCount} skills found`
                : 'CV added'
              : undefined
          }
          empty="Upload your CV"
        />
      </ul>
    </article>
  )
}
