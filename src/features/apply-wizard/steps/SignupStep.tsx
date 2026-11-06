import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

import styles from './SignupStep.module.scss'

const SignupStep: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (token) {
      navigate(`/apply/${jobId}`, { replace: true })
    }
  }, [token, jobId, navigate])

  if (token) return null

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <SignupForm
          accountType="talent"
          redirectPath={`/apply/${jobId}`}
          onSuccess={() => navigate(`/apply/${jobId}`, { replace: true })}
        />
      </Card>
    </div>
  )
}

export default SignupStep
