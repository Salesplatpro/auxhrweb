import React, { useEffect } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { AssessmentStatus } from '@/pages/TalentProfile/TalentAssessment/AssessmentForm'
import {
  CompanyAssessmentKind,
  useCompanyAssessmentQuestionsQuery,
  useSubmitCompanyAssessmentAnswersMutation,
} from '@/redux/api/talent'
import { getErrorCode, getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { TestKindConfig } from './kinds'
import { OptionList } from './OptionList/OptionList'
import { QuestionStep } from './QuestionStep/QuestionStep'
import { useApplicationTestsStore, useTestDraft } from './store'

interface ChoiceQuestion {
  id: string
  question: string
  options: string[]
}

type ChoiceTestProps = {
  jobId: string
  kind: CompanyAssessmentKind
  config: TestKindConfig
  context: string
  draftKey: string
  onFinished: (answered: number) => void
}

const statusOf = (error: unknown) =>
  (error as { status?: number } | undefined)?.status

export const ChoiceTest = ({
  jobId,
  kind,
  config,
  context,
  draftKey,
  onFinished,
}: ChoiceTestProps) => {
  const { data, error, isLoading, isFetching, refetch } =
    useCompanyAssessmentQuestionsQuery({ jobId, type: kind })
  const [submitAnswers, { isLoading: submitting }] =
    useSubmitCompanyAssessmentAnswersMutation()
  const draft = useTestDraft(draftKey)
  const { setAnswer, setIndex, keepOnly, clear } = useApplicationTestsStore()

  const questions: ChoiceQuestion[] = data?.data?.questions ?? []
  const ids = questions.map((question) => question.id).join(',')

  useEffect(() => {
    if (ids) keepOnly(draftKey, ids.split(','))
  }, [ids, draftKey, keepOnly])

  if (isLoading || (isFetching && questions.length === 0))
    return <Spinner fullPage />

  if (error || questions.length === 0) {
    return (
      <AssessmentStatus
        error
        message={getErrorMessage(error, 'We couldn’t load this test.')}
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    )
  }

  const index = Math.min(draft.index, questions.length - 1)
  const question = questions[index]!
  const selected = draft.answers[question.id]
  const isLast = index === questions.length - 1
  const finish = () => {
    clear(draftKey)
    onFinished(questions.length)
  }

  const handleNext = async () => {
    if (!isLast) {
      setIndex(draftKey, index + 1)
      return
    }
    try {
      await submitAnswers({
        jobId,
        type: kind,
        answers: Object.fromEntries(
          questions.map((item) => [item.id, Number(draft.answers[item.id])]),
        ),
      }).unwrap()
      finish()
    } catch (submitError) {
      if (
        statusOf(submitError) === 409 &&
        getErrorCode(submitError) !== 'ASSESSMENT_NOT_READY'
      ) {
        finish()
        return
      }
      notify(
        'error',
        getErrorMessage(
          submitError,
          'We couldn’t send your answers. Try again.',
        ),
      )
      if (/reload/i.test(getErrorMessage(submitError, ''))) void refetch()
    }
  }

  return (
    <QuestionStep
      kind={config}
      context={context}
      index={index}
      total={questions.length}
      question={question.question}
      hint="Pick one answer. You can go back before you submit."
      canGoNext={typeof selected === 'number'}
      isLast={isLast}
      submitting={submitting}
      onBack={() => setIndex(draftKey, index - 1)}
      onNext={() => void handleNext()}>
      <OptionList
        name={question.id}
        options={question.options}
        selected={typeof selected === 'number' ? selected : undefined}
        onSelect={(value) => setAnswer(draftKey, question.id, value)}
      />
    </QuestionStep>
  )
}
