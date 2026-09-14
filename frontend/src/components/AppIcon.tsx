import { DynamicIcon } from 'lucide-react/dynamic'
import { resolveIconName, DEFAULT_ICON_NAME } from '@/lib/icons'

interface AppIconProps {
  name?: string | null
  className?: string
}

// Renders a product/category icon by name, transparently upgrading legacy emoji
// values (or anything unrecognized) to a sensible Lucide icon.
export default function AppIcon({ name, className }: AppIconProps) {
  const resolved = resolveIconName(name)
  return (
    <DynamicIcon
      name={resolved}
      className={className}
      fallback={() => <DynamicIcon name={DEFAULT_ICON_NAME} className={className} />}
    />
  )
}
