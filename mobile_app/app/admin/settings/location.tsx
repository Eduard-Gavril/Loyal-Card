import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import * as Location from 'expo-location'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { useSettings } from '@/lib/settingsContext'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import FormGroup from '@/ui/FormGroup'
import Button from '@/ui/Button'
import Field from '@/ui/Field'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

const BUSINESS_TYPES = ['cafe', 'food', 'beauty', 'gym', 'shop'] as const

/** Business type, short description and the position that makes the business appear in the partners list. */
export default function SettingsLocation() {
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const { form, setForm } = useSettings()
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')

  async function findPosition() {
    const address = form.address.trim()
    const city = form.city.trim()
    const postal = form.postal_code.trim()
    if (!address && !city) { setGeoMessage(a.positionNeedAddress); return }
    // most precise query first, then looser ones (without the postcode, then the city alone)
    const attempts = [[address, city, postal], [address, city], [address, postal], [city, postal], [city]]
      .map((parts) => parts.filter(Boolean).join(', '))
      .filter((q, i, all) => q && all.indexOf(q) === i)
    setGeoBusy(true)
    setGeoMessage('')
    try {
      for (const q of attempts) {
        const res = await Location.geocodeAsync(q)
        if (res.length > 0) {
          setForm((f) => ({ ...f, latitude: res[0].latitude, longitude: res[0].longitude }))
          return
        }
      }
      setGeoMessage(a.positionNotFound)
    } catch {
      setGeoMessage(a.positionNotFound)
    } finally {
      setGeoBusy(false)
    }
  }

  async function useMyPosition() {
    setGeoBusy(true)
    setGeoMessage('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setGeoMessage(a.positionDenied); return }
      const pos = await Location.getCurrentPositionAsync({})
      setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
    } catch {
      setGeoMessage(a.positionDenied)
    } finally {
      setGeoBusy(false)
    }
  }

  const hasPosition = form.latitude != null && form.longitude != null

  return (
    <ScreenScroll title={a.settingsLocation} bottomPad={48}>
      <FormGroup header={a.locTitle} footer={a.locDesc}>
        <View style={{ gap: 8 }}>
          <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
            {a.businessTypeLabel}
          </Txt>
          <View style={s.chipRow}>
            {BUSINESS_TYPES.map((ty) => {
              const selected = form.type === ty
              const label = { cafe: a.typeCafe, food: a.typeFood, beauty: a.typeBeauty, gym: a.typeGym, shop: a.typeShop }[ty]
              return (
                <PressableScale
                  key={ty}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  haptic="selection"
                  onPress={() => setForm((f) => ({ ...f, type: ty }))}
                  style={[s.chip, selected && s.chipOn]}
                >
                  <Txt v="subhead" tone={selected ? 'tint' : 'secondary'}>
                    {label}
                  </Txt>
                </PressableScale>
              )
            })}
          </View>
        </View>
        <Field label={a.bizDescriptionLabel} value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder={a.bizDescriptionPlaceholder} maxLength={120} />
        <Field label={a.addressLabel} value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v, latitude: null, longitude: null }))} />
        <Field label={a.cityLabel} value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v, latitude: null, longitude: null }))} />
        <Field label={a.postalLabel} value={form.postal_code} onChangeText={(v) => setForm((f) => ({ ...f, postal_code: v, latitude: null, longitude: null }))} />
        <Button variant="tinted" icon="search-outline" title={a.findPositionBtn} loading={geoBusy} onPress={findPosition} />
        <Button variant="plain" icon="locate-outline" title={a.useMyPositionBtn} disabled={geoBusy} onPress={useMyPosition} />
        {geoMessage ? (
          <Txt v="footnote" tone="danger">
            {geoMessage}
          </Txt>
        ) : null}
        <Txt v="footnote" tone={hasPosition ? 'secondary' : 'tint'}>
          {hasPosition ? a.positionSet(form.latitude as number, form.longitude as number) : a.positionMissing}
        </Txt>
      </FormGroup>
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 },
  chip: { paddingHorizontal: 14, minHeight: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
})
