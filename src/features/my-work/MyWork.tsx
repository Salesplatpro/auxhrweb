import React, { useState } from 'react'
import { HiOutlineBriefcase } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState, Tabs } from '@/components/ui'
import { Spinner } from '@/components/ui/Spinner'
import { VestingTimeline } from '@/features/people/components/VestingTimeline'
import { useMyPay, useMyWork } from '@/features/people/hooks/useStaffData'
import { myWorkDocumentPath } from '@/features/people/paths'
import {
  downloadMySignedDocument,
  MY_WORK_KEY,
} from '@/features/people/services/peopleService'
import { CompletionRequest, MyWorkRecord } from '@/features/people/types'
import { formatDateOnly } from '@/features/people/utils/formatDate'
import { formatMoney } from '@/features/people/utils/formatMoney'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { downloadBlobResponse } from '@/utils/downloadBlob'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { CompletionAction } from './CompletionAction'
import { MyPerformance } from './MyPerformance'
import { MyTeam } from './MyTeam'
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

const MyDocuments: React.FC<{ documents: MyWorkRecord['signedDocuments'] }> = ({
  documents,
}) => {
  const [pendingId, setPendingId] = useState<string | null>(null)

  const download = async (document: { id: string; title: string }) => {
    setPendingId(document.id)
    try {
      const response = await downloadMySignedDocument(document.id)
      downloadBlobResponse(
        response.data,
        response.headers['content-disposition'],
        `${document.title}.pdf`,
      )
    } catch (error) {
      notify(
        'error',
        getErrorMessage(error, 'Could not download this document'),
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <PagePanel title="My documents">
      {documents.length === 0 ? (
        <p className={styles.muted}>Documents you sign will appear here.</p>
      ) : (
        <ul className={styles.list}>
          {documents.map((document) => (
            <li key={document.id}>
              <span>
                <strong>{document.title}</strong>
                <span className={styles.muted}>
                  Signed {formatDateOnly(document.signedAt)}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                loading={pendingId === document.id}
                onClick={() => void download(document)}>
                Download
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PagePanel>
  )
}

const WorkRecord: React.FC<{ record: MyWorkRecord; firstName: string }> = ({
  record,
  firstName,
}) => {
  const { mutate } = useSWRConfig()

  const updateTaskRequest = (
    taskId: string,
    request: CompletionRequest | null,
  ) =>
    mutate<MyWorkRecord[]>(
      MY_WORK_KEY,
      (records = []) =>
        records.map((item) =>
          item.staffId === record.staffId
            ? {
                ...item,
                completionRequests: [
                  ...(request ? [request] : []),
                  ...item.completionRequests.filter(
                    (existing) => existing.itemId !== taskId,
                  ),
                ],
              }
            : item,
        ),
      { revalidate: false },
    )

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

      <MyDocuments documents={record.signedDocuments} />

      <PagePanel title="First week">
        {record.tasks.length === 0 ? (
          <p className={styles.muted}>No tasks yet.</p>
        ) : (
          <ul className={styles.list}>
            {record.tasks.map((task) => (
              <li key={task.id} data-done={!!task.doneAt || undefined}>
                <span className={styles.goalText}>
                  <strong>{task.title}</strong>
                  {task.dueOn && !task.doneAt && (
                    <span className={styles.muted}>
                      Due {formatDateOnly(task.dueOn)}
                    </span>
                  )}
                </span>
                <CompletionAction
                  staffId={record.staffId}
                  itemType="task"
                  itemId={task.id}
                  title={task.title}
                  request={record.completionRequests.find(
                    (request) => request.itemId === task.id,
                  )}
                  isComplete={!!task.doneAt}
                  completedByName={task.completedByName ?? null}
                  onChanged={(request) =>
                    void updateTaskRequest(task.id, request)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PagePanel>

      <MyPerformance staffId={record.staffId} />

      <MyPay staffId={record.staffId} firstName={firstName} />
    </div>
  )
}

const VIEWS = [
  { key: 'mine', label: 'My work' },
  { key: 'team', label: 'My team' },
]

const RecordViews: React.FC<{ record: MyWorkRecord; firstName: string }> = ({
  record,
  firstName,
}) => {
  const [view, setView] = useState('mine')
  const showTeam = record.hasTeam && view === 'team'
  return (
    <div className={styles.stack}>
      {record.hasTeam && (
        <Tabs tabs={VIEWS} activeKey={view} onChange={setView} />
      )}
      {showTeam ? (
        <MyTeam managerStaffId={record.staffId} />
      ) : (
        <WorkRecord record={record} firstName={firstName} />
      )}
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
          <RecordViews
            key={active.staffId}
            record={active}
            firstName={firstName}
          />
        </>
      )}
    </PageShell>
  )
}
