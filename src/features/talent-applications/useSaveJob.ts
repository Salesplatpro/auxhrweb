import { useEffect, useState } from 'react'

import { useSaveJobMutation } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

export const useSaveJob = (jobId: string, initial: boolean) => {
  const [saved, setSaved] = useState(initial)
  const [saveJob, { isLoading }] = useSaveJobMutation()

  useEffect(() => setSaved(initial), [initial])

  const toggle = async () => {
    if (isLoading) return
    const next = !saved
    setSaved(next)
    try {
      await saveJob({ jobId, saved: next }).unwrap()
    } catch (error) {
      setSaved(!next)
      notify(
        'error',
        getErrorMessage(error, 'We couldn’t update your saved jobs.'),
      )
    }
  }

  return { saved, toggle, pending: isLoading }
}
