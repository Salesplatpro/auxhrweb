import React from 'react'

import { Text } from '@/components/ui/Typography'

import { FeatureDataType } from './Features'
import styles from './Features.module.scss'

type FeatureSectionProps = {
  header: string
  data: FeatureDataType[]
}

export const FeaturesSection = ({ header, data }: FeatureSectionProps) => {
  return (
    <div className={styles.wrapper}>
      <Text size="fs-2xl" weight="bolder">
        {header}
      </Text>
      <div className={styles.grid}>
        {data.map(({ title, description }) => (
          <div key={title} className={styles.moreFeatures}>
            <Text size="fs-xl" weight="bolder">
              {title}
            </Text>
            <Text size="fs-xl">{description}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}
