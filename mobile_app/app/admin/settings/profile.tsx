import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { useSettings } from '@/lib/settingsContext'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import FormGroup from '@/ui/FormGroup'
import Field from '@/ui/Field'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

const PRESET_COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#2563eb', '#4f46e5']

/** Branding, welcome message, visibility and a live preview of the business card. */
export default function SettingsProfile() {
  const { language } = useClientStore()
  const a = getTranslation(language).admin
  const { form, setForm, canLogo, deletionScheduledAt } = useSettings()

  return (
    <ScreenScroll title={a.settingsProfile} bottomPad={48}>
      <FormGroup header={a.brandingTitle}>
        <Field label={a.shopNameLabel} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Nome del negozio" />
        <View style={{ gap: 6 }}>
          <Field
            label={a.logoUrlLabel}
            value={form.logo_url}
            editable={canLogo}
            onChangeText={(v) => setForm((f) => ({ ...f, logo_url: v }))}
            placeholder="https://..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={!canLogo ? { opacity: 0.5 } : undefined}
          />
          {!canLogo && (
            <Txt v="footnote" tone="tint" style={{ marginLeft: 4 }}>
              {a.planLogoLocked}
            </Txt>
          )}
        </View>
        <View style={{ gap: 8 }}>
          <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
            {a.primaryColorLabel}
          </Txt>
          <View style={s.colorRow}>
            {PRESET_COLORS.map((c) => {
              const selected = form.brand_color === c
              return (
                <PressableScale
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={c}
                  accessibilityState={{ selected }}
                  haptic="selection"
                  onPress={() => setForm((f) => ({ ...f, brand_color: c }))}
                  hitSlop={4}
                  style={[s.colorDot, { backgroundColor: c }, selected && s.colorDotActive]}
                >
                  {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </PressableScale>
              )
            })}
          </View>
        </View>
        <Field value={form.brand_color} onChangeText={(v) => setForm((f) => ({ ...f, brand_color: v }))} placeholder="#7c3aed" autoCapitalize="none" autoCorrect={false} accessibilityLabel={a.primaryColorLabel} />
      </FormGroup>

      <FormGroup header={a.welcomeMsgTitle}>
        <Field value={form.welcome_message} onChangeText={(v) => setForm((f) => ({ ...f, welcome_message: v }))} placeholder={a.welcomeMsgPlaceholder} multiline accessibilityLabel={a.welcomeMsgTitle} />
      </FormGroup>

      {!deletionScheduledAt && (
        <ListGroup header={a.shopStatusTitle} footer={form.active ? a.shopVisibleLabel : a.shopHiddenLabel}>
          <ListRow icon="storefront-outline" title={a.shopActiveLabel} switchValue={form.active} onSwitchChange={(v) => setForm((f) => ({ ...f, active: v }))} />
        </ListGroup>
      )}

      <View style={{ marginBottom: 8 }}>
        <Txt v="footnote" tone="secondary" style={s.groupHeader}>
          {a.previewTitle.toUpperCase()}
        </Txt>
        <View style={[s.preview, { borderColor: form.brand_color + '55' }]}>
          <View style={[s.previewBadge, { backgroundColor: form.brand_color + '33' }]}>
            <Txt v="title3" style={{ color: form.brand_color }}>
              {form.name.charAt(0).toUpperCase() || '?'}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="headline" numberOfLines={1}>
              {form.name || 'Nome negozio'}
            </Txt>
            {form.welcome_message ? (
              <Txt v="footnote" tone="secondary" numberOfLines={2}>
                {form.welcome_message}
              </Txt>
            ) : null}
          </View>
          <View style={[s.previewDot, { backgroundColor: form.active ? colors.success : colors.labelTertiary }]} />
        </View>
      </View>
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  groupHeader: { marginLeft: 16, marginBottom: 6 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 },
  colorDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, backgroundColor: colors.grouped },
  previewBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
})
