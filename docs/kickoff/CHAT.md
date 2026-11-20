# CHAT · 缘起对话记录

> 用户 2026-11-21 提供的完整项目规格（原文整理，作为需求基线）。

## Project Overview: Neuromorphic Spatial Session Canvas (沙盘式会话管理器)

### 1. Core Vision & Metaphor

替代传统线性侧边栏历史记录，打造一个基于脑科学空间记忆（海马体位置细胞/相对方位锚定）的 2.5D 等轴测（Isometric）会话沙盘。

- **沙盘群岛（Archipelago / Group Islands）**：每个顶级项目或文件夹是一座相对独立的岛屿或地块。
- **建筑节点（Building / Session Nodes）**：岛屿上的每个会话（Chat/Agent Session）是一座等轴建筑或立体方块。
- **空间注意力机制**：
  - 活跃中/等待人类决策的会话：建筑有脉冲光环或处于高层级地块，视觉显著性最高。
  - 冷却/已完成的会话：随时间推移逐渐隐入地平线或缩微为基础几何体，减少注意力抢占。

### 2. Tech Stack

- Framework: TanStack Start (Fullstack React on Nitro/Vite)
- API & RPC: oRPC (Type-safe, OpenAPI contract-first)
- UI & Styling: Tailwind CSS v4 + shadcn/ui + Base UI primitives
- Rendering / Viewport: Isometric 2.5D CSS Transforms 或轻量等轴 Canvas（推荐以 Tailwind + CSS Matrix3d 配合拖拽缩放平移交互为 MVP 起步，保持与 DOM UI 的无缝结合）
- Icons & Theme: Lucide React, 暗色沙盘风格

### 3. Data Models (oRPC Contracts)

- **Island** (Project / Folder Group):
  - `id: string`
  - `name: string`
  - `coordinates: { x: number, y: number }` (Grid or World space)
  - `themeColor: string`
  - `sessions: SessionNode[]`
- **SessionNode** (Chat / Task Instance):
  - `id: string`
  - `islandId: string`
  - `title: string`
  - `status: 'active' | 'waiting_user' | 'idle' | 'archived'`
  - `lastActivityAt: string`
  - `previewSnippet: string`
  - `localPos: { row: number, col: number }` (Isometric grid offset within the island)

### 4. Key Functional Modules for MVP

1. **Isometric Viewport**：支持整个沙盘世界平移（Pan）、缩放（Zoom）和归中（Center on active task）。等轴投影网格系统（Isometric Grid），保证地块与建筑对齐。
2. **Island & Session Rendering**：岛屿地块有立体厚度与标牌。会话卡片/建筑悬浮显示预览，双击平滑推进并聚焦展开侧边会话面板。
3. **Quick Creation & Minimap**：一键在指定岛屿上落座一个"新会话建筑"。右下角沙盘小地图（Minimap），快速定位远端岛屿。

### 5. Development Steps

1. 初始化 TanStack Start 工程并接入 Tailwind CSS + shadcn/ui。
2. 定义 oRPC router 与 mock 数据源（3座不同主题的岛屿，每座岛分布 2~5 个不同状态的会话节点）。
3. 实现 Isometric Viewport 容器组件与拖拽平移/滚轮缩放状态机。
4. 渲染等轴岛屿与立体会话建筑，并加入状态视觉反馈（活跃高亮、静止弱化）。
5. 接入会话点击与聚焦抽屉面板。
