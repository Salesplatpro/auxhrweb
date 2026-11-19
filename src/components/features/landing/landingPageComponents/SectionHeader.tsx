import React, { ReactNode } from 'react'

import { Text } from '@/components/ui/Typography'

import styles from './styles/SectionHeader.module.scss'

type SectionHeaderProps = {
  title?: string | ReactNode
  subTitle: string | ReactNode
  centered?: boolean
  variant?: 'primary' | 'secondary'
}
export const SectionHeader = ({
  title,
  subTitle,
  centered = false,
  variant = 'primary',
}: SectionHeaderProps) => (
  <div
    className={
      centered ? `${styles.header} ${styles.centered}` : styles.header
    }>
    <Text
      size="fs-md"
      color={variant === 'secondary' ? 'white' : 'tag'}
      weight="bold">
      {title}
    </Text>
    <Text
      size="fs-2xl"
      weight="bolder"
      color={variant === 'secondary' ? 'white' : 'default'}>
      {subTitle}
    </Text>
  </div>
)
