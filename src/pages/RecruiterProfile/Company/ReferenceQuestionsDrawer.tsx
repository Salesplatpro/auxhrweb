import React, { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import { RiDeleteBin6Line } from 'react-icons/ri'

import { TextInput } from '@/components/forms'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Switch } from '@/components/ui/Switch'
import {
  CompanyQuestion,
  emptyQuestion,
  MAX_GENERATED_QUESTIONS,
  MAX_QUESTION_LENGTH,
  QUESTION_TYPE_OPTIONS,
  questionListProblem,
  questionsToSave,
  ReferenceQuestionType,
  roomForQuestions,
} from '@/features/references/companyQuestions'
import {
  generateCompanyQuestions,
  saveCompanyQuestions,
} from '@/features/references/companyQuestionsService'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ReferenceQuestions.module.scss'

export const ReferenceQuestionsDrawer = ({
  organizationId,
  questions,
  onClose,
  onSaved,
}: {
  organizationId: string
  questions: CompanyQuestion[]
  onClose: () => void
  onSaved: (questions: CompanyQuestion[]) => void
}) => {
  const [draft, setDraft] = useState<CompanyQuestion[]>(
    questions.length ? questions : [emptyQuestion()],
  )
  const [count, setCount] = useState('3')
  const [isWriting, setIsWriting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const problem = questionListProblem(draft)
  const room = roomForQuestions(draft)
  const asked = Number(count)
  const countValid =
    Number.isInteger(asked) && asked >= 1 && asked <= MAX_GENERATED_QUESTIONS

  const change = (index: number, patch: Partial<CompanyQuestion>) =>
    setDraft((rows) =>
      rows.map((row, at) => (at === index ? { ...row, ...patch } : row)),
    )

  const remove = (index: number) =>
    setDraft((rows) => rows.filter((_, at) => at !== index))

  const write = async () => {
    setIsWriting(true)
    try {
      const drafted = await generateCompanyQuestions(
        organizationId,
        Math.min(asked, room),
      )
      setDraft((rows) => [...questionsToSave(rows), ...drafted])
    } catch (error) {
      notify('error', getErrorMessage(error, "We couldn't write questions."))
    } finally {
      setIsWriting(false)
    }
  }

  const save = async () => {
    setIsSaving(true)
    try {
      const saved = await saveCompanyQuestions(
        organizationId,
        questionsToSave(draft),
      )
      onSaved(saved)
      notify('success', 'Reference questions saved')
      onClose()
    } catch (error) {
      notify('error', getErrorMessage(error, "We couldn't save the questions."))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Reference questions"
      subtitle="Referees who were already sent questions keep the ones they got."
      footer={
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            loading={isSaving}
            disabled={!!problem}
            onClick={() => void save()}>
            Save questions
          </Button>
        </div>
      }>
      <div className={styles.stack}>
        {draft.map((row, index) => (
          <div key={row.key ?? `new-${index}`} className={styles.row}>
            <TextInput
              name={`question-${index}`}
              label={`question-${index}`}
              title={`Question ${index + 1}`}
              placeholder="e.g. How did you work together?"
              value={row.question}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) =>
                change(index, { question: event.target.value })
              }
            />
            <div className={styles.rowControls}>
              <SegmentedControl
                label={`Answer type for question ${index + 1}`}
                options={QUESTION_TYPE_OPTIONS}
                value={[row.type]}
                onChange={([type]) =>
                  type && change(index, { type: type as ReferenceQuestionType })
                }
              />
              <Switch
                label="Required"
                checked={row.required}
                onChange={(required) => change(index, { required })}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<RiDeleteBin6Line aria-hidden />}
                aria-label={`Remove question ${index + 1}`}
                onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <Button
            variant="outline"
            icon={<FaPlus aria-hidden />}
            disabled={room === 0}
            onClick={() => setDraft((rows) => [...rows, emptyQuestion()])}>
            Add a question
          </Button>
        </div>
        <div className={styles.ai}>
          <div className={styles.count}>
            <TextInput
              name="question-count"
              label="question-count"
              title="How many?"
              type="number"
              inputMode="numeric"
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            loading={isWriting}
            disabled={!countValid || room === 0}
            onClick={() => void write()}>
            Write with AI
          </Button>
        </div>
        <p className={styles.muted}>
          {room === 0
            ? 'You have the most questions allowed. Remove one to add more.'
            : `AI adds up to ${MAX_GENERATED_QUESTIONS} questions you can edit or remove before saving.`}
        </p>
        {problem && <p className={styles.muted}>{problem}</p>}
      </div>
    </Drawer>
  )
}
