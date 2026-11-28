import { httpClient } from '@/features/auth/services/httpClient'

import { getErrorMessage } from './getErrorMessage'
import { notify } from './toastNotifications'

interface OpenCvParams {
  talentId: string
  notFoundMessage?: string
}

// CVs are private, so the file is fetched through the signed-in CV route. The tab opens
// before the fetch so the browser doesn't block it as a popup.
export const openCv = async ({
  talentId,
  notFoundMessage = 'This candidate has no CV on file',
}: OpenCvParams): Promise<void> => {
  const cvWindow = window.open('', '_blank')
  try {
    const response = await httpClient.get(`/user/profile/${talentId}/cv`, {
      responseType: 'blob',
    })
    const blobUrl = URL.createObjectURL(response.data as Blob)
    if (cvWindow) {
      cvWindow.location.href = blobUrl
    }
  } catch (err) {
    cvWindow?.close()
    notify('error', getErrorMessage(err, notFoundMessage), {
      autoClose: 2500,
    })
  }
}
