// src/components/ui/EmptyState.jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-surface-border flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-slate-500" />}
      </div>
      <h3 className="font-display font-semibold text-slate-300 text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-500 font-body text-sm max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}