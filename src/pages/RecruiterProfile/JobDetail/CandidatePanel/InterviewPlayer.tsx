import React, { useEffect, useRef, useState } from 'react'
import { LuPause, LuPlay } from 'react-icons/lu'

import { Avatar } from '@/components/ui/Avatar'
import { fetchInterviewRecording } from '@/features/applications/services/applicationService'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { RecruiterInterview } from '@/utils/recruiterJobPostsTypes'

import styles from './CandidatePanel.module.scss'

export type Clip = RecruiterInterview['questions'][number] & {
  label: string
  start: number
  length: number
}

export type JumpRequest = { index: number; key: number }

const SPEEDS = [1, 1.5, 2]

export const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

type InterviewPlayerProps = {
  interviewId: string
  mode: RecruiterInterview['mode']
  clips: Clip[]
  markers: number[]
  jump: JumpRequest | null
  candidate: { firstName: string; lastName: string }
  onClipChange: (index: number) => void
}

/** Plays each recorded answer in turn on one timeline. */
export const InterviewPlayer = ({
  interviewId,
  mode,
  clips,
  markers,
  jump,
  candidate,
  onClipChange,
}: InterviewPlayerProps) => {
  const mediaRef = useRef<HTMLVideoElement | null>(null)
  const urls = useRef(new Map<string, string>())
  const [index, setIndex] = useState(0)
  const [src, setSrc] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(SPEEDS[0]!)
  const [error, setError] = useState<string | null>(null)
  const autoplay = useRef(false)
  const total = clips.reduce((sum, clip) => sum + clip.length, 0)
  const clip = clips[index]

  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    if (!clip) return
    const cached = urls.current.get(clip.id)
    if (cached) {
      setSrc(cached)
      return
    }
    let cancelled = false
    setSrc(null)
    fetchInterviewRecording(interviewId, clip.id)
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        urls.current.set(clip.id, url)
        if (!cancelled) setSrc(url)
      })
      .catch((err) => {
        if (!cancelled)
          setError(getErrorMessage(err, "Couldn't load this answer"))
      })
    return () => {
      cancelled = true
    }
  }, [clip, interviewId])

  useEffect(() => {
    if (!jump) return
    autoplay.current = true
    setIndex(jump.index)
    setOffset(0)
    onClipChange(jump.index)
  }, [jump, onClipChange])

  useEffect(() => {
    const media = mediaRef.current
    if (!media || !src) return
    media.playbackRate = speed
    if (autoplay.current) void media.play().catch(() => setPlaying(false))
  }, [src, speed])

  const goTo = (next: number, at = 0) => {
    autoplay.current = playing
    if (next === index) {
      if (mediaRef.current) mediaRef.current.currentTime = at
      setOffset(at)
      return
    }
    setIndex(next)
    setOffset(at)
    onClipChange(next)
  }

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const target = ((event.clientX - rect.left) / rect.width) * total
    const next = clips.findIndex(
      (item) => target >= item.start && target < item.start + item.length,
    )
    const chosen = next === -1 ? clips.length - 1 : next
    goTo(chosen, Math.max(0, target - clips[chosen]!.start))
  }

  const toggle = () => {
    const media = mediaRef.current
    if (!media) return
    if (media.paused) {
      autoplay.current = true
      void media.play()
    } else {
      media.pause()
    }
  }

  const now = (clip?.start ?? 0) + offset

  return (
    <div className={styles.player}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- each answer's transcript is shown in the Questions list below */}
      <video
        ref={mediaRef}
        className={mode === 'audio' ? styles.hidden : styles.video}
        src={src ?? undefined}
        playsInline
        onLoadedMetadata={(event) => {
          if (offset > 0) event.currentTarget.currentTime = offset
        }}
        onTimeUpdate={(event) => setOffset(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (index < clips.length - 1) {
            autoplay.current = true
            setIndex(index + 1)
            setOffset(0)
            onClipChange(index + 1)
          }
        }}
      />
      {mode === 'audio' && (
        <div className={styles.audioStage}>
          <Avatar
            firstName={candidate.firstName}
            lastName={candidate.lastName}
            size="lg"
          />
        </div>
      )}
      {clip && (
        <span className={styles.chip}>
          Question {clip.label} · {clock(now)}
        </span>
      )}
      {error && <p className={styles.playerError}>{error}</p>}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          onClick={toggle}
          disabled={!src}
          aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <LuPause /> : <LuPlay />}
        </button>
        <span className={styles.time}>
          {clock(now)} / {clock(total)}
        </span>
        <div
          className={styles.track}
          role="slider"
          tabIndex={0}
          aria-label="Interview position"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(now)}
          onClick={seek}>
          <span
            className={styles.trackFill}
            style={{ width: `${total > 0 ? (now / total) * 100 : 0}%` }}
          />
          {markers.map((at) => (
            <span
              key={at}
              className={styles.marker}
              style={{ left: `${total > 0 ? (at / total) * 100 : 0}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.control}
          onClick={() =>
            setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)
          }
          aria-label="Playback speed">
          {speed}x
        </button>
      </div>
    </div>
  )
}
