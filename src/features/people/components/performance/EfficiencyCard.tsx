import React from 'react'

import { PagePanel } from '@/components/layout/PagePanel'
import { Button } from '@/components/ui/Button'

import { usePerformanceChange } from '../../hooks/usePerformance'
import { requestEfficiencyTip } from '../../services/peopleService'
import { Efficiency, ManagedPerformance } from '../../types'
import styles from './Performance.module.scss'

const PART_LABELS: Record<Efficiency['parts'][number]['key'], string> = {
  goals: 'Goal progress',
  reports: 'Weekly reports submitted',
  rating: 'Manager rating',
}

interface EfficiencyCardProps {
  base: string
  performance: ManagedPerformance
  readOnly: boolean
}

export const EfficiencyCard: React.FC<EfficiencyCardProps> = ({
  base,
  performance,
  readOnly,
}) => {
  const { efficiency, efficiencyTip, isExecutive } = performance
  const { run, updateCache, pending } =
    usePerformanceChange<ManagedPerformance>(base)
  const missing = efficiency.parts.filter((part) => part.value === null)

  const askForTip = () =>
    run(
      'tip',
      async () => {
        const tip = await requestEfficiencyTip(base)
        await updateCache((current) => ({ ...current, efficiencyTip: tip }))
      },
      'Could not get a tip. Please try again.',
    )

  return (
    <PagePanel title="Efficiency" hint={efficiency.quarter}>
      {efficiency.score === null ? (
        <p className={styles.muted}>Not enough data yet.</p>
      ) : (
        <div className={styles.stack}>
          <p className={styles.score}>{efficiency.score} / 100</p>
          {efficiency.partial && (
            <p className={styles.muted}>
              Partial score. No data yet for{' '}
              {missing
                .map((part) => PART_LABELS[part.key].toLowerCase())
                .join(' or ')}
              , so the other parts carry more weight.
            </p>
          )}
          <dl className={styles.parts}>
            {efficiency.parts.map((part) => (
              <div key={part.key}>
                <dt>
                  {PART_LABELS[part.key]} ({Math.round(part.weight * 100)}%)
                </dt>
                <dd>
                  {part.value === null
                    ? 'No data'
                    : `${Math.round(part.value)}%`}
                </dd>
              </div>
            ))}
          </dl>
          {!isExecutive && (
            <div className={styles.stack}>
              {efficiencyTip && (
                <p className={styles.body}>
                  <span className={styles.pill}>AI suggestion</span>{' '}
                  {efficiencyTip.tip}
                </p>
              )}
              {!readOnly && !efficiencyTip?.current && (
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pending === 'tip'}
                    onClick={() => void askForTip()}>
                    {efficiencyTip ? 'Get a new tip' : 'Get a tip'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}
