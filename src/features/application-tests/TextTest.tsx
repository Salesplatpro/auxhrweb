import React, { useEffect } from 'react'

import { TextArea } from '@/components/forms/TextArea'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { AssessmentStatus } from '@/pages/TalentProfile/TalentAssessment/AssessmentForm'
import {
  useEnsurePersonalityQuestionsMutation,
  useGeneratePersonalizedTestQuery,
  usePersonalityTestQuery,
  usePostPersonalityTestMutation,
  usePostPersonalizedTestMutation,
} from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { TestKindConfig } from './kinds'
import { QuestionStep } from './QuestionStep/QuestionStep'
import { useApplicationTestsStore, useTestDraft } from './store'

interface TextQuestion {
  id: string
  question: string
}

type TextTestProps = {
  jobId: string
  kind: 'tailored' | 'personality'
  config: TestKindConfig
  context: string
  draftKey: string
  onFinished: (answered: number) => void
}

const useTextQuestions = (jobId: string, kind: TextTestProps['kind']) => {
  const talentId = useAuthStore((state) => state.user)?.id
  const tailored = useGeneratePersonalizedTestQuery(
    { jobId, talentId },
    { skip: kind !== 'tailored' || !talentId },
  )
  const personality = usePersonalityTestQuery(jobId, {
    skip: kind !== 'personality',
  })
  const [ensurePersonality] = useEnsurePersonalityQuestionsMutation()
  const query = kind === 'tailored' ? tailored : personality
  const questions: TextQuestion[] =
    kind === 'tailored'
      ? tailored.data?.data?.application?.questions ??
        tailored.data?.data?.questions ??
        []
      : personality.data?.data?.questions ?? []
  const empty =
    kind === 'personality' && !personality.isLoading && questions.length === 0

  useEffect(() => {
    if (empty) {
      void ensurePersonality(jobId)
        .unwrap()
        .then(() => personality.refetch())
        .catch(() => undefined)
    }
  }, [empty, jobId])

  return {
    questions,
    error: query.error,
    loading: query.isLoading || empty,
    refetch: query.refetch,
  }
}

export const TextTest = ({
  jobId,
  kind,
  config,
  context,
  draftKey,
  onFinished,
}: TextTestProps) => {
  const { questions, error, loading, refetch } = useTextQuestions(jobId, kind)
  const [postTailored, tailoredState] = usePostPersonalizedTestMutation()
  const [postPersonality, personalityState] = usePostPersonalityTestMutation()
  const draft = useTestDraft(draftKey)
  const { setAnswer, setIndex, keepOnly, clear } = useApplicationTestsStore()
  const ids = questions.map((question) => question.id).join(',')

  useEffect(() => {
    if (ids) keepOnly(draftKey, ids.split(','))
  }, [ids, draftKey, keepOnly])

  if (loading) return <Spinner fullPage />
  if (error || questions.length === 0) {
    return (
      <AssessmentStatus
        error
        message={getErrorMessage(error, 'We couldn’t load these questions.')}
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    )
  }

  const index = Math.min(draft.index, questions.length - 1)
  const question = questions[index]!
  const answer = String(draft.answers[question.id] ?? '')
  const isLast = index === questions.length - 1

  const handleNext = async () => {
    if (!isLast) {
      setIndex(draftKey, index + 1)
      return
    }
    const answers = Object.fromEntries(
      questions.map((item) => [item.id, String(draft.answers[item.id] ?? '')]),
    )
    try {
      const post = kind === 'tailored' ? postTailored : postPersonality
      await post({ jobId, answers }).unwrap()
      clear(draftKey)
      onFinished(questions.length)
    } catch (submitError) {
      notify(
        'error',
        getErrorMessage(
          submitError,
          'We couldn’t send your answers. Try again.',
        ),
      )
    }
  }

  return (
    <QuestionStep
      kind={config}
      context={context}
      index={index}
      total={questions.length}
      question={question.question}
      hint="Write your answer. You can go back before you submit."
      canGoNext={answer.trim().length > 0}
      isLast={isLast}
      submitting={tailoredState.isLoading || personalityState.isLoading}
      onBack={() => setIndex(draftKey, index - 1)}
      onNext={() => void handleNext()}>
      <TextArea
        title="Your answer"
        name={question.id}
        value={answer}
        rows={6}
        onChange={(event) =>
          setAnswer(draftKey, question.id, event.target.value)
        }
      />
    </QuestionStep>
  )
}
