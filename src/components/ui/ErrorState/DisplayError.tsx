import Lottie from 'lottie-react'
import React from 'react'

import animationData from '@/assets/Animation2.json'

import styles from './DisplayError.module.scss'

type DisplayErrorType = {
  message: string
}

export const DisplayError = ({ message }: DisplayErrorType) => (
  <div className={styles.container}>
    <div>
      <Lottie
        animationData={animationData}
        loop={false}
        className={styles.animation}
      />
    </div>

    <h2 className={styles.message}>{message}</h2>
  </div>
)
