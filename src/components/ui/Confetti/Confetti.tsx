import React, { CSSProperties } from 'react'

import styles from './Confetti.module.scss'

const PIECES = [
  { top: '20%', left: '-4%', rotate: 8, color: 1 },
  { top: '28%', left: '-6%', rotate: -40, color: 2, small: true },
  { top: '46%', left: '-10%', rotate: 16, color: 3 },
  { top: '46%', left: '-2%', rotate: -60, color: 4, small: true },
  { top: '24%', right: '-3%', rotate: 0, color: 2, small: true },
  { top: '26%', right: '-10%', rotate: -30, color: 1 },
  { top: '42%', right: '-12%', rotate: 12, color: 1 },
  { top: '52%', right: '-6%', rotate: 0, color: 5 },
]

export const Confetti = () => (
  <span className={styles.confetti} aria-hidden>
    {PIECES.map(({ color, rotate, small, ...position }, index) => (
      <span
        key={index}
        className={small ? styles.small : styles.piece}
        style={
          {
            ...position,
            transform: `rotate(${rotate}deg)`,
            background: `var(--color-confetti-${color})`,
          } as CSSProperties
        }
      />
    ))}
  </span>
)
