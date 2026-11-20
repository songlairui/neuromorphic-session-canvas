// 2:1 dimetric projection. World units are iso cells; screen px at zoom 1.
export const TILE_W = 96
export const TILE_H = 48
export const FLOOR_H = 30 // px per building floor
export const PLATFORM_THICKNESS = 18
export const ISLAND_MARGIN = 0.6 // cells of platform around sessions
export const BUILDING_MARGIN = 0.16 // cells inset of building footprint

export interface Pt {
  x: number
  y: number
}

export function iso(x: number, y: number): Pt {
  return { x: (x - y) * (TILE_W / 2), y: (x + y) * (TILE_H / 2) }
}

export function poly(points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

export function shade(hex: string, amount: number): string {
  // amount -1..1: negative darkens toward black, positive lightens toward white
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const t = amount < 0 ? 0 : 255
  const p = Math.abs(amount)
  const mix = (c: number) => Math.round(c + (t - c) * p)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

export type StatusKey = 'active' | 'waiting_user' | 'idle' | 'archived'

export const STATUS_COLOR: Record<StatusKey, string> = {
  active: '#34d399',
  waiting_user: '#fbbf24',
  idle: '#64748b',
  archived: '#475569',
}

export const STATUS_FLOORS: Record<StatusKey, number> = {
  active: 3.4,
  waiting_user: 2.7,
  idle: 1.7,
  archived: 0.9,
}

export const STATUS_LABEL: Record<StatusKey, string> = {
  active: '活跃',
  waiting_user: '等待决策',
  idle: '空闲',
  archived: '已归档',
}

// Island-local -> world helpers. Platform spans [-m, maxCol+1+m] x [-m, maxRow+1+m].
export function islandSize(sessions: { localPos: { row: number; col: number } }[]) {
  const maxCol = Math.max(...sessions.map((s) => s.localPos.col), 0)
  const maxRow = Math.max(...sessions.map((s) => s.localPos.row), 0)
  return {
    w: maxCol + 1 + ISLAND_MARGIN * 2,
    d: maxRow + 1 + ISLAND_MARGIN * 2,
  }
}

export function cellCenter(
  islandX: number,
  islandY: number,
  col: number,
  row: number,
): Pt {
  // cell [col,col+1]x[row,row+1] center, offset by island margin origin (-m,-m)
  return {
    x: islandX + col + 0.5 - ISLAND_MARGIN,
    y: islandY + row + 0.5 - ISLAND_MARGIN,
  }
}

// Top-face corners of an axis-aligned world rect, in diamond order
// (back, right, front, left). lift = screen px subtracted from y (height).
export function rectCorners(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ox: number,
  oy: number,
  lift = 0,
): Pt[] {
  const pts = [
    iso(ox + x0, oy + y0),
    iso(ox + x1, oy + y0),
    iso(ox + x1, oy + y1),
    iso(ox + x0, oy + y1),
  ]
  return pts.map((p) => ({ x: p.x, y: p.y - lift }))
}

// Average of the two "side" edges' midpoints = visual center of a diamond top.
export function diamondCenter(c: Pt[]): Pt {
  return { x: (c[0].x + c[2].x) / 2, y: (c[0].y + c[2].y) / 2 }
}
