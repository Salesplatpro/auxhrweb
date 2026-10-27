import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { usePreAssessment } from '@/features/pre-assessment/hooks'
import {
  PROFILE_INCOMPLETE_MESSAGE,
  ProfileCompletionForm,
} from '@/features/profile/components/ProfileCompletionForm'
import { notify } from '@/utils/toastNotifications'

const ProfileStep: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { refetch } = usePreAssessment()

  const handleComplete = async () => {
    const stillIncomplete = await refetch()
    if (stillIncomplete) {
      notify('info', PROFILE_INCOMPLETE_MESSAGE, { autoClose: 4000 })
      return
    }

    navigate(`/apply/${jobId}/prescreen`, { replace: true })
  }

  return <ProfileCompletionForm onComplete={handleComplete} />
}

export default ProfileStep
