import React, { ReactNode } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import { To } from 'react-router-dom'

import { IconBadge, IconBadgeTone } from '@/components/ui/IconBadge'
import { SegmentedProgress } from '@/components/ui/SegmentedProgress'
import { TextLink } from '@/components/ui/TextLink'

import styles from './AuthScreen.module.scss'

type AuthScreenProps = {
  back?: { to: To; label: string }
  progress?: { step: number; total: number }
  eyebrow?: ReactNode
  icon?: { icon: ReactNode; tone?: IconBadgeTone }
  title: string
  subtitle?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

export const AuthScreen = ({
  back,
  progress,
  eyebrow,
  icon,
  title,
  subtitle,
  children,
  footer,
}: AuthScreenProps) => (
  <section className={styles.screen}>
    {back && (
      <TextLink to={back.to} tone="muted" icon={<LuArrowLeft />}>
        {back.label}
      </TextLink>
    )}
    {progress && (
      <div className={styles.progress}>
        <span className={styles.stepLabel}>
          Step {progress.step} of {progress.total}
        </span>
        <SegmentedProgress
          total={progress.total}
          filled={progress.step}
          label={`Step ${progress.step} of ${progress.total}`}
        />
      </div>
    )}
    {icon && <IconBadge icon={icon.icon} tone={icon.tone} />}
    <header className={styles.header}>
      {eyebrow}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
    {children}
    {footer && <div className={styles.footer}>{footer}</div>}
  </section>
)

type AuthPromptProps = {
  text: string
  linkLabel: string
  to: To
}

export const AuthPrompt = ({ text, linkLabel, to }: AuthPromptProps) => (
  <p className={styles.prompt}>
    {text} <TextLink to={to}>{linkLabel}</TextLink>
  </p>
)
