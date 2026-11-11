import React from 'react'

import { SegmentedControl } from '@/components/ui/SegmentedControl'

import styles from './AiConfig.module.scss'
import { SCREENING_PRESETS, ScreeningPresetId } from './aiConfigPresets'

type ScreeningPresetsProps = {
  selected: ScreeningPresetId | 'custom'
  onSelect: (id: ScreeningPresetId) => void
}

export const ScreeningPresets = ({
  selected,
  onSelect,
}: ScreeningPresetsProps) => (
  <section className={styles.presetCard}>
    <span className={styles.presetLabel}>Preset</span>
    <SegmentedControl
      label="Screening preset"
      options={SCREENING_PRESETS.map((preset) => ({
        value: preset.id,
        label: preset.title,
      }))}
      value={selected === 'custom' ? [] : [selected]}
      onChange={([id]) => id && onSelect(id as ScreeningPresetId)}
    />
  </section>
)
