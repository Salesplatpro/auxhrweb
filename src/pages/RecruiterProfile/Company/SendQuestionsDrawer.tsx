import React, { useState } from 'react'
import useSWR from 'swr'

import { CheckBox } from '@/components/forms'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import {
  JobSort,
  sortJobs,
  waitingTotal,
} from '@/features/references/companyQuestions'
import {
  fetchWaitingJobs,
  sendCompanyQuestions,
  waitingJobsKey,
} from '@/features/references/companyQuestionsService'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './ReferenceQuestions.module.scss'

const SORT_OPTIONS = [
  { value: 'waiting', label: 'Most waiting' },
  { value: 'newest', label: 'Newest job' },
]

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

export const SendQuestionsDrawer = ({
  organizationId,
  onClose,
}: {
  organizationId: string
  onClose: () => void
}) => {
  const {
    data: jobs = [],
    isLoading,
    mutate,
  } = useSWR(waitingJobsKey(organizationId), () =>
    fetchWaitingJobs(organizationId),
  )
  const [sort, setSort] = useState<JobSort>('waiting')
  const [selected, setSelected] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const total = waitingTotal(jobs, selected)

  const toggle = (jobId: string) =>
    setSelected((ids) =>
      ids.includes(jobId) ? ids.filter((id) => id !== jobId) : [...ids, jobId],
    )

  const send = async () => {
    setIsSending(true)
    try {
      const { sent, failed } = await sendCompanyQuestions(
        organizationId,
        selected,
      )
      await mutate()
      setSelected([])
      if (failed) {
        notify(
          'error',
          `Sent to ${plural(sent, 'referee')}. ${plural(
            failed,
            'email',
          )} failed, so try those again.`,
          { autoClose: 5000 },
        )
      } else {
        notify('success', `Sent to ${plural(sent, 'referee')}`)
        onClose()
      }
    } catch (error) {
      notify('error', getErrorMessage(error, "We couldn't send the questions."))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Send reference questions"
      subtitle="Choose the jobs whose candidates' referees should get your questions now."
      footer={
        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            loading={isSending}
            disabled={total === 0}
            onClick={() => void send()}>
            {total ? `Send to ${plural(total, 'referee')}` : 'Send'}
          </Button>
        </div>
      }>
      {isLoading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <p className={styles.muted}>
          No referees are waiting. When candidates add referees, their jobs show
          up here.
        </p>
      ) : (
        <div className={styles.stack}>
          <SegmentedControl
            label="Sort jobs"
            options={SORT_OPTIONS}
            value={[sort]}
            onChange={([value]) => value && setSort(value as JobSort)}
          />
          <ul className={styles.jobs}>
            {sortJobs(jobs, sort).map((job) => (
              <li key={job.jobId}>
                <CheckBox
                  name="reference-job"
                  value={job.jobId}
                  checked={selected.includes(job.jobId)}
                  label={`${job.title} · ${plural(
                    job.waiting,
                    'referee',
                  )} waiting`}
                  onChange={() => toggle(job.jobId)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  )
}
