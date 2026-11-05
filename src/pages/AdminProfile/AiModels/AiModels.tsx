import React, { useMemo, useState } from 'react'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAiModels } from '@/features/admin/hooks/useAiModels'
import {
  AiChoice,
  AiFeature,
  AiModelOption,
  AiProviderSummary,
} from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './AiModels.module.scss'
import { PromptDrawer } from './PromptDrawer'

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const RetiringNote: React.FC<{
  option: AiModelOption
  options: AiModelOption[]
}> = ({ option, options }) => {
  if (!option.retiresOn) return null
  const replacement = options.find((item) => item.model === option.replacement)
  return (
    <p className={styles.retiring}>
      {option.label} shuts down on {formatDate(option.retiresOn)}.
      {replacement ? ` Its replacement is ${replacement.label}.` : ''}
    </p>
  )
}

const FeatureRow: React.FC<{
  feature: AiFeature
  providers: AiProviderSummary[]
  onSave: (key: string, choice: AiChoice) => Promise<void>
  onEditPrompt: (feature: AiFeature) => void
}> = ({ feature, providers, onSave, onEditPrompt }) => {
  const [choice, setChoice] = useState<AiChoice>(feature.current)
  const [isSaving, setIsSaving] = useState(false)

  const providerChoices = providers.filter((provider) =>
    feature.options.some((option) => option.provider === provider.key),
  )
  const modelChoices = feature.options.filter(
    (option) => option.provider === choice.provider,
  )
  const currentOption = feature.options.find(
    (option) =>
      option.provider === feature.current.provider &&
      option.model === feature.current.model,
  )
  const isChanged =
    choice.provider !== feature.current.provider ||
    choice.model !== feature.current.model

  const changeProvider = (provider: string) => {
    const first = feature.options.find((option) => option.provider === provider)
    if (first) setChoice({ provider, model: first.model })
  }

  const save = async () => {
    setIsSaving(true)
    try {
      await onSave(feature.key, choice)
      notify('success', `${feature.name} saved`)
    } catch (err) {
      notify('error', getErrorMessage(err, `Could not save ${feature.name}`))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <li className={styles.feature}>
      <div className={styles.about}>
        <h3 className={styles.name}>{feature.name}</h3>
        <p className={styles.description}>{feature.description}</p>
        {feature.notice && (
          <p className={styles.notice}>
            Using the default model because {feature.notice}.
          </p>
        )}
        {feature.lockedReason && (
          <p className={styles.description}>{feature.lockedReason}</p>
        )}
        {feature.updatedAt && (
          <p className={styles.meta}>
            Model changed on {formatDate(feature.updatedAt)}
            {feature.updatedByName ? ` by ${feature.updatedByName}` : ''}
          </p>
        )}
        {feature.editedPromptParts > 0 && (
          <p className={styles.meta}>Prompt edited</p>
        )}
        {currentOption && (
          <RetiringNote option={currentOption} options={feature.options} />
        )}
      </div>

      <div className={styles.controls}>
        {feature.lockedReason ? (
          <p className={styles.locked}>
            {currentOption?.label ?? feature.current.model}
          </p>
        ) : (
          <>
            <label className={styles.field}>
              <span>Provider</span>
              <select
                value={choice.provider}
                disabled={isSaving}
                onChange={(event) => changeProvider(event.target.value)}>
                {providerChoices.map((provider) => (
                  <option
                    key={provider.key}
                    value={provider.key}
                    disabled={!provider.configured}>
                    {provider.configured
                      ? provider.name
                      : `${provider.name} (add ${provider.envKey})`}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Model</span>
              <select
                value={choice.model}
                disabled={isSaving}
                onChange={(event) =>
                  setChoice({ ...choice, model: event.target.value })
                }>
                {modelChoices.map((option) => (
                  <option key={option.model} value={option.model}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="sm"
              type="button"
              loading={isSaving}
              disabled={!isChanged}
              onClick={() => void save()}>
              Test and save
            </Button>
          </>
        )}
        {feature.promptParts > 0 && (
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onEditPrompt(feature)}>
            Edit prompt
          </Button>
        )}
      </div>
    </li>
  )
}

const AiModels = () => {
  const { overview, error, isLoading, retry, saveFeature } = useAiModels()
  const [editing, setEditing] = useState<AiFeature | null>(null)

  const groups = useMemo(() => {
    const byGroup = new Map<string, AiFeature[]>()
    for (const feature of overview?.features ?? []) {
      byGroup.set(feature.group, [
        ...(byGroup.get(feature.group) ?? []),
        feature,
      ])
    }
    return [...byGroup.entries()]
  }, [overview])

  const header = (
    <PageHeaderTitle
      title="AI Models"
      description="Choose which provider and model does each AI job in the app, and what it is told to do."
    />
  )

  if (error && !overview) {
    return (
      <div className={styles.page}>
        {header}
        <PagePanel>
          <EmptyState
            title="We couldn't load the AI models"
            description="Something went wrong on our side."
            action={<Button onClick={() => void retry()}>Try again</Button>}
          />
        </PagePanel>
      </div>
    )
  }

  if (isLoading || !overview) {
    return (
      <div className={styles.page}>
        {header}
        <Skeleton height={320} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {header}

      <PagePanel title="Providers">
        <ul className={styles.providers}>
          {overview.providers.map((provider) => (
            <li key={provider.key} className={styles.provider}>
              <a href={provider.docsUrl} target="_blank" rel="noreferrer">
                {provider.name}
              </a>
              <span
                className={
                  provider.configured ? styles.configured : styles.missing
                }>
                {provider.configured
                  ? 'Ready'
                  : `Add ${provider.envKey} to the environment`}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.meta}>
          Model list checked against each provider&apos;s official page on{' '}
          {formatDate(overview.verifiedOn)}.
        </p>
      </PagePanel>

      {groups.map(([group, features]) => (
        <PagePanel key={group} title={group}>
          <ul className={styles.features}>
            {features.map((feature) => (
              <FeatureRow
                key={feature.key}
                feature={feature}
                providers={overview.providers}
                onSave={saveFeature}
                onEditPrompt={setEditing}
              />
            ))}
          </ul>
        </PagePanel>
      ))}

      <PromptDrawer
        feature={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void retry()}
      />
    </div>
  )
}

export default AiModels
