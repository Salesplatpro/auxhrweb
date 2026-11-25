import type { AxiosProgressEvent } from 'axios'

import { httpClient } from '@/features/auth/services/httpClient'

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
