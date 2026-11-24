import React, { useRef, useState } from 'react'
import { FiEdit2 } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { LuRss } from 'react-icons/lu'
import { MdContentCopy } from 'react-icons/md'
import { Link } from 'react-router-dom'

import { TextInput } from '@/components/forms'
import { Select } from '@/components/forms/Select'
import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import {
  useDepartmentList,
  useDepartments,
  useJobFeed,
} from '@/features/organizations/hooks/useCompanyDetails'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { Department, Organization } from '@/features/organizations/types'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'
import { useStaffOptions } from '@/features/people/hooks/useStaffData'
import { usePricingCatalog } from '@/features/pricing/hooks/usePricingCatalog'
import { getPlanDisplayName } from '@/features/pricing/utils/getPlanDisplayName'
import { notify } from '@/utils/toastNotifications'

import styles from './CompanyCards.module.scss'
import { CompanyLogo } from './CompanyLogo'

const MAX_DEPARTMENT_LENGTH = 60

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1)

export const CompanyHeaderCard = ({
  organization,
  canEdit,
  onEdit,
}: {
  organization: Organization
  canEdit: boolean
  onEdit: () => void
}) => {
  const facts = [
    organization.industry,
    organization.size ? `${organization.size} staff` : null,
    organization.address,
    organization.website?.replace(/^https?:\/\//, ''),
  ].filter(Boolean)

  return (
    <section className={styles.header}>
      <CompanyLogo
        name={organization.name}
        logoUrl={organization.logoUrl}
        size="lg"
      />
      <div className={styles.headerBody}>
        <div className={styles.headerTitle}>
          <h1>{organization.name}</h1>
          <StatusBadge
            status={statusLabel(organization.status)}
            {...getOrganizationStatusBadge(organization.status)}
          />
        </div>
        {facts.length > 0 && (
          <p className={styles.muted}>{facts.join(' · ')}</p>
        )}
      </div>
      {canEdit && (
        <Button variant="outline" onClick={onEdit}>
          <FiEdit2 aria-hidden />
          Edit company
        </Button>
      )}
    </section>
  )
}

const Fact = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div>
    <p className={styles.factLabel}>{label}</p>
    <p className={styles.factValue}>{value || '—'}</p>
  </div>
)

export const AboutCompanyCard = ({
  organization,
}: {
  organization: Organization
}) => (
  <PagePanel title="About the company" hint="Shown on every job post">
    <p className={styles.about}>
      {organization.about || 'No description yet.'}
    </p>
    <div className={styles.facts}>
      <Fact label="Industry" value={organization.industry} />
      <Fact label="Company size" value={organization.size} />
      <Fact label="Founded" value={organization.foundedYear} />
      <Fact label="Email" value={organization.email} />
      <Fact label="Phone" value={organization.phone} />
      <Fact
        label="Website"
        value={organization.website?.replace(/^https?:\/\//, '')}
      />
    </div>
    <div className={styles.values}>
      <p className={styles.factLabel}>Company values</p>
      <p className={styles.factValue}>
        {organization.companyValues || 'Not added yet.'}
      </p>
    </div>
  </PagePanel>
)

const NO_HEAD = ''

export const DepartmentsCard = ({
  organization,
  canEdit,
  canAssignHeads,
}: {
  organization: Organization
  canEdit: boolean
  canAssignHeads: boolean
}) => {
  const { add, remove, setHead, isSaving } = useDepartments(organization.id)
  const { departments } = useDepartmentList(organization.id)
  const { options } = useStaffOptions(organization.id, {
    enabled: canAssignHeads,
  })
  const [name, setName] = useState('')
  const headOptions = [
    { value: NO_HEAD, label: 'No head' },
    ...options.map((person) => ({
      value: person.id,
      label: person.fullName,
      description: person.jobTitle,
    })),
  ]

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return
    if (await add(clean)) setName('')
  }

  const handleRemove = (department: Department) => {
    const people = department.staffCount
    if (
      people > 0 &&
      !window.confirm(
        `${people} ${
          people === 1 ? 'person' : 'people'
        } will have no department. Remove ${department.name}?`,
      )
    ) {
      return
    }
    void remove(department.name)
  }

  return (
    <PagePanel
      title="Departments"
      hint="Used when you add employees. The company's creator picks a head for each department, who manages everyone in it from My work.">
      {departments.length === 0 ? (
        <p className={styles.muted}>No departments yet.</p>
      ) : (
        <ul className={styles.departmentList}>
          {departments.map((department) => (
            <li key={department.id} className={styles.departmentRow}>
              <div className={styles.departmentName}>
                <strong>{department.name}</strong>
                <span className={styles.muted}>
                  {department.staffCount}{' '}
                  {department.staffCount === 1 ? 'person' : 'people'}
                </span>
              </div>
              {canAssignHeads ? (
                <div className={styles.departmentHead}>
                  <Select
                    name={`head-${department.id}`}
                    label={`Head of ${department.name}`}
                    options={headOptions}
                    value={department.head?.staffId ?? NO_HEAD}
                    disabled={isSaving}
                    searchable
                    onChange={(staffId) =>
                      void setHead(department.id, staffId || null)
                    }
                  />
                </div>
              ) : (
                <span className={styles.muted}>
                  {department.head
                    ? `Head: ${department.head.fullName}`
                    : 'No head yet'}
                </span>
              )}
              {canEdit && (
                <button
                  type="button"
                  className={styles.departmentRemove}
                  aria-label={`Remove ${department.name}`}
                  disabled={isSaving}
                  onClick={() => handleRemove(department)}>
                  <IoClose aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form className={styles.addRow} onSubmit={(e) => void handleAdd(e)}>
          <TextInput
            name="department"
            label="department"
            title="New department"
            placeholder="e.g. Engineering"
            value={name}
            maxLength={MAX_DEPARTMENT_LENGTH}
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            loading={isSaving}
            disabled={!name.trim()}>
            Add
          </Button>
        </form>
      )}
    </PagePanel>
  )
}

export const JobFeedCard = ({
  organization,
  canEdit,
}: {
  organization: Organization
  canEdit: boolean
}) => {
  const { feed, error, isToggling, setEnabled } = useJobFeed(organization.id)
  const linkRef = useRef<HTMLInputElement>(null)

  const copy = async () => {
    if (!feed?.url) return
    try {
      await navigator.clipboard.writeText(feed.url)
      notify('success', 'Feed link copied', {
        description: "Paste it into the job site's employer settings.",
      })
    } catch {
      linkRef.current?.select()
      notify('info', 'Press ⌘C to copy the selected link')
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.feedHead}>
        <span className={styles.feedIcon} aria-hidden>
          <LuRss />
        </span>
        <div className={styles.feedTitle}>
          <h2>Job feed</h2>
          <p className={styles.muted}>
            Share our open jobs with job sites like Indeed
          </p>
        </div>
        <Switch
          label="Job feed"
          hideLabel
          checked={feed?.enabled ?? !!organization.indeedFeedEnabled}
          disabled={!canEdit || isToggling || (!feed && !error)}
          onChange={(next) => void setEnabled(next)}
        />
      </div>

      {error && <p className={styles.muted}>Couldn&apos;t load the feed.</p>}

      {feed?.enabled && (
        <>
          {feed.url ? (
            <div className={styles.linkRow}>
              <input
                ref={linkRef}
                readOnly
                aria-label="Feed link"
                className={styles.linkInput}
                value={feed.url}
                onFocus={(event) => event.target.select()}
              />
              <Button variant="outline" onClick={() => void copy()}>
                <MdContentCopy aria-hidden />
                Copy
              </Button>
            </div>
          ) : (
            <p className={styles.muted}>
              The feed link isn&apos;t available yet. Try again later.
            </p>
          )}
          <p className={styles.muted}>
            Paste this link into the job site&apos;s employer settings. New and
            closed jobs update there every hour.
          </p>
          <div className={styles.liveRow}>
            <span className={styles.live}>Live</span>
            <span>
              {feed.openJobs} open {feed.openJobs === 1 ? 'job' : 'jobs'} in the
              feed
            </span>
            {feed.updatedAt && (
              <span className={styles.updated}>
                Updated {formatTime(feed.updatedAt)}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export const PlanCard = ({ organization }: { organization: Organization }) => {
  const { usage, error } = useOrganizationUsage(organization.id)
  const { catalog } = usePricingCatalog()

  if (error || !usage) return null

  return (
    <section className={styles.card}>
      <div className={styles.planHead}>
        <h2>{getPlanDisplayName(usage.billingPlan, catalog)}</h2>
        <Link to="/recruiterDashboard/plan" className={styles.planLink}>
          Manage plan
        </Link>
      </div>
      {usage.billingPeriodEnd && (
        <p className={styles.muted}>
          Renews {formatDay(usage.billingPeriodEnd)}
        </p>
      )}
      <ul className={styles.meters}>
        {usage.meters.map((meter) => {
          const pct =
            meter.limit && meter.limit > 0
              ? Math.min(100, Math.round((meter.used / meter.limit) * 100))
              : 0
          return (
            <li key={meter.key}>
              <div className={styles.meterRow}>
                <span>{meter.label}</span>
                <span className={styles.muted}>
                  {meter.used.toLocaleString()} of{' '}
                  {meter.limit == null
                    ? 'unlimited'
                    : meter.limit.toLocaleString()}
                </span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
