import React, { useState } from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAiSkills } from '@/features/admin/hooks/useAiModels'
import { AiSkill } from '@/features/admin/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './AiModels.module.scss'

const jobsLine = (skill: AiSkill) =>
  `Used by ${skill.usedBy.length} job${skill.usedBy.length === 1 ? '' : 's'}`

const SkillDrawer: React.FC<{
  skill: AiSkill
  onSave: (key: string, text: string) => Promise<void>
  onClose: () => void
}> = ({ skill, onSave, onClose }) => {
  const [text, setText] = useState(skill.text)
  const [isSaving, setIsSaving] = useState(false)

  const save = async () => {
    setIsSaving(true)
    try {
      await onSave(skill.key, text)
      notify('success', `${skill.label} saved`)
      onClose()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not save this skill'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={skill.label}
      subtitle={skill.description}
      actions={
        <Button
          type="button"
          loading={isSaving}
          disabled={text === skill.text}
          onClick={() => void save()}>
          Save
        </Button>
      }>
      <div className={styles.promptParts}>
        <p className={styles.description}>
          This text goes before the instructions of every job that uses it, and
          changes apply to new AI requests within 30 seconds. Skills can&apos;t
          use {'{{placeholders}}'}.
        </p>
        <div className={styles.promptPart}>
          <div className={styles.promptPartHeader}>
            <label
              htmlFor={`skill-${skill.key}`}
              className={styles.promptLabel}>
              Skill text
            </label>
            {skill.edited && <span className={styles.meta}>Edited</span>}
            {text !== skill.defaultText && (
              <button
                type="button"
                className={styles.resetButton}
                disabled={isSaving}
                onClick={() => setText(skill.defaultText)}>
                Reset to default
              </button>
            )}
          </div>
          <textarea
            id={`skill-${skill.key}`}
            className={styles.promptText}
            rows={8}
            value={text}
            disabled={isSaving}
            onChange={(event) => setText(event.target.value)}
          />
          <p className={styles.meta}>
            {jobsLine(skill)}:{' '}
            {skill.usedBy.map((job) => job.name).join(', ') || 'none yet'}
          </p>
        </div>
      </div>
    </Drawer>
  )
}

export const SkillsPanel: React.FC = () => {
  const { skills, error, isLoading, retry, saveSkill } = useAiSkills()
  const [editing, setEditing] = useState<AiSkill | null>(null)

  return (
    <PagePanel
      title="Skills"
      hint="Instructions several jobs share. Edit one here and every job that uses it changes.">
      {isLoading ? (
        <Skeleton height={160} />
      ) : error || !skills ? (
        <EmptyState
          title="We couldn't load the skills"
          description="Something went wrong on our side."
          action={<Button onClick={() => void retry()}>Try again</Button>}
        />
      ) : (
        <ul className={styles.features}>
          {skills.map((skill) => (
            <li key={skill.key} className={styles.feature}>
              <div className={styles.about}>
                <p className={styles.name}>{skill.label}</p>
                <p className={styles.description}>{skill.description}</p>
                <p className={styles.meta}>
                  {jobsLine(skill)}
                  {skill.edited ? ' · Edited' : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(skill)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <SkillDrawer
          key={editing.key}
          skill={editing}
          onSave={saveSkill}
          onClose={() => setEditing(null)}
        />
      )}
    </PagePanel>
  )
}
