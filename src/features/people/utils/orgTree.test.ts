import { describe, expect, it } from 'vitest'

import { OrgChartPerson } from '../types'
import { buildOrgTree, managerChoices, OrgNode } from './orgTree'

const person = (
  id: string,
  managerId: string | null = null,
  managerLeft = false,
): OrgChartPerson => ({
  id,
  fullName: id,
  jobTitle: 'Role',
  department: null,
  managerId,
  managerLeft,
})

const countNodes = (nodes: OrgNode[]): number =>
  nodes.reduce((sum, node) => sum + 1 + countNodes(node.reports), 0)

describe('buildOrgTree', () => {
  it('nests reports and lists lone people under no manager', () => {
    const tree = buildOrgTree([
      person('boss'),
      person('mid', 'boss'),
      person('junior', 'mid'),
      person('loner'),
    ])
    expect(tree.roots).toHaveLength(1)
    expect(tree.roots[0]!.person.id).toBe('boss')
    expect(tree.roots[0]!.reports[0]!.reports[0]!.person.id).toBe('junior')
    expect(tree.noManager.map((p) => p.id)).toEqual(['loner'])
  })

  it('keeps someone whose manager is not in the list', () => {
    const tree = buildOrgTree([person('orphan', 'gone')])
    expect(tree.noManager.map((p) => p.id)).toEqual(['orphan'])
  })

  it('does not hang or lose anyone when the data contains a loop', () => {
    const tree = buildOrgTree([
      person('a', 'b'),
      person('b', 'c'),
      person('c', 'a'),
      person('d', 'd'),
    ])
    expect(countNodes(tree.roots) + tree.noManager.length).toBe(4)
  })

  it('handles an empty company', () => {
    expect(buildOrgTree([])).toEqual({ roots: [], noManager: [] })
  })
})

describe('managerChoices', () => {
  const people = [
    person('boss'),
    person('mid', 'boss'),
    person('junior', 'mid'),
    person('other'),
  ]

  it('leaves out the person and everyone under them', () => {
    expect(managerChoices(people, 'mid').map((p) => p.id)).toEqual([
      'boss',
      'other',
    ])
  })

  it('offers everyone else to someone with no reports', () => {
    expect(managerChoices(people, 'junior').map((p) => p.id)).toEqual([
      'boss',
      'mid',
      'other',
    ])
  })

  it('does not hang on a loop', () => {
    const looped = [person('a', 'b'), person('b', 'a'), person('c')]
    expect(managerChoices(looped, 'a').map((p) => p.id)).toEqual(['c'])
  })
})
