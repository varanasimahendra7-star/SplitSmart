// src/components/ui/Loader.jsx
export function Loader({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <Spinner />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner />
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-surface-border border-t-brand-500 rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-body">Loading…</span>
    </div>
  )
}