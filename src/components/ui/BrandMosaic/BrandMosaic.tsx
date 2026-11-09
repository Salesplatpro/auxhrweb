import cn from 'classnames'
import React, { CSSProperties } from 'react'

import auxHrLogo from '@/assets/aux_logo.png'

import styles from './BrandMosaic.module.scss'
import {
  MOSAIC_CENTER,
  MOSAIC_TILES,
  MosaicColor,
  MosaicShape,
  MosaicTile,
} from './tiles'

const paint = (color: MosaicColor) => `var(--mosaic-${color})`

const placement = ({ col, row, span = 1 }: Omit<MosaicTile, 'bg'>) => ({
  gridColumn: `${col} / span ${span}`,
  gridRow: `${row} / span ${span}`,
})

const ARC_ORIGIN = { tl: [0, 0], tr: [100, 0], bl: [0, 100], br: [100, 100] }

const LineShape = ({ shape }: { shape: MosaicShape }) => {
  if (shape.kind === 'rings') {
    return (
      <svg viewBox="0 0 100 100" className={styles.lines}>
        {[44, 32, 20].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} />
        ))}
      </svg>
    )
  }
  if (shape.kind === 'arcs') {
    const [cx, cy] = ARC_ORIGIN[shape.corner]
    return (
      <svg viewBox="0 0 100 100" className={styles.lines}>
        {[80, 56, 32].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} />
        ))}
      </svg>
    )
  }
  if (shape.kind === 'arch') {
    const flip = shape.flat === 'top' ? 'scale(1,-1) translate(0,-100)' : ''
    return (
      <svg viewBox="0 0 100 100" className={styles.lines}>
        <g transform={flip}>
          {[42, 30, 18].map((r) => (
            <path
              key={r}
              d={`M ${50 - r} 100 V 50 A ${r} ${r} 0 0 1 ${50 + r} 50 V 100`}
            />
          ))}
        </g>
      </svg>
    )
  }
  return null
}

const Shape = ({ shape }: { shape: MosaicShape }) => {
  const style = { '--shape': paint(shape.color) } as CSSProperties
  if (
    shape.kind === 'arcs' ||
    shape.kind === 'rings' ||
    shape.kind === 'arch'
  ) {
    return (
      <span className={styles.lineWrap} style={style}>
        <LineShape shape={shape} />
      </span>
    )
  }
  const variant =
    shape.kind === 'quarter'
      ? styles[`quarter-${shape.corner}`]
      : shape.kind === 'half'
      ? styles[`half-${shape.flat}`]
      : styles[shape.kind]
  return <span className={cn(styles.shape, variant)} style={style} />
}

type BrandMosaicProps = {
  accent?: 'brand' | 'violet'
  className?: string
}

export const BrandMosaic = ({
  accent = 'brand',
  className,
}: BrandMosaicProps) => (
  <div className={cn(styles.mosaic, className)} aria-hidden>
    {MOSAIC_TILES.map((tile) => (
      <div
        key={`${tile.col}-${tile.row}`}
        className={styles.tile}
        style={{ ...placement(tile), background: paint(tile.bg) }}>
        {tile.shape && <Shape shape={tile.shape} />}
      </div>
    ))}
    <div className={styles.tile} style={placement(MOSAIC_CENTER)}>
      <div className={cn(styles.center, styles[accent])}>
        <img src={auxHrLogo} alt="" className={styles.logo} />
      </div>
    </div>
  </div>
)
