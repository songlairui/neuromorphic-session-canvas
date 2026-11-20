import { createFileRoute } from '@tanstack/react-router'
import { SandboxCanvas } from '@/components/sandbox/sandbox-canvas'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <SandboxCanvas />
    </div>
  )
}
