export const RECORDING_LIMIT_SECONDS = 120

export type InterviewMode = 'audio' | 'audio_video'

export const nextUnansweredIndex = (answered: boolean[]): number =>
  answered.findIndex((done) => !done)

export const secondsLeft = (elapsedSeconds: number): number =>
  Math.max(0, RECORDING_LIMIT_SECONDS - elapsedSeconds)

export const isRecordingLimitReached = (elapsedSeconds: number): boolean =>
  elapsedSeconds >= RECORDING_LIMIT_SECONDS

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
  audio: ['audio/webm;codecs=opus', 'audio/webm'],
  audio_video: ['video/webm', 'audio/webm'],
}

export const chooseRecordingMimeType = (
  mode: InterviewMode,
  isSupported: (type: string) => boolean,
): string => RECORDING_TYPES[mode].find((type) => isSupported(type)) ?? ''
