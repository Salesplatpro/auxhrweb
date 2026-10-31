import React, { useState } from 'react'
import { HiOutlineBriefcase } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState, Tabs } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { VestingTimeline } from '@/features/people/components/VestingTimeline'
import { useMyPay, useMyWork } from '@/features/people/hooks/useStaffData'
import { myWorkDocumentPath } from '@/features/people/paths'
import {
  MY_WORK_KEY,
  setMyTaskDone,
} from '@/features/people/services/peopleService'
import { MyWorkRecord } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { formatMoney } from '@/features/people/utils/formatMoney'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './MyWork.module.scss'

const PER_PERIOD = { monthly: 'per month', yearly: 'per year' } as const

const MyPay: React.FC<{ staffId: string; firstName: string }> = ({
  staffId,
  firstName,
}) => {
  const { pay, isLoading, hasError } = useMyPay(staffId)
  const current = pay?.packages.find((pkg) => pkg.id === pay.currentPackageId)

  return (
    <PagePanel title="My pay">
      {isLoading ? (
        <Spinner />
      ) : hasError || !pay ? (
        <p>Couldn&apos;t load your pay. Refresh the page to try again.</p>
      ) : (
        <div className={styles.stack}>
          {current ? (
            <>
              <StatGrid>
                <StatCard
                  label="Base salary"
                  value={`${formatMoney(
                    current.currency,
                    current.baseSalary,
                  )} ${PER_PERIOD[current.period]}`}
                />
                {current.bonus > 0 && (
                  <StatCard
                    label="Bonus"
                    value={`${formatMoney(current.currency, current.bonus)} ${
                      PER_PERIOD[current.period]
                    }`}
                  />
                )}
                <StatCard
                  label="Starts on"
                  value={formatDateOnly(current.startsOn)}
                />
              </StatGrid>
              <p className={styles.paragraph}>{current.paragraph}</p>
            </>
          ) : (
            <p className={styles.muted}>
              Your pay hasn&apos;t been set up yet.
            </p>
          )}
          {pay.grants.map((grant) => (
            <div key={grant.id} className={styles.grant}>
              <h4>Share options</h4>
              <VestingTimeline grant={grant} ownerFirstName={firstName} />
            </div>
          ))}
        </div>
      )}
    </PagePanel>
  )
}

const WorkRecord: React.FC<{ record: MyWorkRecord; firstName: string }> = ({
  record,
  firstName,
}) => {
  const { mutate } = useSWRConfig()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const toggleTask = async (taskId: string, done: boolean) => {
    setPendingTaskId(taskId)
    try {
      const task = await setMyTaskDone(taskId, done)
      await mutate<MyWorkRecord[]>(
        MY_WORK_KEY,
        (records = []) =>
          records.map((item) =>
            item.staffId === record.staffId
              ? {
                  ...item,
                  tasks: item.tasks.map((existing) =>
                    existing.id === task.id ? task : existing,
                  ),
                }
              : item,
          ),
        { revalidate: false },
      )
    } catch (error) {
      notify('error', getErrorMessage(error, 'Could not update this task'))
    } finally {
      setPendingTaskId(null)
    }
  }

  return (
    <div className={styles.stack}>
      <section className={styles.welcome}>
        {record.companyLogoUrl && (
          <img
            src={record.companyLogoUrl}
            alt={record.companyName}
            className={styles.logo}
          />
        )}
        <dl>
          <div>
            <dt>Job title</dt>
            <dd>{record.jobTitle}</dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{record.managerName ?? 'Not set'}</dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>{formatDateOnly(record.startDate)}</dd>
          </div>
        </dl>
      </section>

      <PagePanel title="To do">
        {record.documentsToSign.length === 0 ? (
          <p className={styles.muted}>Nothing waiting for your signature.</p>
        ) : (
          <ul className={styles.list}>
            {record.documentsToSign.map((document) => (
              <li key={document.id}>
                <span>
                  <strong>{document.title}</strong>
                  <span className={styles.muted}>
                    Sent {formatDateOnly(document.sentAt)}
                  </span>
                </span>
                <Link
                  to={myWorkDocumentPath(document.id)}
                  className={styles.signLink}>
                  Sign
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PagePanel>

      <PagePanel title="First week">
        {record.tasks.length === 0 ? (
          <p className={styles.muted}>No tasks yet.</p>
        ) : (
          <ul className={styles.list}>
            {record.tasks.map((task) => (
              <li key={task.id} data-done={!!task.doneAt || undefined}>
                <label className={styles.task}>
                  <input
                    type="checkbox"
                    checked={!!task.doneAt}
                    disabled={pendingTaskId === task.id}
                    onChange={(event) =>
                      void toggleTask(task.id, event.target.checked)
                    }
                  />
                  {task.title}
                </label>
                {task.dueOn && (
                  <span className={styles.muted}>
                    Due {formatDateOnly(task.dueOn)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </PagePanel>

      <MyPay staffId={record.staffId} firstName={firstName} />
    </div>
  )
}

export const MyWork = () => {
  const { records, isLoading, hasError } = useMyWork()
  const { profile } = useProfile()
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null)
  const firstName = profile?.firstName ?? 'you'
  const active =
    records.find((record) => record.staffId === activeStaffId) ?? records[0]

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="My work"
        title={active ? `Welcome to ${active.companyName}` : 'My work'}
        lead="Your documents to sign, your first-week tasks and your pay, in one place."
      />
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <EmptyState
          title="Couldn't load My work"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : !active ? (
        <EmptyState
          icon={<HiOutlineBriefcase />}
          title="You're not on a company's staff yet"
          description="When a company adds you and you accept their invite, your contracts, pay and tasks appear here."
        />
      ) : (
        <>
          {records.length > 1 && (
            <Tabs
              tabs={records.map((record) => ({
                key: record.staffId,
                label: record.companyName,
              }))}
              activeKey={active.staffId}
              onChange={setActiveStaffId}
            />
          )}
          <WorkRecord
            key={active.staffId}
            record={active}
            firstName={firstName}
          />
        </>
      )}
    </PageShell>
  )
}
