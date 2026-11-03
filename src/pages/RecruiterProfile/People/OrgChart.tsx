import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer/Drawer'
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

const PersonRow: React.FC<{
  person: OrgChartPerson
  onChange: (person: OrgChartPerson) => void
  children?: React.ReactNode
}> = ({ person, onChange, children }) => (
  <div className={styles.person}>
    {children}
    <div className={styles.who}>
      <Link to={peoplePaths.employee(person.id)}>{person.fullName}</Link>
      <span className={styles.muted}>{person.jobTitle}</span>
      {person.managerLeft && (
        <span className={styles.muted}>Their manager has left</span>
      )}
    </div>
    <Button size="sm" variant="outline" onClick={() => onChange(person)}>
      Reports to
    </Button>
  </div>
)

const TreeNode: React.FC<{
  node: OrgNode
  level: number
  onChange: (person: OrgChartPerson) => void
}> = ({ node, level, onChange }) => {
  const [isOpen, setIsOpen] = useState(level < OPEN_LEVELS)
  const hasReports = node.reports.length > 0
  return (
    <li>
      <PersonRow person={node.person} onChange={onChange}>
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
      </PersonRow>
      {hasReports && isOpen && (
        <ul className={styles.tree}>
          {node.reports.map((report) => (
            <TreeNode
              key={report.person.id}
              node={report}
              level={level + 1}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

const ChangeManager: React.FC<{
  person: OrgChartPerson | null
  people: OrgChartPerson[]
  isSaving: boolean
  onSave: (managerId: string | null) => void
  onClose: () => void
}> = ({ person, people, isSaving, onSave, onClose }) => {
  const [managerId, setManagerId] = useState(person?.managerId ?? '')
  const choices = useMemo(
    () => (person ? managerChoices(people, person.id) : []),
    [people, person],
  )
  return (
    <Drawer
      open={!!person}
      onClose={onClose}
      title={person ? `Who does ${person.fullName} report to?` : ''}
      actions={
        <Button loading={isSaving} onClick={() => onSave(managerId || null)}>
          Save
        </Button>
      }>
      {person && (
        <label className={styles.field}>
          <span>Reports to</span>
          <select
            value={managerId}
            onChange={(event) => setManagerId(event.target.value)}>
            <option value="">No manager</option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.fullName} · {choice.jobTitle}
              </option>
            ))}
          </select>
        </label>
      )}
    </Drawer>
  )
}

export const OrgChart = () => {
  const { organizationId } = usePeopleAccess()
  const { chart, isLoading, hasError, reload } = useOrgChart(organizationId)
  const { saveStaff, isSaving } = useStaffActions(organizationId)
  const [changing, setChanging] = useState<OrgChartPerson | null>(null)
  const tree = useMemo(() => buildOrgTree(chart?.people ?? []), [chart])

  const save = async (managerId: string | null) => {
    if (!changing) return
    const saved = await saveStaff(changing.id, { managerId })
    await reload()
    if (saved) setChanging(null)
  }

  return (
    <PageShell wide>
      <PageHero
        compact
        kicker="People"
        title="Org chart"
        lead="Who reports to whom, from the manager on each staff record."
      />
      {isLoading ? (
        <Spinner />
      ) : hasError ? (
        <EmptyState
          title="Couldn't load the org chart"
          description="Something went wrong on our side. Refresh the page to try again."
        />
      ) : chart?.people.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add people on the Employees page to see your org chart."
        />
      ) : (
        <>
          {chart?.truncated && (
            <Alert variant="warning">
              Only the first 5,000 people are shown.
            </Alert>
          )}
          {tree.noManager.length > 0 && (
            <PagePanel title="No manager set">
              <ul className={styles.flat}>
                {tree.noManager.map((person) => (
                  <li key={person.id}>
                    <PersonRow person={person} onChange={setChanging} />
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
                    onChange={setChanging}
                  />
                ))}
              </ul>
            </PagePanel>
          )}
        </>
      )}
      <ChangeManager
        key={changing?.id ?? 'none'}
        person={changing}
        people={chart?.people ?? []}
        isSaving={isSaving}
        onSave={(managerId) => void save(managerId)}
        onClose={() => setChanging(null)}
      />
    </PageShell>
  )
}
