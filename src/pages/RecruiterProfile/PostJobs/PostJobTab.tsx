import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PageShell } from '@/components/layout/PageShell'
import { BreadcrumbItem } from '@/components/ui/Breadcrumb'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'

import AiConfig from './AiConfig/AiConfig'
import PostJob from './PostJob'
import { ReviewStep } from './ReviewStep/ReviewStep'
import { PostJobStepId, PostJobStepper } from './Stepper/PostJobStepper'

export type PostJobRouteStep = 'new' | PostJobStepId

type PostJobTabProps = {
  step?: PostJobRouteStep
}

const BASE_PATH = '/recruiterDashboard/postjob'
const JOB_POSTS_PATH = '/recruiterDashboard/myJobPosts'

const PostJobTab = ({ step = 'new' }: PostJobTabProps) => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data } = useIndividualJobQuery(jobId, { skip: !jobId })
  const job = data?.data?.job ?? data?.data
  const roleName = job?.role?.name ? capitalizeEachWord(job.role.name) : ''

  const current: PostJobStepId = step === 'new' ? 'details' : step

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Job Posts', to: JOB_POSTS_PATH },
    {
      label: 'Post a job',
      to: jobId ? `${BASE_PATH}/${jobId}/details` : undefined,
    },
    ...(current === 'screening' ? [{ label: 'AI Configuration' }] : []),
  ]

  const header =
    current === 'screening'
      ? {
          title: 'How should applicants be screened?',
          description: [
            roleName,
            'Turn on the steps you want. Candidates take them in the order on the right.',
          ]
            .filter(Boolean)
            .join(' · '),
        }
      : current === 'review'
      ? { title: 'Post a job', description: 'Check everything, then publish.' }
      : {
          title: 'Post a job',
          description:
            'Tell candidates about the role. AI uses these details to screen applicants.',
        }

  const renderContent = () => {
    if (step === 'screening' && jobId) return <AiConfig />
    if (step === 'review' && jobId) return <ReviewStep jobId={jobId} />
    return <PostJob jobId={step === 'details' ? jobId : undefined} />
  }

  return (
    <PageShell wide>
      <PageHeaderTitle breadcrumbs={breadcrumbs} {...header} />

      <PostJobStepper
        current={current}
        selectable={jobId ? ['details', 'screening', 'review'] : []}
        onSelect={(target) => {
          if (!jobId) return
          if (target === 'details') navigate(`${BASE_PATH}/${jobId}/details`)
          if (target === 'screening') navigate(`${BASE_PATH}/${jobId}`)
          if (target === 'review') navigate(`${BASE_PATH}/${jobId}/review`)
        }}
      />

      <div data-tour="post-job-content">{renderContent()}</div>
    </PageShell>
  )
}

export default PostJobTab
