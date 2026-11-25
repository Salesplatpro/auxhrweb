import type { AxiosProgressEvent } from 'axios'

import { httpClient } from '@/features/auth/services/httpClient'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { baseUrl } from '@/utils/baseConfig'

export type ScreenLeaveKind = 'tab_hidden' | 'window_blur' | 'fullscreen_exit'

/** Sent with keepalive so it still lands when the candidate closes the tab while away. */
export const reportScreenLeave = (
  interviewId: string,
  kind: ScreenLeaveKind,
  questionId: string | null,
) => {
  const token = useAuthStore.getState().token
  void fetch(`${baseUrl}/interviews/${interviewId}/screen-events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ kind, questionId }),
  }).catch(() => undefined)
}

export type UploadCandidateRecordingInput = {
  interviewId: string
  questionId: string
  blob: Blob
  fileName: string
  onProgress?: (event: AxiosProgressEvent) => void
}

/** The question read aloud, or null when the interviewer's voice isn't available. */
export const fetchQuestionAudio = (
  interviewId: string,
  questionId: string,
): Promise<Blob | null> =>
  httpClient
    .get<Blob>(`/interviews/${interviewId}/questions/${questionId}/audio`, {
      responseType: 'blob',
    })
    .then((response) => response.data)
    .catch(() => null)

export const uploadCandidateRecording = ({
  interviewId,
  questionId,
  blob,
  fileName,
  onProgress,
}: UploadCandidateRecordingInput) => {
  const formData = new FormData()
  formData.append('recording', blob, fileName)

  return httpClient
    .put(
      `/interviews/${interviewId}/questions/${questionId}/recording`,
      formData,
      {
        onUploadProgress: onProgress,
      },
    )
    .then((response) => response.data)
}
