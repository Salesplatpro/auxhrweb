import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { Select } from '@/components/forms/Select'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { usePeopleAccess } from '@/features/people/hooks/usePeopleAccess'
import { useOrgChart } from '@/features/people/hooks/usePerformance'
import { useStaffActions } from '@/features/people/hooks/useStaffActions'
import { peoplePaths } from '@/features/people/paths'
import { OrgChartPerson } from '@/features/people/types'
import {
  buildOrgTree,
  managerChoices,
  OrgNode,
} from '@/features/people/utils/orgTree'

import styles from './OrgChart.module.scss'

const OPEN_LEVELS = 2
const NO_MANAGER = '__none__'

type ChangeManager = (person: OrgChartPerson, managerId: string | null) => void

const PersonCard: React.FC<{
  person: OrgChartPerson
  people: OrgChartPerson[]
  isSaving: boolean
  onChange: ChangeManager
  children?: React.ReactNode
}> = ({ person, people, isSaving, onChange, children }) => {
  const options = useMemo(
    () => [
      ...(person.managerId ? [{ value: NO_MANAGER, label: 'No manager' }] : []),
      ...managerChoices(people, person.id).map((choice) => ({
        value: choice.id,
        label: choice.fullName,
        description: choice.jobTitle,
      })),
    ],
    [people, person],
  )
  return (
    <div className={styles.person}>
      {children}
      <div className={styles.who}>
        <Link to={peoplePaths.employee(person.id)}>{person.fullName}</Link>
        <span className={styles.muted}>{person.jobTitle}</span>
        {person.managerLeft && (
          <Pill tone="warning" size="sm">
            Their manager has left
          </Pill>
        )}
      </div>
      <div className={styles.reportsTo}>
        <Select
          label="Reports to"
          name={`reports-to-${person.id}`}
          placeholder="Choose a manager"
          options={options}
          value={person.managerId}
          disabled={isSaving}
          onChange={(value) =>
            onChange(person, value === NO_MANAGER ? null : value)
          }
        />
      </div>
    </div>
  )
}

const TreeNode: React.FC<{
  node: OrgNode
  level: number
  people: OrgChartPerson[]
  isSaving: boolean
  onChange: ChangeManager
}> = ({ node, level, people, isSaving, onChange }) => {
  const [isOpen, setIsOpen] = useState(level < OPEN_LEVELS)
  const hasReports = node.reports.length > 0
  return (
    <li className={styles.node}>
      <PersonCard
        person={node.person}
        people={people}
        isSaving={isSaving}
        onChange={onChange}>
        {hasReports && (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Hide' : 'Show'} ${
              node.reports.length
            } people under ${node.person.fullName}`}
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '−' : '+'}
          </button>
        )}
      </PersonCard>
      {hasReports && isOpen && (
        <ul className={styles.tree}>
          {node.reports.map((report) => (
            <TreeNode
              key={report.person.id}
              node={report}
              level={level + 1}
              people={people}
              isSaving={isSaving}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export const OrgChart = () => {
  const navigate = useNavigate()
  const { organizationId } = usePeopleAccess()
  const { chart, isLoading, hasError, reload } = useOrgChart(organizationId)
  const { saveStaff, isSaving } = useStaffActions(organizationId)
  const people = useMemo(() => chart?.people ?? [], [chart])
  const tree = useMemo(() => buildOrgTree(people), [people])

  const change: ChangeManager = async (person, managerId) => {
    await saveStaff(person.id, { managerId })
    await reload()
  }

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Org chart"
        lead="Everyone in the company by who they report to. Change someone's manager with the Reports to box."
      />
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <EmptyState
          title="We could not load the org chart"
          description="Check your connection and try again. Nothing was lost."
          action={<Button onClick={() => void reload()}>Try again</Button>}
        />
      ) : chart?.people.length === 0 ? (
        <EmptyState
          title="No people yet"
          description="Add your first employee and they will appear here."
          action={
            <Button onClick={() => navigate(peoplePaths.employees)}>
              Add employee
            </Button>
          }
        />
      ) : (
        <>
          {chart?.truncated && (
            <Alert variant="warning">
              Only the first 5,000 people are shown.
            </Alert>
          )}
          {tree.noManager.length > 0 && (
            <PagePanel
              title="No manager set"
              action={
                <Pill tone="warning" size="sm">
                  {tree.noManager.length}{' '}
                  {tree.noManager.length === 1 ? 'person' : 'people'}
                </Pill>
              }>
              <ul className={styles.flat}>
                {tree.noManager.map((person) => (
                  <li key={person.id}>
                    <PersonCard
                      person={person}
                      people={people}
                      isSaving={isSaving}
                      onChange={change}
                    />
                  </li>
                ))}
              </ul>
            </PagePanel>
          )}
          {tree.roots.length > 0 && (
            <PagePanel title="Reporting lines">
              <ul className={styles.flat}>
                {tree.roots.map((node) => (
                  <TreeNode
                    key={node.person.id}
                    node={node}
                    level={0}
                    people={people}
                    isSaving={isSaving}
                    onChange={change}
                  />
                ))}
              </ul>
            </PagePanel>
          )}
        </>
      )}
    </PageShell>
  )
}
