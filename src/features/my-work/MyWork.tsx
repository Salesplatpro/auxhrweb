import React, { useState } from 'react'
import { HiOutlineBriefcase } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useSWRConfig } from 'swr'

import { Alert } from '@/components/feedback/Alert'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState, Tabs } from '@/components/ui'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { VestingTimeline } from '@/features/people/components/VestingTimeline'
import { useMyPay, useMyWork } from '@/features/people/hooks/useStaffData'
import { myWorkDocumentPath } from '@/features/people/paths'
import {
  downloadMySignedDocument,
  MY_WORK_KEY,
} from '@/features/people/services/peopleService'
import { CompletionRequest, MyWorkRecord } from '@/features/people/types'
import {
  formatDateOnly,
  todayDateOnly,
} from '@/features/people/utils/formatDate'
import { formatCount, formatMoney } from '@/features/people/utils/formatMoney'
import { vestedSharesOn } from '@/features/people/utils/vesting'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { downloadBlobResponse } from '@/utils/downloadBlob'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { CompletionAction } from './CompletionAction'
import { MyPerformance } from './MyPerformance'
import { MyTeam } from './MyTeam'
import styles from './MyWork.module.scss'
import { PendingInvites } from './PendingInvites'

const PER_PERIOD = { monthly: 'per month', yearly: 'per year' } as const

const usePayView = (staffId: string) => {
  const { pay, isLoading, hasError } = useMyPay(staffId)
  const current = pay?.packages.find((pkg) => pkg.id === pay.currentPackageId)
  return { pay, current, isLoading, hasError }
}

const PaySummary: React.FC<{ staffId: string; onOpen: () => void }> = ({
  staffId,
  onOpen,
}) => {
  const { pay, current } = usePayView(staffId)
  if (!current) return null
  const grant = pay?.grants[0]

  return (
    <section className={styles.paySummary}>
      <div>
        <h3>My pay</h3>
        <p className={styles.muted}>Read only · set by HR</p>
      </div>
      <dl>
        <div>
          <dt>Base salary</dt>
          <dd>
            {formatMoney(current.currency, current.baseSalary)} /{' '}
            {current.period === 'monthly' ? 'month' : 'year'}
          </dd>
        </div>
        <div>
          <dt>Total yearly</dt>
          <dd>{formatMoney(current.currency, current.totalYearly)}</dd>
        </div>
        {grant && (
          <div>
            <dt>Share options</dt>
            <dd>
              {formatCount(vestedSharesOn(grant, todayDateOnly()))} of{' '}
              {formatCount(grant.shares)} yours
            </dd>
          </div>
        )}
      </dl>
      <button type="button" className={styles.linkButton} onClick={onOpen}>
        See pay &amp; shares
      </button>
    </section>
  )
}

const PayAndShares: React.FC<{ staffId: string; firstName: string }> = ({
  staffId,
  firstName,
}) => {
  const { pay, current, isLoading, hasError } = usePayView(staffId)

  if (isLoading) return <Spinner />
  if (hasError || !pay) {
    return (
      <PagePanel title="Current pay">
        <p>Couldn&apos;t load your pay. Refresh the page to try again.</p>
      </PagePanel>
    )
  }

  return (
    <div className={styles.stack}>
      <PagePanel
        title="Current pay"
        hint={
          current
            ? `Since ${formatDateOnly(current.startsOn)} · read only`
            : undefined
        }
        action={<Pill tone="neutral">Set by HR</Pill>}>
        {current ? (
          <div className={styles.stack}>
            <StatGrid columns={4}>
              <StatCard
                label="Base salary"
                value={formatMoney(current.currency, current.baseSalary)}
                caption={PER_PERIOD[current.period]}
              />
              <StatCard
                label="Bonus"
                value={formatMoney(current.currency, current.bonus)}
                caption="per year"
              />
              <StatCard
                label="Commission target"
                value={
                  current.commissionTarget > 0
                    ? formatMoney(current.currency, current.commissionTarget)
                    : '—'
                }
                caption={
                  current.commissionTarget > 0 ? 'per year' : 'not on a plan'
                }
              />
              <StatCard
                label="Total yearly"
                value={formatMoney(current.currency, current.totalYearly)}
                caption="base + bonus + commission target"
              />
            </StatGrid>
            {current.benefits.length > 0 && (
              <div className={styles.benefits}>
                <span className={styles.muted}>Benefits</span>
                {current.benefits.map((benefit) => (
                  <Pill key={benefit.id} tone="success" size="sm">
                    {benefit.name}
                  </Pill>
                ))}
              </div>
            )}
            <p className={styles.paragraph}>{current.paragraph}</p>
          </div>
        ) : (
          <p className={styles.muted}>Your pay hasn&apos;t been set up yet.</p>
        )}
      </PagePanel>
      {pay.grants.map((grant, index) => (
        <PagePanel
          key={grant.id}
          title="My share options"
          hint={`Grant ${index + 1} · ${formatCount(
            grant.shares,
          )} shares · strike ${formatMoney(
            grant.currency,
            grant.strikePrice,
          )} · read only`}>
          <VestingTimeline grant={grant} ownerFirstName={firstName} />
        </PagePanel>
      ))}
    </div>
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

const Overview: React.FC<{ record: MyWorkRecord; onOpenPay: () => void }> = ({
  record,
  onOpenPay,
}) => {
  const { mutate } = useSWRConfig()
  const doneTasks = record.tasks.filter((task) => task.doneAt).length

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

      <PagePanel
        title="First week"
        hint={
          record.tasks.length > 0
            ? `${doneTasks} of ${record.tasks.length} done`
            : undefined
        }
        action={
          record.tasks.length > 0 ? (
            <span className={styles.muted}>
              {Math.round((doneTasks / record.tasks.length) * 100)}%
            </span>
          ) : undefined
        }>
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

      <PaySummary staffId={record.staffId} onOpen={onOpenPay} />
    </div>
  )
}

const RecordViews: React.FC<{ record: MyWorkRecord; firstName: string }> = ({
  record,
  firstName,
}) => {
  const [view, setView] = useState('overview')
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'pay', label: 'Pay & shares' },
    ...(record.hasTeam ? [{ key: 'team', label: 'My team' }] : []),
  ]
  const activeView = tabs.some((tab) => tab.key === view) ? view : 'overview'

  return (
    <div className={styles.stack}>
      <Tabs tabs={tabs} activeKey={activeView} onChange={setView} />
      {activeView === 'team' ? (
        <>
          <Alert variant="info">
            You see this tab because people report to you.
          </Alert>
          <MyTeam managerStaffId={record.staffId} />
        </>
      ) : activeView === 'pay' ? (
        <PayAndShares staffId={record.staffId} firstName={firstName} />
      ) : (
        <Overview record={record} onOpenPay={() => setView('pay')} />
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
      <PendingInvites />
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
