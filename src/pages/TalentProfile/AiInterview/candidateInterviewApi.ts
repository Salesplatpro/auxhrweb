import type { AxiosProgressEvent } from 'axios'

import { httpClient } from '@/features/auth/services/httpClient'

export type UploadCandidateRecordingInput = {
  interviewId: string
  questionId: string
  blob: Blob
  fileName: string
  onProgress?: (event: AxiosProgressEvent) => void
}

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
