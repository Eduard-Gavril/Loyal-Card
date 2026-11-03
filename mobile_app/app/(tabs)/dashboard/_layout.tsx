import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import TabStack from '@/ui/TabStack'

export default function Layout() {
  const { language } = useClientStore()
  return <TabStack title={getTranslation(language).dashboard.title} />
}
