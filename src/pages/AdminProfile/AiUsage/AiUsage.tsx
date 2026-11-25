import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'
import { ColumnDef, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetricCard } from '@/components/ui/MetricCard'
import { Pill } from '@/components/ui/Pill'
import { Tabs } from '@/components/ui/Tabs'
import { useAiUsage } from '@/features/admin/hooks/useAiUsage'
import { formatCount } from '@/features/admin/overview'
import {
  AiProviderCredit,
  AiUsageRange,
  AiUsageRow,
} from '@/features/admin/types'

import styles from './AiUsage.module.scss'

const RANGES: { days: AiUsageRange; label: string }[] = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
]
const DEFAULT_RANGE: AiUsageRange = 7

const parseRange = (value: string | null): AiUsageRange =>
  RANGES.find((range) => String(range.days) === value)?.days ?? DEFAULT_RANGE

export const formatUsd = (value: number) => {
  if (value === 0) return '$0.00'
  if (value < 0.01) return '<$0.01'
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const balanceText = (provider: AiProviderCredit) => {
  if (provider.balance === null) return null
  const amount =
    provider.balanceUnit === 'characters'
      ? `${formatCount(provider.balance)} characters left`
      : `${provider.balance.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${provider.balanceUnit ?? ''} left`.trim()
  return provider.balanceCheckedAt
    ? `${amount} · checked ${formatWhen(provider.balanceCheckedAt)}`
    : amount
}

const ProviderStatus = ({ provider }: { provider: AiProviderCredit }) => {
  if (provider.outOfCreditSince) {
    return (
      <Pill tone="danger" size="sm">
        Out of credit since {formatWhen(provider.outOfCreditSince)}
      </Pill>
    )
  }
  if (!provider.configured) {
    return (
      <Pill tone="neutral" size="sm">
        Not set up
      </Pill>
    )
  }
  return (
    <Pill tone="success" size="sm">
      Working
    </Pill>
  )
}

const otherUsage = (row: AiUsageRow) =>
  [
    row.characters ? `${formatCount(row.characters)} characters` : null,
    row.audioSeconds
      ? `${formatCount(Math.round(row.audioSeconds / 60))} min audio`
      : null,
  ]
    .filter(Boolean)
    .join(' · ') || '—'

const usageColumns = (nameHeader: string): ColumnDef<AiUsageRow>[] => [
  {
    key: 'name',
    header: nameHeader,
    render: (row) => row.label,
    sortAccessor: (row) => row.label,
  },
  {
    key: 'calls',
    header: 'Calls',
    align: 'right',
    render: (row) => formatCount(row.calls),
    sortAccessor: (row) => row.calls,
  },
  {
    key: 'failed',
    header: 'Failed',
    align: 'right',
    hideBelow: 640,
    render: (row) =>
      row.creditFailures
        ? `${formatCount(row.failedCalls)} (${formatCount(
            row.creditFailures,
          )} out of credit)`
        : formatCount(row.failedCalls),
    sortAccessor: (row) => row.failedCalls,
  },
  {
    key: 'input',
    header: 'Tokens in',
    align: 'right',
    hideBelow: 768,
    render: (row) => formatCount(row.inputTokens),
    sortAccessor: (row) => row.inputTokens,
  },
  {
    key: 'output',
    header: 'Tokens out',
    align: 'right',
    hideBelow: 768,
    render: (row) => formatCount(row.outputTokens),
    sortAccessor: (row) => row.outputTokens,
  },
  {
    key: 'other',
    header: 'Voice',
    align: 'right',
    hideBelow: 1024,
    render: otherUsage,
  },
  {
    key: 'cost',
    header: 'Est. cost',
    align: 'right',
    render: (row) =>
      row.unpricedCalls === row.calls ? '—' : formatUsd(row.costUsd),
    sortAccessor: (row) => row.costUsd,
  },
]

const UsageTable = ({
  title,
  nameHeader,
  rows,
}: {
  title: string
  nameHeader: string
  rows: AiUsageRow[]
}) => (
  <PagePanel title={title}>
    <DataTable
      variant="plain"
      ariaLabel={title}
      columns={usageColumns(nameHeader)}
      data={rows}
      getRowKey={(row) => row.key}
      emptyState={
        <EmptyState
          title="No AI calls yet"
          description="Nothing used AI in this period."
        />
      }
    />
  </PagePanel>
)

const AiUsage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const days = parseRange(searchParams.get('days'))
  const { usage, error, isLoading, retry } = useAiUsage(days)

  const changeRange = (key: string) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('days', key)
        return next
      },
      { replace: true },
    )

  const header = (
    <>
      <PageHeaderTitle
        title="AI usage"
        description="How much each AI provider is used, what it costs, and whether any has run out of credit."
      />
      <Tabs
        tabs={RANGES.map((range) => ({
          key: String(range.days),
          label: range.label,
        }))}
        activeKey={String(days)}
        onChange={changeRange}
      />
    </>
  )

  if (error && !usage) {
    return (
      <div className={styles.page}>
        {header}
        <PagePanel>
          <EmptyState
            title="We couldn't load AI usage"
            description="Something went wrong on our side."
            action={<Button onClick={() => void retry()}>Try again</Button>}
          />
        </PagePanel>
      </div>
    )
  }

  const totals = usage?.totals
  const loading = isLoading || !usage

  return (
    <div className={styles.page}>
      {header}

      <section className={styles.kpis} aria-label="AI usage totals">
        <MetricCard
          label="AI calls"
          loading={loading}
          value={totals && formatCount(totals.calls)}
          hint={totals && `${formatCount(totals.failedCalls)} failed`}
        />
        <MetricCard
          label="Estimated cost"
          loading={loading}
          value={totals && formatUsd(totals.costUsd)}
          hint={
            totals?.unpricedCalls
              ? `Plus ${formatCount(
                  totals.unpricedCalls,
                )} ElevenLabs calls, billed in characters`
              : 'At published prices'
          }
        />
        <MetricCard
          label="Tokens"
          loading={loading}
          value={
            totals && formatCount(totals.inputTokens + totals.outputTokens)
          }
          hint={
            totals &&
            `${formatCount(totals.inputTokens)} in · ${formatCount(
              totals.outputTokens,
            )} out`
          }
        />
        <MetricCard
          label="Refused for credit"
          loading={loading}
          value={totals && formatCount(totals.creditFailures)}
          hint="Calls a provider refused because the account was out of credit"
          attention={(totals?.creditFailures ?? 0) > 0}
        />
      </section>

      <PagePanel
        title="Providers"
        hint="Balances come from DeepSeek and ElevenLabs, the only providers that report them, checked hourly.">
        <ul className={styles.providers}>
          {(usage?.providers ?? []).map((provider) => (
            <li key={provider.key} className={styles.provider}>
              <span className={styles.providerName}>{provider.name}</span>
              <ProviderStatus provider={provider} />
              {balanceText(provider) && (
                <span className={styles.meta}>{balanceText(provider)}</span>
              )}
              {provider.outOfCreditSince && provider.creditError && (
                <span className={styles.meta}>
                  Last refusal: {provider.creditError}
                </span>
              )}
            </li>
          ))}
        </ul>
      </PagePanel>

      <UsageTable
        title="By AI job"
        nameHeader="AI job"
        rows={usage?.byFeature ?? []}
      />
      <UsageTable
        title="By model"
        nameHeader="Model"
        rows={usage?.byModel ?? []}
      />
      <UsageTable
        title="By provider"
        nameHeader="Provider"
        rows={usage?.byProvider ?? []}
      />

      {usage?.pricesVerifiedOn && (
        <p className={styles.meta}>
          Costs are estimates at each provider&apos;s published prices, checked
          on {formatDay(usage.pricesVerifiedOn)}. DeepSeek is counted at its
          peak-hours price.
        </p>
      )}
    </div>
  )
}

export default AiUsage
