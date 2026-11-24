export const RECORDING_LIMIT_SECONDS = 120

/** Keeps a two-minute video near 16 MB, under the 25 MB upload limit. */
export const VIDEO_BITS_PER_SECOND = 1_000_000
export const AUDIO_BITS_PER_SECOND = 64_000

export type InterviewMode = 'audio' | 'audio_video'

export const nextUnansweredIndex = (answered: boolean[]): number =>
  answered.findIndex((done) => !done)

export const secondsLeft = (elapsedSeconds: number): number =>
  Math.max(0, RECORDING_LIMIT_SECONDS - elapsedSeconds)

export const isRecordingLimitReached = (elapsedSeconds: number): boolean =>
  elapsedSeconds >= RECORDING_LIMIT_SECONDS

/** From a start time, so a throttled background tab can't stretch an answer past the limit. */
export const elapsedSince = (startedAt: number, now: number): number =>
  Math.max(0, Math.floor((now - startedAt) / 1000))

export const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const uploadPercent = (loaded: number, total: number): number => {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)))
}

const RECORDING_TYPES: Record<InterviewMode, string[]> = {
  audio: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'],
  audio_video: ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'],
}

export const chooseRecordingMimeType = (
  mode: InterviewMode,
  isSupported: (type: string) => boolean,
): string => RECORDING_TYPES[mode].find((type) => isSupported(type)) ?? ''

export const extensionFor = (type: string): string => {
  if (type.includes('mp4')) return 'mp4'
  if (type.includes('ogg')) return 'ogg'
  return 'webm'
}

/** What went wrong getting the camera or microphone, and what to do about it. */
export const mediaErrorMessage = (error: unknown): string => {
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name: unknown }).name)
      : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Allow the camera and microphone in your browser’s address bar, then try again.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'We couldn’t find a camera or microphone. Connect one, then try again.'
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'Another app is using your camera or microphone. Close it, then try again.'
  }
  if (!error) {
    return 'This browser can’t record. Open this link in Chrome or Safari.'
  }
  return 'We couldn’t start your camera or microphone. Check your browser settings, then try again.'
}
