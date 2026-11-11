import { Field, FieldArray, setIn, useFormikContext } from 'formik'
import React from 'react'
import { FaPlus } from 'react-icons/fa6'
import { RiDeleteBin6Line } from 'react-icons/ri'

import { Button } from '@/components/ui/Button'

import styles from './AiConfig.module.scss'
import {
  AiConfigFieldValues,
  COUNT_FIELD,
  DICHOTOMY_PAIRS,
  PAIR_LABEL,
  personalityTotal,
  splitPersonalityCount,
} from './aiConfigModel'
import { NumberField } from './ScreeningControls'
import useGeneratedQuestion from './useGeneratedQuestion'

type PersonalityProps = {
  values: AiConfigFieldValues
  fieldName: (key: keyof AiConfigFieldValues) => string
}

/** One question count, spread evenly across the four traits. */
export const PersonalityCountField = ({
  values,
  fieldName,
  dichotomyError,
}: PersonalityProps & { dichotomyError?: string }) => {
  const { setValues } = useFormikContext<Record<string, unknown>>()
  const total = personalityTotal(values)

  // One atomic update: four setFieldValue calls would each validate against
  // stale values, leaving a wrong "no personality questions" error behind.
  const setTotal = (raw: string) => {
    const split = splitPersonalityCount(raw === '' ? 0 : Number(raw) || 0)
    void setValues((previous) =>
      DICHOTOMY_PAIRS.reduce(
        (next, pair) =>
          setIn(next, fieldName(COUNT_FIELD[pair]), split[COUNT_FIELD[pair]]),
        previous,
      ),
    )
  }

  return (
    <>
      <NumberField
        inline
        name="personalityTotal"
        label="Number of questions"
        min={1}
        max={40}
        value={total > 0 ? total : ''}
        onValueChange={setTotal}
      />
      {dichotomyError && (
        <div className={styles.fieldError} role="alert">
          {dichotomyError}
        </div>
      )}
    </>
  )
}

/** Per-trait counts, preview questions and the recruiter's own questions. */
export const PersonalityAdvanced = ({
  values,
  fieldName,
  jobId,
}: PersonalityProps & { jobId?: string }) => {
  const { questionsByPair, generateQuestion, removeQuestion, loadingPairs } =
    useGeneratedQuestion(jobId)
  const isPreviewing = Object.values(loadingPairs).some(Boolean)
  const pairsToPreview = DICHOTOMY_PAIRS.filter((pair) => {
    const count = Number(values[COUNT_FIELD[pair]])
    return count > 0 && !(questionsByPair[pair]?.length > 0)
  })
  const hasPreview = DICHOTOMY_PAIRS.some(
    (pair) => questionsByPair[pair]?.length > 0,
  )

  const previewQuestions = () =>
    Promise.all(
      pairsToPreview.map((pair) =>
        generateQuestion(pair, Number(values[COUNT_FIELD[pair]])),
      ),
    )

  return (
    <>
      <div className={styles.fieldGroup}>
        <p className={styles.label}>Personality questions per trait</p>
        <div className={styles.traitGrid}>
          {DICHOTOMY_PAIRS.map((pair) => (
            <NumberField
              key={pair}
              name={fieldName(COUNT_FIELD[pair])}
              label={PAIR_LABEL[pair].title}
              min={1}
              hint={PAIR_LABEL[pair].help}
            />
          ))}
        </div>
      </div>

      {jobId && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <p className={styles.previewTitle}>Preview the questions</p>
            {pairsToPreview.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isPreviewing}
                onClick={() => void previewQuestions()}>
                Write preview questions
              </Button>
            )}
          </div>
          <p className={styles.hint}>
            Optional. If you skip this, questions are written automatically when
            the first candidate reaches this step. Any you remove here
            won&apos;t be asked.
          </p>
          {hasPreview &&
            DICHOTOMY_PAIRS.filter(
              (pair) => questionsByPair[pair]?.length > 0,
            ).map((pair) => (
              <div key={pair} className={styles.previewGroup}>
                <p className={styles.previewTrait}>{PAIR_LABEL[pair].title}</p>
                <ul className={styles.previewList}>
                  {questionsByPair[pair].map((question) => (
                    <li key={question.id} className={styles.previewItem}>
                      <span>{question.question}</span>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => void removeQuestion(pair, question.id)}
                        aria-label={`Remove question: ${question.question}`}>
                        <RiDeleteBin6Line />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}

      <FieldArray name={fieldName('uploadedQuestions')}>
        {({ remove, push }) => (
          <div className={styles.fieldGroup}>
            <p className={styles.label}>Your own questions (optional)</p>
            <p className={styles.tip}>
              Tip: ask anything specific you always want to know, e.g. “Are you
              comfortable working weekends during peak season?”
            </p>
            <div className={styles.questionsList}>
              {values.uploadedQuestions?.map((_, index) => (
                <div key={index} className={styles.questionItem}>
                  <Field
                    name={`${fieldName('uploadedQuestions')}.${index}`}
                    className={styles.questionInput}
                    placeholder={`Question ${index + 1}`}
                    aria-label={`Your question ${index + 1}`}
                  />
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => remove(index)}
                    aria-label={`Remove question ${index + 1}`}>
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => push('')}>
              <FaPlus /> Add a question
            </button>
          </div>
        )}
      </FieldArray>
    </>
  )
}
