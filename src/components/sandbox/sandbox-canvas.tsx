import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Crosshair,
  Plus,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/orpc/client'
import type { Island, SessionNode, SessionStatus } from '@/lib/orpc/schemas'
import {
  BUILDING_MARGIN,
  FLOOR_H,
  ISLAND_MARGIN,
  STATUS_COLOR,
  STATUS_FLOORS,
  STATUS_LABEL,
  diamondCenter,
  iso,
  poly,
  rectCorners,
  type Pt,
} from '@/lib/iso'
import { IslandLayer } from './island-layer'

const MIN_K = 0.35
const MAX_K = 2.6
const STATUSES: SessionStatus[] = ['active', 'waiting_user', 'idle', 'archived']

interface View {
  tx: number
  ty: number
  k: number
}

export function SandboxCanvas() {
  const [islands, setIslands] = useState<Island[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ tx: 0, ty: 0, k: 1 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [animating, setAnimating] = useState(false)
  const [sheetSession, setSheetSession] = useState<SessionNode | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const didInit = useRef(false)

  // ---------- data ----------
  useEffect(() => {
    client.islands
      .list()
      .then(setIslands)
      .catch((e) => setError(String(e)))
  }, [])

  // ---------- viewport metrics ----------
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setSize({ w: el.clientWidth, h: el.clientHeight }),
    )
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const worldPointForSession = useCallback(
    (island: Island, s: SessionNode): Pt => {
      const { x: ix, y: iy } = island.coordinates
      const b = BUILDING_MARGIN
      const x0 = ix + s.localPos.col + ISLAND_MARGIN + b
      const y0 = iy + s.localPos.row + ISLAND_MARGIN + b
      const x1 = x0 + 1 - b * 2
      const y1 = y0 + 1 - b * 2
      const lift = STATUS_FLOORS[s.status as SessionStatus] * FLOOR_H
      const tp = rectCorners(x0, y0, x1, y1, 0, 0, lift)
      return diamondCenter(tp)
    },
    [],
  )

  const focusPoint = useCallback(
    (p: Pt) => {
      setAnimating(true)
      setView((v) => ({
        ...v,
        tx: size.w / 2 - p.x * v.k,
        ty: size.h * 0.55 - p.y * v.k,
      }))
      window.setTimeout(() => setAnimating(false), 650)
    },
    [size],
  )

  // initial framing once data + size ready
  useEffect(() => {
    if (didInit.current || !islands || size.w === 0) return
    didInit.current = true
    const pts: Pt[] = []
    for (const island of islands) {
      const maxCol = Math.max(...island.sessions.map((s) => s.localPos.col), 0)
      const maxRow = Math.max(...island.sessions.map((s) => s.localPos.row), 0)
      const w = maxCol + 1 + ISLAND_MARGIN * 2 + 0.6
      const d = maxRow + 1 + ISLAND_MARGIN * 2
      pts.push(
        iso(island.coordinates.x - ISLAND_MARGIN - 1, island.coordinates.y - ISLAND_MARGIN - 1),
        iso(island.coordinates.x + w, island.coordinates.y + d),
      )
      for (const s of island.sessions) {
        pts.push(worldPointForSession(island, s))
      }
    }
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const span = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...ys) - Math.min(...ys)) * 2)
    const k = Math.min(1.4, Math.max(0.5, Math.min(size.w, size.h) / (span + 260)))
    setView({ tx: size.w / 2 - cx * k, ty: size.h * 0.55 - cy * k, k })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islands, size.w, size.h])

  // ---------- pan / zoom ----------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }))
  }
  const onPointerUp = () => {
    if (drag.current) drag.current.moved = false
    drag.current = null
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setView((v) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, v.k * Math.exp(-e.deltaY * 0.0012)))
        const r = k / v.k
        return { k, tx: mx - (mx - v.tx) * r, ty: my - (my - v.ty) * r }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = (f: number) => {
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * f))
      const r = k / v.k
      return { k, tx: size.w / 2 - (size.w / 2 - v.tx) * r, ty: size.h / 2 - (size.h / 2 - v.ty) * r }
    })
  }

  // ---------- actions ----------
  const handleSessionClick = useCallback(
    (s: SessionNode) => {
      if (drag.current?.moved) return
      const owner = islands?.find((i) => i.id === s.islandId)
      if (!owner) return
      focusPoint(worldPointForSession(owner, s))
    },
    [islands, focusPoint, worldPointForSession],
  )

  const centerOnActive = useCallback(() => {
    if (!islands) return
    const target =
      islands
        .flatMap((i) => i.sessions.map((s) => ({ i, s })))
        .find(({ s }) => s.status === 'active') ??
      islands.flatMap((i) => i.sessions.map((s) => ({ i, s }))).find(({ s }) => s.status === 'waiting_user')
    if (target) focusPoint(worldPointForSession(target.i, target.s))
  }, [islands, focusPoint, worldPointForSession])

  const addSession = useCallback(
    async (islandId: string) => {
      try {
        const created = await client.islands.createSession({ islandId })
        setIslands((prev) =>
          prev?.map((i) =>
            i.id === islandId ? { ...i, sessions: [...i.sessions, created] } : i,
          ) ?? prev,
        )
      } catch {
        /* noop for MVP */
      }
    },
    [],
  )

  const setStatus = useCallback(async (sessionId: string, status: SessionStatus) => {
    try {
      const updated = await client.sessions.setStatus({ sessionId, status })
      setIslands((prev) =>
        prev?.map((i) => ({
          ...i,
          sessions: i.sessions.map((s) => (s.id === sessionId ? updated : s)),
        })) ?? prev,
      )
      setSheetSession((cur) => (cur?.id === sessionId ? updated : cur))
    } catch {
      /* noop */
    }
  }, [])

  const sheetIsland = useMemo(
    () => islands?.find((i) => i.id === sheetSession?.islandId) ?? null,
    [islands, sheetSession],
  )

  // ---------- minimap ----------
  const mini = useMemo(() => {
    if (!islands) return null
    const pts: Pt[] = []
    const islandShapes = islands.map((island) => {
      const maxCol = Math.max(...island.sessions.map((s) => s.localPos.col), 0)
      const maxRow = Math.max(...island.sessions.map((s) => s.localPos.row), 0)
      const w = maxCol + 1 + ISLAND_MARGIN * 2
      const d = maxRow + 1 + ISLAND_MARGIN * 2
      const corners = rectCorners(0, 0, w, d, island.coordinates.x, island.coordinates.y)
      corners.forEach((p) => pts.push(p))
      return { island, corners }
    })
    const sessionDots = islands.flatMap((i) =>
      i.sessions.map((s) => ({ s, p: worldPointForSession(i, s) })),
    )
    sessionDots.forEach(({ p }) => pts.push(p))
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs) - 60
    const maxX = Math.max(...xs) + 60
    const minY = Math.min(...ys) - 80
    const maxY = Math.max(...ys) + 40
    const MW = 176
    const MH = 132
    const sc = Math.min(MW / (maxX - minX), MH / (maxY - minY))
    const ox = (MW - (maxX - minX) * sc) / 2
    const oy = (MH - (maxY - minY) * sc) / 2
    const map = (p: Pt): Pt => ({ x: ox + (p.x - minX) * sc, y: oy + (p.y - minY) * sc })
    const viewRect = {
      x: (-view.tx / view.k - minX) * sc + ox,
      y: (-view.ty / view.k - minY) * sc + oy,
      w: (size.w / view.k) * sc,
      h: (size.h / view.k) * sc,
    }
    return { islandShapes, sessionDots, map, viewRect, MW, MH, minX, minY, sc, ox, oy }
  }, [islands, view, size, worldPointForSession])

  const minimapJump = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mini) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const wx = mini.minX + (mx - mini.ox) / mini.sc
    const wy = mini.minY + (my - mini.oy) / mini.sc
    focusPoint({ x: wx, y: wy })
  }

  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 touch-none overflow-hidden bg-[#0a0f1e] select-none"
      style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* world layer */}
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: animating ? 'transform 600ms cubic-bezier(0.22,1,0.36,1)' : 'none',
        }}
      >
        {islands?.map((island) => (
          <IslandLayer
            key={island.id}
            island={island}
            zoom={view.k}
            onSessionClick={handleSessionClick}
            onSessionDoubleClick={(s) => setSheetSession(s)}
            onAddSession={addSession}
          />
        ))}
      </div>

      {/* toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-2.5 shadow-xl backdrop-blur">
          <div className="text-sm font-semibold text-zinc-100">
            Neuromorphic Session Canvas
          </div>
          <div className="text-[11px] text-zinc-500">
            拖拽平移 · 滚轮缩放 · 双击建筑打开会话
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={centerOnActive}>
          <Crosshair className="size-4" /> 归中活跃
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => islands?.[0] && addSession(islands[0].id)}
        >
          <Plus className="size-4" /> 新会话
        </Button>
        <Button variant="secondary" size="icon-sm" onClick={() => zoomBy(1.25)}>
          <ZoomIn className="size-4" />
        </Button>
        <Button variant="secondary" size="icon-sm" onClick={() => zoomBy(0.8)}>
          <ZoomOut className="size-4" />
        </Button>
      </div>

      {/* minimap */}
      {mini && (
        <div className="absolute right-4 bottom-4 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 shadow-xl backdrop-blur">
          <svg
            width={mini.MW}
            height={mini.MH}
            className="block cursor-pointer"
            onClick={minimapJump}
          >
            <rect width={mini.MW} height={mini.MH} fill="#0d1424" />
            {mini.islandShapes.map(({ island, corners }) => (
              <polygon
                key={island.id}
                points={poly(corners.map(mini.map))}
                fill={`${island.themeColor}33`}
                stroke={island.themeColor}
                strokeWidth={1}
              />
            ))}
            {mini.sessionDots.map(({ s, p }) => {
              const m = mini.map(p)
              return (
                <circle
                  key={s.id}
                  cx={m.x}
                  cy={m.y}
                  r={s.status === 'archived' ? 1.5 : 2.5}
                  fill={STATUS_COLOR[s.status as SessionStatus]}
                  opacity={s.status === 'archived' ? 0.4 : 0.95}
                />
              )
            })}
            <rect
              x={mini.viewRect.x}
              y={mini.viewRect.y}
              width={mini.viewRect.w}
              height={mini.viewRect.h}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1}
              rx={3}
            />
          </svg>
          <div className="border-t border-white/10 px-2.5 py-1 text-[10px] text-zinc-500">
            minimap
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-20 left-4 rounded-lg border border-red-500/30 bg-red-950/80 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* session sheet */}
      <Sheet
        open={sheetSession !== null}
        onOpenChange={(open) => {
          if (!open) setSheetSession(null)
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {sheetSession && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-transparent"
                    style={{
                      background: `${STATUS_COLOR[sheetSession.status as SessionStatus]}26`,
                      color: STATUS_COLOR[sheetSession.status as SessionStatus],
                    }}
                  >
                    {STATUS_LABEL[sheetSession.status as SessionStatus]}
                  </Badge>
                  <SheetTitle className="text-base">{sheetSession.title}</SheetTitle>
                </div>
                <SheetDescription>
                  {sheetIsland?.name ?? '未知岛屿'} · 网格 ({sheetSession.localPos.col},{' '}
                  {sheetSession.localPos.row})
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
                <div>
                  <div className="mb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                    预览
                  </div>
                  <p className="text-sm leading-6 text-zinc-300">
                    {sheetSession.previewSnippet}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                    最近活动
                  </div>
                  <p className="text-sm text-zinc-300">
                    {new Date(sheetSession.lastActivityAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                    状态
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(sheetSession.id, st)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          sheetSession.status === st
                            ? 'border-transparent text-zinc-950'
                            : 'border-white/10 text-zinc-400 hover:bg-white/5'
                        }`}
                        style={
                          sheetSession.status === st
                            ? { background: STATUS_COLOR[st] }
                            : undefined
                        }
                      >
                        {STATUS_LABEL[st]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">
                  会话内容流将在这里渲染（MVP 占位）。
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
