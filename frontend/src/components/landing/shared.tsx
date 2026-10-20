import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { content, type Copy, type Lang } from './content'
import { ui, type Ui } from './ui'

export function useLang(): Lang {
  const { language } = useClientStore()
  return language === 'it' || language === 'ro' ? language : 'en'
}

/** Strings written for this preview (hero, steps, examples). */
export function useCopy(): Copy {
  return content[useLang()]
}

export function useUi(): Ui {
  return ui[useLang()]
}

/** The site's own translations (FAQ, results, footer...). Reused as-is so the preview never drifts from the real site. */
export function useT() {
  return getTranslation(useLang())
}

/** Picks one of three inline strings, in the order used across the site: it, en, ro. */
export function useL() {
  const lang = useLang()
  return (it: string, en: string, ro: string) => (lang === 'it' ? it : lang === 'ro' ? ro : en)
}
