import { useMemo, useState } from 'react'
import { iconNames, type IconName } from 'lucide-react/dynamic'
import { Search } from 'lucide-react'
import AppIcon from './AppIcon'
import { CURATED_ICON_NAMES } from '@/lib/icons'

interface IconPickerProps {
  value: string
  onChange: (name: IconName) => void
  searchPlaceholder: string
  noResultsLabel: string
}

// Two-level icon picker: a curated grid of the icons most relevant to loyalty
// businesses (shown by default), plus a search box that reaches into all ~2000
// Lucide icons on demand — nothing is excluded, but the common case needs no typing.
export default function IconPicker({ value, onChange, searchPlaceholder, noResultsLabel }: IconPickerProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CURATED_ICON_NAMES
    return iconNames.filter((n) => n.includes(q)).slice(0, 64)
  }, [query])

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div className="max-h-36 overflow-y-auto grid grid-cols-8 gap-1.5">
        {results.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
              value === name
                ? 'bg-purple-500/30 ring-2 ring-purple-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <AppIcon name={name} className="w-4 h-4 text-white" />
          </button>
        ))}
        {results.length === 0 && (
          <p className="col-span-8 text-center text-gray-400 text-xs py-3">{noResultsLabel}</p>
        )}
      </div>
    </div>
  )
}
