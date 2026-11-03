import { OrgChartPerson } from '../types'

export interface OrgNode {
  person: OrgChartPerson
  reports: OrgNode[]
}

export interface OrgTree {
  roots: OrgNode[]
  noManager: OrgChartPerson[]
}

/**
 * Every person appears exactly once. The server refuses reporting loops, but anyone caught
 * in one here is still listed at the top, so bad data can't hang the page or hide someone.
 */
export const buildOrgTree = (people: OrgChartPerson[]): OrgTree => {
  const ids = new Set(people.map((person) => person.id))
  const reportsOf = new Map<string, OrgChartPerson[]>()
  for (const person of people) {
    if (person.managerId && ids.has(person.managerId)) {
      reportsOf.set(person.managerId, [
        ...(reportsOf.get(person.managerId) ?? []),
        person,
      ])
    }
  }

  const visited = new Set<string>()
  const toNode = (person: OrgChartPerson): OrgNode => {
    visited.add(person.id)
    return {
      person,
      reports: (reportsOf.get(person.id) ?? [])
        .filter((report) => !visited.has(report.id))
        .map(toNode),
    }
  }

  const tops = people.filter(
    (person) => !person.managerId || !ids.has(person.managerId),
  )
  const noManager = tops.filter((person) => !reportsOf.has(person.id))
  const roots = tops.filter((person) => reportsOf.has(person.id)).map(toNode)
  noManager.forEach((person) => visited.add(person.id))

  for (const person of people) {
    if (!visited.has(person.id)) roots.push(toNode(person))
  }
  return { roots, noManager }
}

/** A person's new manager can't be themselves or anyone under them. */
export const managerChoices = (
  people: OrgChartPerson[],
  personId: string,
): OrgChartPerson[] => {
  const excluded = new Set([personId])
  let grew = true
  while (grew) {
    grew = false
    for (const person of people) {
      if (
        person.managerId &&
        excluded.has(person.managerId) &&
        !excluded.has(person.id)
      ) {
        excluded.add(person.id)
        grew = true
      }
    }
  }
  return people.filter((person) => !excluded.has(person.id))
}
