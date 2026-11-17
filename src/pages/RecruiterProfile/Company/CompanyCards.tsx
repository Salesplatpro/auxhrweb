import React, { useRef, useState } from 'react'
import { FiEdit2 } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { LuRss } from 'react-icons/lu'
import { MdContentCopy } from 'react-icons/md'
import { Link } from 'react-router-dom'

import { TextInput } from '@/components/forms'
import { PagePanel } from '@/components/layout/PagePanel'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import {
  useDepartments,
  useJobFeed,
} from '@/features/organizations/hooks/useCompanyDetails'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { Organization } from '@/features/organizations/types'
import { getOrganizationStatusBadge } from '@/features/organizations/utils/getOrganizationStatusBadge'
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

export const DepartmentsCard = ({
  organization,
  canEdit,
}: {
  organization: Organization
  canEdit: boolean
}) => {
  const { add, remove, isSaving } = useDepartments(organization.id)
  const [name, setName] = useState('')
  const departments = organization.departments ?? []

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return
    if (await add(clean)) setName('')
  }

  return (
    <PagePanel
      title="Departments"
      hint="Used when you add employees. Removing one doesn't change anyone already in it.">
      {departments.length === 0 ? (
        <p className={styles.muted}>No departments yet.</p>
      ) : (
        <ul className={styles.chips}>
          {departments.map((department) => (
            <li key={department} className={styles.chip}>
              {department}
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Remove ${department}`}
                  disabled={isSaving}
                  onClick={() => void remove(department)}>
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
