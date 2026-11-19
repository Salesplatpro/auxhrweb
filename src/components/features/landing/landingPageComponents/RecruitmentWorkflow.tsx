import cn from 'classnames'
import React from 'react'

import { Text } from '@/components/ui/Typography'

import { SectionHeader } from './SectionHeader'
import styles from './styles/RecruitmentWorkflow.module.scss'
import { HowItWorksType } from './utils'

type RecruitmentWorkflowProps = {
  title?: string
  subTitle: string
  data: HowItWorksType[]
  variant?: 'primary' | 'secondary'
}

export const RecruitmentWorkflow = ({
  title,
  subTitle,
  variant = 'primary',
  data,
}: RecruitmentWorkflowProps) => {
  const bgStyle = styles[variant]

  return (
    <div className={cn(styles.container, bgStyle)}>
      <SectionHeader title={title} subTitle={subTitle} variant={variant} />
      <div className={styles.gridContainer}>
        {data.map(({ text, image, alt, style }, index) => (
          <div key={index} className={style}>
            <Text size="fs-2xl" weight="bold" className={styles.itemText}>
              {text}
            </Text>
            <img src={image} alt={alt} />
          </div>
        ))}
      </div>
    </div>
  )
}
