// src/components/ui/CategoryBadge.jsx
const CATEGORY_STYLES = {
  Food:      'bg-orange-500/15 text-orange-400',
  Travel:    'bg-blue-500/15 text-blue-400',
  Rent:      'bg-purple-500/15 text-purple-400',
  Utilities: 'bg-yellow-500/15 text-yellow-400',
  Fun:       'bg-pink-500/15 text-pink-400',
  Shopping:  'bg-cyan-500/15 text-cyan-400',
  Other:     'bg-slate-500/15 text-slate-400',
}

export const CATEGORIES = Object.keys(CATEGORY_STYLES)

export function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other
  return (
    <span className={`badge ${style}`}>{category || 'Other'}</span>
  )
}