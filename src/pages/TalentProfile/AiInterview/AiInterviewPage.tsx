import { isAxiosError } from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCandidateInterviewQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { AssessmentStatus } from '../TalentAssessment/AssessmentForm'
import styles from '../TalentAssessment/AssessmentForm.module.scss'
import pageStyles from './AiInterviewPage.module.scss'
import {
  fetchQuestionAudio,
  uploadCandidateRecording,
} from './candidateInterviewApi'
import {
  AUDIO_BITS_PER_SECOND,
  chooseRecordingMimeType,
  elapsedSince,
  extensionFor,
  formatClock,
  InterviewMode,
  isRecordingLimitReached,
  mediaErrorMessage,
  nextUnansweredIndex,
  secondsLeft,
  uploadPercent,
  VIDEO_BITS_PER_SECOND,
} from './interviewFlow'

type MicState = 'idle' | 'testing' | 'listening' | 'failed'
type UploadState = 'idle' | 'uploading' | 'failed'

type InterviewQuestion = {
  id: string
  position: number
  isFollowUp: boolean
  question: string
  answered: boolean
}

const RECORDING_STOPPED = 'Recording stopped. Record this answer again.'
const HEARD_LEVEL = 0.04
const HEARD_FRAMES = 8
const CHECK_EVERY_MS = 3000
const CHECK_FOR_MS = 90_000

const AiInterviewPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>()
  const { data, isLoading, error, refetch } = useCandidateInterviewQuery(
    interviewId ?? '',
    { skip: !interviewId, refetchOnMountOrArgChange: true },
  )
  const [stoppedChecking, setStoppedChecking] = useState(false)
  const [phase, setPhase] = useState<'check' | 'answer'>('check')
  const [micState, setMicState] = useState<MicState>('idle')
  const [micError, setMicError] = useState('')
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [answeredHere, setAnsweredHere] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [uploadProblem, setUploadProblem] = useState({
    message: '',
    canRetry: true,
  })
  const [pending, setPending] = useState<Blob | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const discardRef = useRef(false)
  const startedAtRef = useRef(0)
  const answeringRef = useRef<InterviewQuestion | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioLoadsRef = useRef(new Map<string, Promise<string | null>>())
  const audioUrlsRef = useRef(new Map<string, string>())
  const playedRef = useRef<string | null>(null)
  const [hasAudio, setHasAudio] = useState(false)

  const interview = data?.data
  const mode: InterviewMode = interview?.mode ?? 'audio'
  const questions: InterviewQuestion[] = interview?.questions ?? []
  const answeredIds = questions.map(
    (item) => item.answered || answeredHere.includes(item.id),
  )
  const currentIndex = nextUnansweredIndex(answeredIds)
  const current = currentIndex >= 0 ? questions[currentIndex] : undefined
  const done = questions.length > 0 && current === undefined
  const checking = done && !!interview?.checking && !stoppedChecking
  const finished = done && !checking
  const inProgress = phase === 'answer' && !finished
  const mainTotal = questions.filter((item) => !item.isFollowUp).length

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const loadAudio = (questionId: string) => {
    const known = audioLoadsRef.current.get(questionId)
    if (known || !interviewId) return known ?? Promise.resolve(null)
    const load = fetchQuestionAudio(interviewId, questionId).then((blob) => {
      if (!blob) return null
      const url = URL.createObjectURL(blob)
      audioUrlsRef.current.set(questionId, url)
      return url
    })
    audioLoadsRef.current.set(questionId, load)
    return load
  }

  const playUrl = (url: string) => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.src !== url) audio.src = url
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  }

  const playQuestion = async (questionId: string) => {
    const url = await loadAudio(questionId)
    setHasAudio(!!url)
    if (url && answeringRef.current?.id !== questionId) playUrl(url)
  }

  useEffect(() => {
    const urls = audioUrlsRef.current
    return () => {
      discardRef.current = true
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      stopTracks()
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (!current) return
    if (phase === 'check') {
      void loadAudio(current.id)
      return
    }
    const next = questions[currentIndex + 1]
    if (next) void loadAudio(next.id)
    if (playedRef.current === current.id) return
    playedRef.current = current.id
    void playQuestion(current.id)
  }, [phase, current?.id])

  useEffect(() => {
    if (finished) stopTracks()
  }, [finished])

  useEffect(() => {
    if (!checking) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > CHECK_FOR_MS) {
        setStoppedChecking(true)
        return
      }
      void refetch()
    }, CHECK_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [checking])

  useEffect(() => {
    if (phase === 'answer' && current && !streamRef.current) {
      setMicState('idle')
      setPhase('check')
    }
  }, [phase, current?.id])

  useEffect(() => {
    if (videoRef.current && streamRef.current && mode === 'audio_video') {
      videoRef.current.srcObject = streamRef.current
    }
  }, [micState, mode, phase, current?.id])

  useEffect(() => {
    if (phase !== 'check' || micState !== 'listening' || !streamRef.current) {
      return
    }
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) {
      setHeard(true)
      return
    }
    const context = new AudioCtx()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(streamRef.current).connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)
    let loudFrames = 0
    let frame = 0
    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) {
        const centred = (sample - 128) / 128
        sum += centred * centred
      }
      const rms = Math.sqrt(sum / samples.length)
      setLevel(Math.min(1, rms * 4))
      loudFrames = rms > HEARD_LEVEL ? loudFrames + 1 : loudFrames
      if (loudFrames >= HEARD_FRAMES) setHeard(true)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      void context.close()
    }
  }, [micState, phase])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(
      () => setElapsed(elapsedSince(startedAtRef.current, Date.now())),
      250,
    )
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (recording && isRecordingLimitReached(elapsed)) stopRecording()
  }, [recording, elapsed])

  useEffect(() => {
    if (!inProgress) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [inProgress])

  const testMicrophone = async () => {
    setMicState('testing')
    setMicError('')
    setHeard(false)
    setPreviewPlaying(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(mediaErrorMessage(null))
      setMicState('failed')
      return
    }
    try {
      stopTracks()
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'audio_video',
      })
      setMicState('listening')
    } catch (err) {
      setMicError(mediaErrorMessage(err))
      setMicState('failed')
    }
  }

  const markAnswered = (questionId: string) => {
    setAnsweredHere((ids) => [...ids, questionId])
    setPending(null)
    setUploadState('idle')
    setElapsed(0)
    void refetch()
  }

  const sendAnswer = async (blob: Blob, question: InterviewQuestion) => {
    if (!interviewId) return
    setPending(blob)
    setUploadState('uploading')
    setUploadPct(0)
    try {
      await uploadCandidateRecording({
        interviewId,
        questionId: question.id,
        blob,
        fileName: `answer-${question.position}.${extensionFor(blob.type)}`,
        onProgress: (event) =>
          setUploadPct(uploadPercent(event.loaded, event.total ?? 0)),
      })
      markAnswered(question.id)
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined
      if (status === 409) {
        markAnswered(question.id)
        return
      }
      setUploadProblem(
        status === 413
          ? {
              message:
                'This answer is too large to upload. Record a shorter answer.',
              canRetry: false,
            }
          : {
              message: getErrorMessage(
                err,
                "Your answer didn't upload. Check your connection, then retry.",
              ),
              canRetry: status === undefined || status >= 500,
            },
      )
      setUploadState('failed')
    }
  }

  const failRecording = () => {
    discardRef.current = true
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setRecording(false)
    setRecordError(RECORDING_STOPPED)
    const deviceGone = streamRef.current
      ?.getTracks()
      .some((track) => track.readyState === 'ended')
    if (deviceGone) {
      stopTracks()
      setMicState('idle')
      setPhase('check')
    }
  }

  const startInterview = () => {
    const url = current && audioUrlsRef.current.get(current.id)
    if (current && url) {
      playedRef.current = current.id
      setHasAudio(true)
      playUrl(url)
    }
    setPhase('answer')
  }

  const startRecording = () => {
    audioRef.current?.pause()
    const stream = streamRef.current
    if (!stream || !current || recorderRef.current?.state === 'recording') {
      return
    }
    const mimeType = chooseRecordingMimeType(
      mode,
      (type) =>
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported(type),
    )
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
        ...(mode === 'audio_video'
          ? { videoBitsPerSecond: VIDEO_BITS_PER_SECOND }
          : {}),
      })
      recorderRef.current = recorder
      answeringRef.current = current
      chunksRef.current = []
      discardRef.current = false
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = failRecording
      stream.getTracks().forEach((track) => {
        track.onended = failRecording
      })
      recorder.onstop = () => {
        setRecording(false)
        const question = answeringRef.current
        if (discardRef.current || !question) {
          chunksRef.current = []
          return
        }
        const type =
          recorder.mimeType ||
          mimeType ||
          (mode === 'audio_video' ? 'video/webm' : 'audio/webm')
        void sendAnswer(new Blob(chunksRef.current, { type }), question)
      }
      recorder.start(1000)
    } catch {
      recorderRef.current = null
      setRecordError(RECORDING_STOPPED)
      return
    }
    setRecordError('')
    startedAtRef.current = Date.now()
    setElapsed(0)
    setRecording(true)
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const recordAgain = () => {
    setPending(null)
    setUploadState('idle')
    setElapsed(0)
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
  const canContinue =
    micState === 'listening' && heard && (mode === 'audio' || previewPlaying)

  return (
    <div className={styles.shell}>
      <audio ref={audioRef} hidden>
        <track kind="captions" />
      </audio>
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
          {mode === 'audio_video' && micState === 'listening' && (
            <video
              ref={videoRef}
              className={pageStyles.video}
              autoPlay
              muted
              playsInline
              onPlaying={() => setPreviewPlaying(true)}
            />
          )}
          {micState === 'idle' && (
            <Button type="button" onClick={() => void testMicrophone()}>
              {mode === 'audio_video'
                ? 'Test camera and microphone'
                : 'Test microphone'}
            </Button>
          )}
          {micState === 'testing' && (
            <AssessmentStatus
              loading
              message="Waiting for you to allow access…"
            />
          )}
          {micState === 'listening' && (
            <>
              <div
                className={pageStyles.meter}
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(level * 100)}>
                <div
                  className={pageStyles.meterFill}
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </div>
              <AssessmentStatus
                message={
                  canContinue
                    ? mode === 'audio_video'
                      ? 'We can hear you and see you.'
                      : 'We can hear you.'
                    : 'Say a few words…'
                }
              />
              <Button
                type="button"
                disabled={!canContinue}
                onClick={startInterview}>
                {answeredIds.some(Boolean) ? 'Continue' : 'Start interview'}
              </Button>
            </>
          )}
          {micState === 'failed' && (
            <AssessmentStatus
              error
              message={micError}
              actionLabel="Try again"
              onAction={() => void testMicrophone()}
            />
          )}
        </Card>
      )}

      {phase === 'answer' && checking && (
        <AssessmentStatus loading message="Checking your answers…" />
      )}

      {phase === 'answer' && finished && (
        <AssessmentStatus
          message={`All ${total} answers are in. The hiring team will review them.`}
        />
      )}

      {phase === 'answer' && !done && current && (
        <Card>
          <div className={styles.progress}>
            <span className={styles.progressMeta}>
              {current.isFollowUp
                ? `Follow-up to question ${current.position}`
                : `Question ${current.position} of ${mainTotal}`}
            </span>
          </div>
          <p className={styles.question}>{current.question}</p>
          {hasAudio && !recording && uploadState === 'idle' && (
            <div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const url = audioUrlsRef.current.get(current.id)
                  if (url) playUrl(url)
                }}>
                Play question again
              </Button>
            </div>
          )}
          {mode === 'audio_video' && (
            <video
              ref={videoRef}
              className={pageStyles.video}
              autoPlay
              muted
              playsInline
            />
          )}
          <p className={styles.progressMeta}>
            <span>Time left </span>
            <span>{formatClock(secondsLeft(elapsed))}</span>
          </p>
          {recordError && <AssessmentStatus error message={recordError} />}
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
            <>
              <AssessmentStatus error message={uploadProblem.message} />
              <div className={pageStyles.actionsRow}>
                {uploadProblem.canRetry && (
                  <Button
                    type="button"
                    onClick={() =>
                      answeringRef.current &&
                      void sendAnswer(pending, answeringRef.current)
                    }>
                    Retry upload
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={recordAgain}>
                  Record again
                </Button>
              </div>
            </>
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
