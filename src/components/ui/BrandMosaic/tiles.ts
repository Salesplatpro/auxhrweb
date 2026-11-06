export type MosaicColor =
  | 'blue'
  | 'navy'
  | 'violet'
  | 'lavender'
  | 'periwinkle'
  | 'sky'
  | 'mist'
  | 'orange'
  | 'tangerine'
  | 'sand'
  | 'mint'
  | 'paper'
  | 'ink'
  | 'line'
  | 'white'

export type MosaicShape =
  | { kind: 'quarter'; corner: 'tl' | 'tr' | 'bl' | 'br'; color: MosaicColor }
  | { kind: 'circle'; color: MosaicColor }
  | { kind: 'dot'; color: MosaicColor }
  | {
      kind: 'half'
      flat: 'top' | 'bottom' | 'left' | 'right'
      color: MosaicColor
    }
  | { kind: 'leaf'; color: MosaicColor }
  | { kind: 'arcs'; corner: 'tl' | 'tr' | 'bl' | 'br'; color: MosaicColor }
  | { kind: 'rings'; color: MosaicColor }
  | { kind: 'arch'; flat: 'top' | 'bottom'; color: MosaicColor }

export type MosaicTile = {
  col: number
  row: number
  span?: number
  bg: MosaicColor
  shape?: MosaicShape
}

export const MOSAIC_CENTER = { col: 3, row: 4, span: 2 }

export const MOSAIC_TILES: MosaicTile[] = [
  {
    col: 1,
    row: 1,
    bg: 'white',
    shape: { kind: 'quarter', corner: 'tl', color: 'blue' },
  },
  {
    col: 2,
    row: 1,
    bg: 'sand',
    shape: { kind: 'half', flat: 'bottom', color: 'orange' },
  },
  { col: 3, row: 1, bg: 'mist', shape: { kind: 'circle', color: 'blue' } },
  {
    col: 4,
    row: 1,
    bg: 'white',
    shape: { kind: 'arch', flat: 'bottom', color: 'ink' },
  },
  {
    col: 5,
    row: 1,
    span: 2,
    bg: 'white',
    shape: { kind: 'quarter', corner: 'bl', color: 'orange' },
  },
  { col: 1, row: 2, bg: 'lavender', shape: { kind: 'leaf', color: 'blue' } },
  {
    col: 2,
    row: 2,
    bg: 'white',
    shape: { kind: 'arcs', corner: 'br', color: 'line' },
  },
  {
    col: 3,
    row: 2,
    bg: 'paper',
    shape: { kind: 'quarter', corner: 'tr', color: 'lavender' },
  },
  {
    col: 4,
    row: 2,
    bg: 'blue',
    shape: { kind: 'half', flat: 'top', color: 'white' },
  },
  {
    col: 1,
    row: 3,
    bg: 'white',
    shape: { kind: 'half', flat: 'top', color: 'blue' },
  },
  {
    col: 2,
    row: 3,
    bg: 'lavender',
    shape: { kind: 'quarter', corner: 'tl', color: 'violet' },
  },
  { col: 3, row: 3, bg: 'white', shape: { kind: 'circle', color: 'orange' } },
  {
    col: 4,
    row: 3,
    bg: 'mint',
    shape: { kind: 'half', flat: 'bottom', color: 'white' },
  },
  {
    col: 5,
    row: 3,
    bg: 'mist',
    shape: { kind: 'quarter', corner: 'br', color: 'navy' },
  },
  { col: 6, row: 3, bg: 'white', shape: { kind: 'rings', color: 'line' } },
  {
    col: 1,
    row: 4,
    bg: 'paper',
    shape: { kind: 'arcs', corner: 'tl', color: 'ink' },
  },
  { col: 2, row: 4, bg: 'white', shape: { kind: 'dot', color: 'ink' } },
  { col: 5, row: 4, bg: 'white', shape: { kind: 'leaf', color: 'orange' } },
  {
    col: 6,
    row: 4,
    bg: 'navy',
    shape: { kind: 'half', flat: 'right', color: 'lavender' },
  },
  { col: 1, row: 5, bg: 'navy', shape: { kind: 'circle', color: 'sand' } },
  {
    col: 2,
    row: 5,
    bg: 'sand',
    shape: { kind: 'quarter', corner: 'bl', color: 'tangerine' },
  },
  {
    col: 5,
    row: 5,
    bg: 'lavender',
    shape: { kind: 'quarter', corner: 'tr', color: 'navy' },
  },
  {
    col: 6,
    row: 5,
    bg: 'paper',
    shape: { kind: 'half', flat: 'bottom', color: 'ink' },
  },
  { col: 1, row: 6, bg: 'white', shape: { kind: 'leaf', color: 'lavender' } },
  {
    col: 2,
    row: 6,
    bg: 'white',
    shape: { kind: 'half', flat: 'bottom', color: 'periwinkle' },
  },
  {
    col: 3,
    row: 6,
    bg: 'mist',
    shape: { kind: 'half', flat: 'top', color: 'sky' },
  },
  {
    col: 4,
    row: 6,
    bg: 'white',
    shape: { kind: 'arcs', corner: 'tl', color: 'line' },
  },
  { col: 5, row: 6, bg: 'paper', shape: { kind: 'circle', color: 'sky' } },
  {
    col: 6,
    row: 6,
    bg: 'orange',
    shape: { kind: 'quarter', corner: 'br', color: 'sand' },
  },
  {
    col: 1,
    row: 7,
    span: 2,
    bg: 'mist',
    shape: { kind: 'quarter', corner: 'tr', color: 'navy' },
  },
  { col: 3, row: 7, bg: 'mint', shape: { kind: 'leaf', color: 'white' } },
  {
    col: 4,
    row: 7,
    bg: 'lavender',
    shape: { kind: 'quarter', corner: 'tl', color: 'navy' },
  },
  {
    col: 5,
    row: 7,
    bg: 'white',
    shape: { kind: 'arch', flat: 'top', color: 'line' },
  },
  {
    col: 6,
    row: 7,
    bg: 'ink',
    shape: { kind: 'half', flat: 'bottom', color: 'mist' },
  },
  {
    col: 3,
    row: 8,
    bg: 'white',
    shape: { kind: 'quarter', corner: 'br', color: 'sky' },
  },
  { col: 4, row: 8, bg: 'white', shape: { kind: 'circle', color: 'lavender' } },
  {
    col: 5,
    row: 8,
    bg: 'sand',
    shape: { kind: 'half', flat: 'bottom', color: 'orange' },
  },
  {
    col: 6,
    row: 8,
    bg: 'white',
    shape: { kind: 'quarter', corner: 'bl', color: 'navy' },
  },
]
