// ProgressBar.tsx
import 'react-circular-progressbar/dist/styles.css'

import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'

import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
  percentage: number
  size?: number // Optional prop to define the size of the progress circle
  textColor: string
  pathColor: string
  trailColor: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  size,
  // size = 80,
  textColor,
  pathColor,
  trailColor,
}) => {
  // Ensure percentage is within valid range
  const clampedPercentage = Math.max(0, Math.min(percentage, 100))

  return (
    <div style={{ width: size, height: size }} className={styles.wrap}>
      <CircularProgressbar
        value={clampedPercentage}
        text={`${clampedPercentage.toFixed(0)}%`}
        styles={buildStyles({
          textColor,
          pathColor,
          trailColor,
          textSize: 'var(--text-xl)',
        })}
      />
    </div>
  )
}

export default ProgressBar
