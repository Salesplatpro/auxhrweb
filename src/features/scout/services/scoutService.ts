import { httpClient } from '@/features/auth/services/httpClient'
import { withBlobError } from '@/utils/blobError'
import { downloadBlobResponse } from '@/utils/downloadBlob'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

/**
 * Downloads the shortlist as a PDF. It is generated server-side with pdfkit and
 * streamed back as a blob, matching the existing fit-report downloads — no
 * client-side PDF library is needed.
 */
export const downloadScoutReport = async (
  runId: string,
  campaignName: string,
): Promise<void> => {
  const response = await httpClient.get(`/scout/runs/${runId}/report.pdf`, {
    responseType: 'blob',
  })
  downloadBlobResponse(
    response.data as Blob,
    response.headers['content-disposition'] as string | undefined,
    `${
      campaignName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scouting'
    }-shortlist.pdf`,
  )
}

/**
 * Opens a stored CV in a new tab.
 *
 * Scouted CVs are uploaded to private storage and served through an authenticated
 * route, so there is no public URL to link to. The tab is opened synchronously,
 * before the request, because a popup blocker rejects `window.open` once an await
 * has yielded — the same approach as `viewCandidateCv`.
 */
export const openScoutCandidateCv = async (
  candidateId: string,
): Promise<void> => {
  const cvWindow = window.open('', '_blank')
  try {
    const response = await withBlobError(
      httpClient.get(`/scout/candidates/${candidateId}/cv`, {
        responseType: 'blob',
      }),
    )
    const blobUrl = URL.createObjectURL(response.data as Blob)
    if (cvWindow) {
      cvWindow.location.href = blobUrl
    } else {
      window.location.href = blobUrl
    }
  } catch (err) {
    cvWindow?.close()
    notify('error', getErrorMessage(err, 'Could not open this CV'))
  }
}
