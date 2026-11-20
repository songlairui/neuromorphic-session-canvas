import {
  BUILDING_MARGIN,
  FLOOR_H,
  ISLAND_MARGIN,
  PLATFORM_THICKNESS,
  STATUS_COLOR,
  STATUS_FLOORS,
  STATUS_LABEL,
  diamondCenter,
  poly,
  rectCorners,
  shade,
  type Pt,
} from '@/lib/iso'
import type { Island, SessionNode, SessionStatus } from '@/lib/orpc/schemas'
import { Plus } from 'lucide-react'

function mixToward(hex: string, target: string, t: number): string {
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(target.slice(1), 16)
  const ch = (shift: number) => {
    const ca = (a >> shift) & 255
    const cb = (b >> shift) & 255
    return Math.round(ca + (cb - ca) * t)
  }
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

const MUTED = '#4b5563'
const INACTIVE = new Set<SessionStatus>(['idle', 'archived'])

function bbox(pts: Pt[]) {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

interface Props {
  island: Island
  zoom: number
  onSessionClick: (s: SessionNode) => void
  onSessionDoubleClick: (s: SessionNode) => void
  onAddSession: (islandId: string) => void
}

export function IslandLayer({
  island,
  zoom,
  onSessionClick,
  onSessionDoubleClick,
  onAddSession,
}: Props) {
  const { x: ix, y: iy } = island.coordinates
  const maxCol = Math.max(...island.sessions.map((s) => s.localPos.col), 0)
  const maxRow = Math.max(...island.sessions.map((s) => s.localPos.row), 0)
  const w = maxCol + 1 + ISLAND_MARGIN * 2
  const d = maxRow + 1 + ISLAND_MARGIN * 2

  const top = rectCorners(0, 0, w, d, ix, iy)
  const [, tr, tf, tl] = top
  const t = PLATFORM_THICKNESS
  const down = (p: Pt): Pt => ({ x: p.x, y: p.y + t })
  const center = diamondCenter(top)
  const counter = 1 / zoom

  const bodyColor = (status: SessionStatus) =>
    INACTIVE.has(status)
      ? mixToward(island.themeColor, MUTED, 0.72)
      : island.themeColor

  return (
    <div className="absolute left-0 top-0">
      <svg className="absolute overflow-visible" width={0} height={0}>
        <polygon
          points={poly([tr, tf, down(tf), down(tr)])}
          fill={shade(island.themeColor, -0.38)}
        />
        <polygon
          points={poly([tl, tf, down(tf), down(tl)])}
          fill={shade(island.themeColor, -0.2)}
        />
        <polygon
          points={poly(top)}
          fill={shade(island.themeColor, 0.18)}
          stroke={shade(island.themeColor, 0.45)}
          strokeWidth={1.5}
        />
      </svg>

      {/* island plaque */}
      <div
        className="absolute flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/85 px-3 py-1 text-[11px] font-medium whitespace-nowrap text-zinc-200 shadow-lg backdrop-blur-sm"
        style={{
          left: center.x,
          top: center.y - t - 14,
          transform: `translate(-50%, -100%) scale(${counter})`,
          transformOrigin: 'bottom center',
        }}
      >
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: island.themeColor }}
        />
        <span className="max-w-40 truncate">{island.name}</span>
        <span className="text-zinc-500">{island.sessions.length}</span>
        <button
          type="button"
          title="在此岛屿新建会话"
          onClick={(e) => {
            e.stopPropagation()
            onAddSession(island.id)
          }}
          className="ml-0.5 cursor-pointer rounded-full p-0.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-emerald-300"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {island.sessions.map((s) => {
        const status = s.status as SessionStatus
        const lift = STATUS_FLOORS[status] * FLOOR_H
        const b = BUILDING_MARGIN
        const x0 = ix + s.localPos.col + ISLAND_MARGIN + b
        const y0 = iy + s.localPos.row + ISLAND_MARGIN + b
        const x1 = x0 + 1 - b * 2
        const y1 = y0 + 1 - b * 2

        const g = rectCorners(x0, y0, x1, y1, 0, 0)
        const tp = rectCorners(x0, y0, x1, y1, 0, 0, lift)
        const [, gtr, gtf, gtl] = g
        const [, ptr, ptf, ptl] = tp
        const bc = bodyColor(status)
        const btm = diamondCenter(tp)
        const hit = bbox([...g, ...tp])
        const ringPad = 0.13
        const ring = rectCorners(
          x0 - ringPad,
          y0 - ringPad,
          x1 + ringPad,
          y1 + ringPad,
          0,
          0,
        )
        const isActive = status === 'active' || status === 'waiting_user'

        return (
          <div
            key={s.id}
            className="group absolute left-0 top-0"
            onClick={() => onSessionClick(s)}
            onDoubleClick={() => onSessionDoubleClick(s)}
          >
            <svg className="absolute overflow-visible" width={0} height={0}>
              {status !== 'archived' && (
                <polygon
                  points={poly(ring)}
                  fill="none"
                  stroke={STATUS_COLOR[status]}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  opacity={isActive ? 0.9 : 0.4}
                  className={isActive ? 'iso-pulse-ring' : undefined}
                />
              )}
              <polygon
                points={poly([ptr, ptf, gtf, gtr])}
                fill={shade(bc, -0.34)}
              />
              <polygon
                points={poly([ptl, ptf, gtf, gtl])}
                fill={shade(bc, -0.14)}
              />
              <polygon
                points={poly(tp)}
                fill={shade(bc, 0.3)}
                stroke={shade(bc, 0.55)}
                strokeWidth={1}
              />
            </svg>

            {/* invisible hit area covering the whole building */}
            <div
              className="absolute cursor-pointer"
              style={{
                left: hit.x - 8,
                top: hit.y - 8,
                width: hit.w + 16,
                height: hit.h + 16,
              }}
            />

            <div
              className="pointer-events-none absolute max-w-44 truncate rounded-md border border-white/10 bg-zinc-950/80 px-1.5 py-0.5 text-center text-[10px] leading-4 text-zinc-300 opacity-0 shadow transition-opacity group-hover:opacity-100"
              style={{
                left: btm.x,
                top: btm.y - 8,
                transform: `translate(-50%, -100%) scale(${counter})`,
                transformOrigin: 'bottom center',
              }}
            >
              {s.title}
            </div>

            <div
              className="pointer-events-none absolute w-52 rounded-lg border border-white/10 bg-zinc-950/90 p-2.5 text-left opacity-0 shadow-xl backdrop-blur transition-opacity group-hover:opacity-100"
              style={{
                left: btm.x,
                top: btm.y - 10,
                transform: `translate(-50%, -100%) scale(${counter})`,
                transformOrigin: 'bottom center',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: STATUS_COLOR[status] }}
                />
                <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <div className="mt-1 text-xs font-medium text-zinc-100">
                {s.title}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-400">
                {s.previewSnippet}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

