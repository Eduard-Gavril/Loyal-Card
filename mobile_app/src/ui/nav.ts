import { Platform } from 'react-native'
import { colors } from '@/theme'

/**
 * Native navigation bar options, shared by every stack.
 * iOS: a transparent bar with only the back / action buttons; the page title is the first thing in the content
 * (see ScreenScroll `title`), so it scrolls away with the page instead of staying fixed. Android: a plain opaque Material bar with the title.
 * The bars are the functional layer; the content stays flat.
 */
export const navBase: Record<string, unknown> = {
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.label },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  headerBackButtonDisplayMode: 'minimal',
  ...(Platform.OS === 'ios'
    ? {
        headerTransparent: true,
        headerBlurEffect: 'systemChromeMaterialDark',
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerLargeTitleStyle: { color: colors.label },
      }
    : { headerStyle: { backgroundColor: colors.bg } }),
}

/** List / overview screens. iOS: no title in the bar (it is drawn in the content). Android: the bar shows the title. */
export const largeTitle: Record<string, unknown> =
  Platform.OS === 'ios' ? { headerLargeTitleEnabled: false, headerTitle: '' } : {}

/** Detail screens: same rule. */
export const inlineTitle: Record<string, unknown> = Platform.OS === 'ios' ? { headerLargeTitleEnabled: false, headerTitle: '' } : {}
