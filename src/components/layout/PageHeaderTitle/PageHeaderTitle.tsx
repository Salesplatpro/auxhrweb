import React from 'react'

import { PageHero } from '@/components/layout/PageHero'
import { BackButton } from '@/components/ui/BackButton'
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { Heading, Text } from '@/components/ui/Typography'

import styles from './PageHeaderTitle.module.scss'

type PageHeaderTitleProps = {
  title: string
  description: React.ReactNode
  onBack?: () => void
  variant?: 'plain' | 'hero'
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

/**
 * A generic page header.
 *
 * It used to fetch a scout campaign itself to derive its own title, which meant a
 * layout component depended on one feature's API and every unrelated test had to
 * stub that hook. Callers pass the title now.
 */
export const PageHeaderTitle = ({
  description,
  title,
  onBack,
  variant = 'plain',
  breadcrumbs,
  actions,
}: PageHeaderTitleProps) => {
  if (variant === 'hero') {
    return (
      <>
        {onBack && <BackButton onClick={onBack} />}
        <PageHero compact title={title} lead={description} />
      </>
    )
  }

  if (breadcrumbs) {
    return (
      <header className={styles.withCrumbs}>
        <Breadcrumb items={breadcrumbs} />
        <div className={styles.titleRow}>
          <div className={styles.titleCopy}>
            <Heading level={1}>{title}</Heading>
            <Text as="p" size="fs-md" color="muted">
              {description}
            </Text>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </header>
    )
  }

  return (
    <div className={styles.plain}>
      {onBack && <BackButton onClick={onBack} />}
      <Heading level={1}>{title}</Heading>
      <Text as="p" size="fs-xl" color="secondary">
        {description}
      </Text>
    </div>
  )
}
