import React, { useState } from 'react'
import useSWR from 'swr'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { QUESTION_TYPE_OPTIONS } from '@/features/references/companyQuestions'
import {
  companyQuestionsKey,
  fetchCompanyQuestions,
} from '@/features/references/companyQuestionsService'

import styles from './ReferenceQuestions.module.scss'
import { ReferenceQuestionsDrawer } from './ReferenceQuestionsDrawer'
import { SendQuestionsDrawer } from './SendQuestionsDrawer'

const typeLabel = (type: string) =>
  QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type

export const ReferenceQuestionsCard = ({
  organizationId,
}: {
  organizationId: string
}) => {
  const { data: questions = [], mutate } = useSWR(
    companyQuestionsKey(organizationId),
    () => fetchCompanyQuestions(organizationId),
    { revalidateOnFocus: false },
  )
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)

  return (
    <PagePanel
      title="Reference questions"
      hint="Sent to the referees your candidates name, for every job. Referees wait until you send them.">
      {questions.length === 0 ? (
        <p className={styles.muted}>
          No questions yet. Referees are saved and wait until you add questions
          and send them.
        </p>
      ) : (
        <ol className={styles.list}>
          {questions.map((item) => (
            <li key={item.key} className={styles.item}>
              {item.question}
              <span className={styles.meta}>
                {typeLabel(item.type)}
                {item.required ? '' : ' · optional'}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.actions}>
        <Button variant="outline" onClick={() => setEditing(true)}>
          {questions.length ? 'Edit questions' : 'Add questions'}
        </Button>
        <Button
          disabled={questions.length === 0}
          onClick={() => setSending(true)}>
          Send questions
        </Button>
      </div>
      {editing && (
        <ReferenceQuestionsDrawer
          organizationId={organizationId}
          questions={questions}
          onClose={() => setEditing(false)}
          onSaved={(saved) => void mutate(saved, { revalidate: false })}
        />
      )}
      {sending && (
        <SendQuestionsDrawer
          organizationId={organizationId}
          onClose={() => setSending(false)}
        />
      )}
    </PagePanel>
  )
}
