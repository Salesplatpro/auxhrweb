import React, { Fragment } from 'react'
import { FiCheck } from 'react-icons/fi'

import { PricingPlan } from '@/features/pricing/types'

import { SectionHeading } from '../ui'
import styles from './ComparisonTable.module.scss'
import { comparisonCell } from './planDisplay'
import { comparisonSections } from './pricingData'

type ComparisonTableProps = {
  plans: PricingPlan[]
}

const renderCell = (plan: PricingPlan, key: string, plans: PricingPlan[]) => {
  const cell = comparisonCell(plan, key, plans)
  if (cell.kind === 'text') return cell.value
  if (cell.kind === 'check') {
    return (
      <span className={styles.check} aria-label="Included">
        <FiCheck size={11} />
      </span>
    )
  }
  return (
    <span className={styles.none} aria-label="Not included">
      —
    </span>
  )
}

export const ComparisonTable = ({ plans }: ComparisonTableProps) => (
  <section className={styles.section}>
    <SectionHeading
      title="Compare every feature"
      subtitle="Everything each plan includes, side by side."
    />

    <div className={styles.card}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}>
              Compare plans
            </th>
            {plans.map((plan) => (
              <th
                key={plan.key}
                scope="col"
                className={[
                  styles.planHead,
                  plan.highlighted ? styles.planHeadHighlighted : '',
                ].join(' ')}>
                {plan.name}
                {plan.badge && (
                  <span className={styles.planBadge}>{plan.badge}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonSections.map((section) => (
            <Fragment key={section.title}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={plans.length + 1}
                  className={styles.sectionRow}>
                  {section.title}
                </th>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.key} className={styles.row}>
                  <th scope="row" className={styles.rowLabel}>
                    {row.label}
                  </th>
                  {plans.map((plan) => (
                    <td key={plan.key} className={styles.cell}>
                      {renderCell(plan, row.key, plans)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)
