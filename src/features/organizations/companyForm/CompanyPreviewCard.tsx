import React, { useState } from 'react'
import {
  LuBriefcase,
  LuClock3,
  LuGlobe,
  LuLinkedin,
  LuMail,
  LuShieldCheck,
  LuTwitter,
} from 'react-icons/lu'

import { Pill } from '@/components/ui/Pill'

import { OrganizationStatus } from '../types'
import { CompanyFormValues } from './companyFormSchema'
import styles from './CompanyPreviewCard.module.scss'

type CompanyPreviewCardProps = {
  values: CompanyFormValues
  status?: OrganizationStatus
  logoUrl?: string | null
  openRoles?: number
}

const STATUS_PILL: Record<
  OrganizationStatus,
  { label: string; tone: 'warning' | 'success' | 'neutral' }
> = {
  pending: { label: 'Pending review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Not approved', tone: 'neutral' },
}

const shortLocation = (address: string) =>
  address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(-2)
    .join(', ')

const handle = (value: string) => {
  const clean = value
    .trim()
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '')
  return clean.startsWith('@') ? clean : `@${clean}`
}

const Logo = ({ name, logoUrl }: { name: string; logoUrl?: string | null }) => {
  const [failed, setFailed] = useState(false)
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={styles.logo}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span className={styles.logo} aria-hidden>
      {name.charAt(0).toUpperCase() || '?'}
    </span>
  )
}

export const CompanyPreviewCard = ({
  values,
  status = 'pending',
  logoUrl,
  openRoles = 0,
}: CompanyPreviewCardProps) => {
  const name = values.name.trim() || 'Your company'
  const meta = [values.industry, shortLocation(values.address)]
    .filter(Boolean)
    .join(' · ')
  const domain = values.domain.trim().replace(/^@/, '')
  const pill = STATUS_PILL[status]

  const chips = [
    domain && { icon: <LuGlobe />, label: domain },
    values.email.trim() && { icon: <LuMail />, label: values.email.trim() },
    values.linkedin.trim() && { icon: <LuLinkedin />, label: name },
    values.twitter.trim() && {
      icon: <LuTwitter />,
      label: handle(values.twitter),
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[]

  return (
    <article className={styles.card} aria-live="polite">
      <div className={styles.banner} />
      <div className={styles.body}>
        <div className={styles.top}>
          <Logo name={values.name.trim()} logoUrl={logoUrl} />
          <Pill
            tone={pill.tone}
            size="sm"
            icon={status === 'verified' ? <LuShieldCheck /> : <LuClock3 />}>
            {pill.label}
          </Pill>
        </div>
        <h3 className={styles.name}>{name}</h3>
        {meta && <p className={styles.meta}>{meta}</p>}
        {chips.length > 0 && (
          <ul className={styles.chips}>
            {chips.map((chip) => (
              <li key={chip.label} className={styles.chip}>
                <span aria-hidden>{chip.icon}</span>
                {chip.label}
              </li>
            ))}
          </ul>
        )}
        <p className={styles.footer}>
          <LuBriefcase aria-hidden />
          {openRoles} open {openRoles === 1 ? 'role' : 'roles'} · candidates see
          this on every job
        </p>
      </div>
    </article>
  )
}
