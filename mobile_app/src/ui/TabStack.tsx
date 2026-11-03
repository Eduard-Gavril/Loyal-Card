import React from 'react'
import { Stack } from 'expo-router'
import { largeTitle, navBase } from './nav'

/** The stack inside one tab: its root screen gets the large collapsing title. */
export default function TabStack({ title }: { title: string }) {
  return (
    <Stack screenOptions={navBase as any}>
      <Stack.Screen name="index" options={{ title, ...(largeTitle as object) }} />
    </Stack>
  )
}
