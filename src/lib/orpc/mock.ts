import type { Island, SessionNode, SessionStatus } from './schemas'

const HOUR = 60 * 60 * 1000

function ago(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString()
}

function session(
  islandId: string,
  id: string,
  title: string,
  status: SessionStatus,
  hoursAgo: number,
  previewSnippet: string,
  localPos: { row: number; col: number },
): SessionNode {
  return {
    id,
    islandId,
    title,
    status,
    lastActivityAt: ago(hoursAgo),
    previewSnippet,
    localPos,
  }
}

export const mockIslands: Island[] = [
  {
    id: 'isl_neuromorphic',
    name: 'neuromorphic-session-canvas',
    coordinates: { x: 0, y: 0 },
    themeColor: '#10b981',
    sessions: [
      session(
        'isl_neuromorphic',
        'ses_iso_viewport',
        '等轴视口：平移 / 缩放 / 归中状态机',
        'active',
        0.2,
        '正在实现 pointer drag pan 与 wheel zoom，归中动画走 transform transition…',
        { row: 0, col: 0 },
      ),
      session(
        'isl_neuromorphic',
        'ses_session_sheet',
        '会话抽屉：Base UI Dialog + Sheet 样式',
        'waiting_user',
        1.5,
        '抽屉已挂上 shadcn Sheet，等你确认「双击建筑」还是「单击」触发？',
        { row: 0, col: 2 },
      ),
      session(
        'isl_neuromorphic',
        'ses_orpc_setup',
        'oRPC router 与 mock 数据源接入',
        'idle',
        5,
        'listIslands / createSession / setStatus 三个 procedure 已通。',
        { row: 2, col: 0 },
      ),
      session(
        'isl_neuromorphic',
        'ses_old_sidebar',
        '旧版线性侧边栏原型',
        'archived',
        72,
        '被沙盘隐喻取代的初版历史列表，留档。',
        { row: 2, col: 2 },
      ),
    ],
  },
  {
    id: 'isl_mainline',
    name: 'mainline-console',
    coordinates: { x: 9, y: -3 },
    themeColor: '#0ea5e9',
    sessions: [
      session(
        'isl_mainline',
        'ses_daemon_release',
        'daemon 发布流程修复',
        'active',
        0.5,
        'launchd 入口与 mise shim 的耦合问题，正在改 release:daemon。',
        { row: 0, col: 0 },
      ),
      session(
        'isl_mainline',
        'ses_tracker_migration',
        'issue tracker 迁移到 GitHub issues',
        'waiting_user',
        3,
        'triage labels 已建好，等确认是否迁移存量 .scratch 票据。',
        { row: 0, col: 1 },
      ),
      session(
        'isl_mainline',
        'ses_console_home',
        '控制台首页时间线改版',
        'idle',
        26,
        '卡片布局已出稿，待排期。',
        { row: 2, col: 0 },
      ),
    ],
  },
  {
    id: 'isl_experiments',
    name: 'labs/experiments',
    coordinates: { x: -7, y: 7 },
    themeColor: '#8b5cf6',
    sessions: [
      session(
        'isl_experiments',
        'ses_mlx_local',
        'MLX 本地推理端点联调',
        'idle',
        9,
        'mlx-serve 11234 端口的模型列表已拉通。',
        { row: 0, col: 0 },
      ),
      session(
        'isl_experiments',
        'ses_old_canvas',
        '上古 canvas 实验归档',
        'archived',
        200,
        '第一版用 raw canvas 画的拓扑图，已冻结。',
        { row: 0, col: 1 },
      ),
    ],
  },
]

export interface SandboxDb {
  islands: Island[]
}

export const db: SandboxDb = { islands: mockIslands }

export function findIsland(id: string): Island | undefined {
  return db.islands.find((i) => i.id === id)
}

export function nextSessionNumber(): number {
  return db.islands.reduce(
    (n, i) => n + i.sessions.length,
    0,
  )
}
