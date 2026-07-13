import { useEffect, useRef, ReactNode } from 'react'
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { DeviceMotion } from 'expo-sensors'

interface TiltCardProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** Optional entrance-animation opacity, owned by the caller. */
  opacity?: Animated.Value | Animated.AnimatedInterpolation<string | number>
  /** Optional entrance-animation scale, owned by the caller. */
  scale?: Animated.Value | Animated.AnimatedInterpolation<string | number>
  sheenColor?: string
}

/**
 * Wraps a card with a gyroscope-driven 3D tilt + a glossy highlight that
 * drifts opposite the tilt, mimicking light catching a foil card surface.
 * Calibrates against the device's orientation at mount time (relative
 * movement), not absolute world orientation, and degrades to a static card
 * with no error when the device has no gyroscope.
 */
export default function TiltCard({ children, style, opacity, scale, sheenColor = 'rgba(255,255,255,0.10)' }: TiltCardProps) {
  const tiltX = useRef(new Animated.Value(0)).current
  const tiltY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let subscription: { remove: () => void } | null = null
    let cancelled = false
    const baseline = { current: null as { beta: number; gamma: number } | null }

    DeviceMotion.isAvailableAsync().then((available) => {
      if (!available || cancelled) return
      DeviceMotion.setUpdateInterval(50)
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return
        const { beta, gamma } = rotation
        if (!baseline.current) {
          baseline.current = { beta, gamma }
          return
        }
        const CLAMP = 0.35 // ~20°, keeps the effect from tracking wild swings
        const MAX_DEG = 10
        const dBeta = Math.max(-CLAMP, Math.min(CLAMP, beta - baseline.current.beta))
        const dGamma = Math.max(-CLAMP, Math.min(CLAMP, gamma - baseline.current.gamma))
        Animated.spring(tiltX, {
          toValue: (dBeta / CLAMP) * MAX_DEG,
          useNativeDriver: true, speed: 18, bounciness: 5,
        }).start()
        Animated.spring(tiltY, {
          toValue: (dGamma / CLAMP) * -MAX_DEG,
          useNativeDriver: true, speed: 18, bounciness: 5,
        }).start()
      })
    })

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  const rotateXDeg = tiltX.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] })
  const rotateYDeg = tiltY.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] })
  const sheenX = tiltY.interpolate({ inputRange: [-10, 10], outputRange: [-40, 40] })
  const sheenY = tiltX.interpolate({ inputRange: [-10, 10], outputRange: [-30, 30] })

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacity ?? 1,
          transform: [
            { perspective: 900 },
            { rotateX: rotateXDeg },
            { rotateY: rotateYDeg },
            ...(scale ? [{ scale }] : []),
          ],
        },
      ]}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sheen,
          { backgroundColor: sheenColor },
          { transform: [{ translateX: sheenX }, { translateY: sheenY }] },
        ]}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute', top: '50%', left: '50%',
    width: 260, height: 260, marginLeft: -130, marginTop: -130,
    borderRadius: 130,
  },
})
