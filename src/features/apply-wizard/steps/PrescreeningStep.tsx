import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { canApplyToJobs } from '@/features/pre-assessment/canApply'
import PreAssessmentPage from '@/features/pre-assessment/page'
import { usePreAssessmentStore } from '@/features/pre-assessment/store'

import styles from './PrescreeningStep.module.scss'

const PrescreeningStep: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const assessment = usePreAssessmentStore((s) => s.assessment)
  const isCompleted = canApplyToJobs(assessment)

  const goToJob = () => navigate(`/apply/${jobId}/details`)

  return (
    <div className={styles.page}>
      <PreAssessmentPage onContinue={goToJob} />
      {isCompleted && (
        <div className={styles.continueBar}>
          <span className={styles.message}>Prescreening complete.</span>
          <Button onClick={goToJob}>Continue to Job</Button>
        </div>
      )}
    </div>
  )
}

export default PrescreeningStep
