import { Easing } from 'react-native-reanimated'

// Curves from the animation guidance: strong ease-out for UI, never ease-in.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1)

export const PRESS_IN_MS = 110 // press feedback: 100-150ms
export const PRESS_OUT_MS = 160
export const PRESS_SCALE = 0.97
