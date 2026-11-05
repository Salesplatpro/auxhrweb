import React, { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAiFeaturePrompts } from '@/features/admin/hooks/useAiModels'
import { AiFeature, AiPromptPart } from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './AiModels.module.scss'

const MIN_ROWS = 3
const MAX_ROWS = 24

const rowsFor = (text: string) =>
  Math.min(MAX_ROWS, Math.max(MIN_ROWS, text.split('\n').length + 1))

const PromptPartField: React.FC<{
  part: AiPromptPart
  value: string
  disabled: boolean
  onChange: (text: string) => void
}> = ({ part, value, disabled, onChange }) => (
  <div className={styles.promptPart}>
    <div className={styles.promptPartHeader}>
      <label htmlFor={`prompt-${part.key}`} className={styles.promptLabel}>
        {part.label}
      </label>
      {part.edited && <span className={styles.meta}>Edited</span>}
      {value !== part.defaultText && (
        <button
          type="button"
          className={styles.resetButton}
          disabled={disabled}
          onClick={() => onChange(part.defaultText)}>
          Reset to default
        </button>
      )}
    </div>
    {part.problem && (
      <p className={styles.notice}>
        The app is using the default instead, because {part.problem}.
      </p>
    )}
    <textarea
      id={`prompt-${part.key}`}
      className={styles.promptText}
      rows={rowsFor(value)}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
    {part.variables.length > 0 && (
      <ul className={styles.variables}>
        {part.variables.map((variable) => (
          <li key={variable.name}>
            <code>{`{{${variable.name}}}`}</code> {variable.description}
          </li>
        ))}
      </ul>
    )}
  </div>
)

const PromptEditor: React.FC<{
  feature: AiFeature
  onClose: () => void
  onSaved: () => void
}> = ({ feature, onClose, onSaved }) => {
  const { parts, error, isLoading, retry, savePrompts } = useAiFeaturePrompts(
    feature.key,
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const changedParts = (parts ?? []).filter(
    (part) => drafts[part.key] !== undefined && drafts[part.key] !== part.text,
  )

  const save = async () => {
    setIsSaving(true)
    try {
      await savePrompts(
        Object.fromEntries(
          changedParts.map((part) => [part.key, drafts[part.key] as string]),
        ),
      )
      notify('success', `${feature.name} prompt saved`)
      onSaved()
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not save this prompt'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${feature.name} prompt`}
      actions={
        <Button
          type="button"
          loading={isSaving}
          disabled={changedParts.length === 0}
          onClick={() => void save()}>
          Save
        </Button>
      }>
      {isLoading ? (
        <Spinner />
      ) : error || !parts ? (
        <EmptyState
          title="We couldn't load this prompt"
          description="Something went wrong on our side."
          action={<Button onClick={() => void retry()}>Try again</Button>}
        />
      ) : (
        <div className={styles.promptParts}>
          <p className={styles.description}>
            Changes apply to new AI requests within 30 seconds. The app fills in
            each {'{{placeholder}}'}, so they all have to stay. Keep the JSON
            fields in the output format too, because the app reads them.
          </p>
          {parts.map((part) => (
            <PromptPartField
              key={part.key}
              part={part}
              value={drafts[part.key] ?? part.text}
              disabled={isSaving}
              onChange={(text) =>
                setDrafts((current) => ({ ...current, [part.key]: text }))
              }
            />
          ))}
        </div>
      )}
    </Drawer>
  )
}

export const PromptDrawer: React.FC<{
  feature: AiFeature | null
  onClose: () => void
  onSaved: () => void
}> = ({ feature, onClose, onSaved }) =>
  feature ? (
    <PromptEditor
      key={feature.key}
      feature={feature}
      onClose={onClose}
      onSaved={onSaved}
    />
  ) : null
