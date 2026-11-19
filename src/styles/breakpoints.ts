// Mirrors styles/breakpoints.scss and the --bp-* tokens; keep the three in step.
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 900,
  xl: 1000,
  wide: 1100,
} as const

export const isBelow = (width: number) =>
  typeof window !== 'undefined' && window.innerWidth < width
