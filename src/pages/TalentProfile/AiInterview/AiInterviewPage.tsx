import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCandidateInterviewQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { AssessmentStatus } from '../TalentAssessment/AssessmentForm'
import styles from '../TalentAssessment/AssessmentForm.module.scss'
import { uploadCandidateRecording } from './candidateInterviewApi'
import {
  chooseRecordingMimeType,
  formatClock,
  InterviewMode,
  isRecordingLimitReached,
  nextUnansweredIndex,
  secondsLeft,
  uploadPercent,
} from './interviewFlow'

type MicState = 'idle' | 'testing' | 'ready' | 'failed'
type UploadState = 'idle' | 'uploading' | 'failed'

const extensionFor = (type: string) => (type.includes('mp4') ? 'mp4' : 'webm')

const AiInterviewPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>()
  const { data, isLoading, error, refetch } = useCandidateInterviewQuery(
    interviewId ?? '',
    { skip: !interviewId },
  )
  const [phase, setPhase] = useState<'check' | 'answer'>('check')
  const [micState, setMicState] = useState<MicState>('idle')
  const [answeredHere, setAnsweredHere] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [pending, setPending] = useState<Blob | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const interview = data?.data
  const mode: InterviewMode = interview?.mode ?? 'audio'
  const questions: Array<{
    id: string
    position: number
    question: string
    answered: boolean
  }> = interview?.questions ?? []
  const answeredIds = questions.map(
    (item) => item.answered || answeredHere.includes(item.id),
  )
  const currentIndex = nextUnansweredIndex(answeredIds)
  const current = currentIndex >= 0 ? questions[currentIndex] : undefined

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && streamRef.current && mode === 'audio_video') {
      videoRef.current.srcObject = streamRef.current
    }
  }, [micState, mode, phase])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (recording && isRecordingLimitReached(elapsed)) {
      stopRecording()
    }
  }, [recording, elapsed])

  const testMicrophone = async () => {
    setMicState('testing')
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState('failed')
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'audio_video',
      })
      setMicState('ready')
    } catch {
      setMicState('failed')
    }
  }

  const sendAnswer = async (blob: Blob) => {
    if (!interviewId || !current) return
    setPending(blob)
    setUploadState('uploading')
    setUploadPct(0)
    try {
      await uploadCandidateRecording({
        interviewId,
        questionId: current.id,
        blob,
        fileName: `answer-${current.position}.${extensionFor(blob.type)}`,
        onProgress: (event) =>
          setUploadPct(uploadPercent(event.loaded, event.total ?? 0)),
      })
      setAnsweredHere((ids) => [...ids, current.id])
      setPending(null)
      setUploadState('idle')
      setElapsed(0)
    } catch {
      setUploadState('failed')
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return
    const mimeType = chooseRecordingMimeType(
      mode,
      (type) =>
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported(type),
    )
    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined,
    )
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      setRecording(false)
      const type =
        recorder.mimeType ||
        mimeType ||
        (mode === 'audio_video' ? 'video/webm' : 'audio/webm')
      void sendAnswer(new Blob(chunksRef.current, { type }))
    }
    recorder.start()
    recorderRef.current = recorder
    setElapsed(0)
    setRecording(true)
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  if (!interviewId) return null

  if (isLoading) {
    return (
      <div className={styles.shell}>
        <AssessmentStatus loading message="Loading your interview…" />
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className={styles.shell}>
        <AssessmentStatus
          error
          message={getErrorMessage(error, "We couldn't open your interview.")}
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </div>
    )
  }

  const total = questions.length
  const done = current === undefined

  return (
    <div className={styles.shell}>
      <section className={`${styles.intro} ${styles.role}`}>
        <p className={styles.kicker}>AI interview</p>
        <h1 className={styles.title}>
          {phase === 'check' ? 'Check your microphone' : 'Your answers'}
        </h1>
        <p className={styles.lead}>
          {phase === 'check'
            ? 'Say a few words so we know we can hear you.'
            : 'One question at a time. Each answer can be up to 2 minutes.'}
        </p>
      </section>

      {phase === 'check' && (
        <Card>
          {mode === 'audio_video' && (
            <video ref={videoRef} autoPlay muted playsInline />
          )}
          {micState === 'idle' && (
            <Button type="button" onClick={() => void testMicrophone()}>
              Test microphone
            </Button>
          )}
          {micState === 'testing' && (
            <AssessmentStatus
              loading
              message="Listening for your microphone…"
            />
          )}
          {micState === 'ready' && (
            <>
              <AssessmentStatus
                message={
                  mode === 'audio_video'
                    ? 'Microphone is working. Camera is working too.'
                    : 'Microphone is working.'
                }
              />
              <Button type="button" onClick={() => setPhase('answer')}>
                Continue
              </Button>
            </>
          )}
          {micState === 'failed' && (
            <AssessmentStatus
              error
              message="Microphone isn't available. Allow access in your browser, then try again."
              actionLabel="Try again"
              onAction={() => void testMicrophone()}
            />
          )}
        </Card>
      )}

      {phase === 'answer' && done && (
        <AssessmentStatus
          message={`All ${total} answers are in. The hiring team will review them.`}
        />
      )}

      {phase === 'answer' && !done && current && (
        <Card>
          <div className={styles.progress}>
            <span className={styles.progressMeta}>{`Question ${
              currentIndex + 1
            } of ${total}`}</span>
          </div>
          <p className={styles.question}>{current.question}</p>
          {mode === 'audio_video' && (
            <video ref={videoRef} autoPlay muted playsInline />
          )}
          <p className={styles.progressMeta}>
            <span>Time left </span>
            <span>{formatClock(secondsLeft(elapsed))}</span>
          </p>
          {uploadState === 'uploading' && (
            <>
              <AssessmentStatus
                loading
                message={`Uploading your answer… ${uploadPct}%`}
              />
              <div className={styles.progressTrack} aria-valuenow={uploadPct}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </>
          )}
          {uploadState === 'failed' && pending && (
            <AssessmentStatus
              error
              message="Your answer didn't upload. Check your connection, then retry."
              actionLabel="Retry upload"
              onAction={() => void sendAnswer(pending)}
            />
          )}
          {uploadState === 'idle' && !recording && (
            <Button type="button" onClick={startRecording}>
              Start recording
            </Button>
          )}
          {uploadState === 'idle' && recording && (
            <Button type="button" variant="outline" onClick={stopRecording}>
              Stop and upload
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}

export default AiInterviewPage
