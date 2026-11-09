import cn from 'classnames'
import React from 'react'

import styles from './ArcBackdrop.module.scss'

const RADII = [60, 100, 140, 180, 220]

export const ArcBackdrop = ({ className }: { className?: string }) => (
  <svg
    className={cn(styles.backdrop, className)}
    viewBox="0 0 480 560"
    aria-hidden
    focusable="false">
    {RADII.map((r) => (
      <path
        key={r}
        d={`M ${240 - r} 560 V 240 A ${r} ${r} 0 0 1 ${240 + r} 240 V 560`}
      />
    ))}
  </svg>
)
