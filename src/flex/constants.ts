// Pixel mappings that approximate LINE's official Flex Message rendering.

export const BUBBLE_WIDTH: Record<string, number> = {
  nano: 120,
  micro: 160,
  deca: 220,
  hecto: 241,
  kilo: 260,
  mega: 300,
  giga: 386,
}

export const TEXT_SIZE: Record<string, number> = {
  xxs: 11,
  xs: 13,
  sm: 14,
  md: 16,
  lg: 19,
  xl: 22,
  xxl: 29,
  '3xl': 35,
  '4xl': 48,
  '5xl': 74,
}

export const SPACING: Record<string, number> = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
}

export const IMAGE_SIZE: Record<string, string> = {
  xxs: '40px',
  xs: '60px',
  sm: '80px',
  md: '100px',
  lg: '120px',
  xl: '140px',
  xxl: '160px',
  '3xl': '180px',
  '4xl': '200px',
  '5xl': '240px',
  full: '100%',
}

/** Convert a flex size token (keyword | px | %) into a CSS value. */
export function cssSize(v: string | undefined, table: Record<string, number | string>, fallback?: string): string | undefined {
  if (v === undefined) return fallback
  const t = table[v]
  if (t !== undefined) return typeof t === 'number' ? `${t}px` : t
  return v // already px / %
}

export const SIZE_KEYWORDS = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl']
export const SPACING_KEYWORDS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']

export const LINE_COLORS = {
  primary: '#17c950',
  secondary: '#dcdfe5',
  link: '#42659a',
  text: '#111111',
  subText: '#8c8c8c',
}
