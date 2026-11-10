import { describe, expect, it } from 'vitest'

import { talentNavSections } from './SideBarData'

describe('talentNavSections', () => {
  it('shows My work only to talent who also work somewhere', () => {
    expect(
      talentNavSections({}, false).map((section) => section.label),
    ).toEqual(['Menu', 'Account'])

    const work = talentNavSections({}, true).find(
      (section) => section.label === 'Work',
    )
    expect(work?.items).toEqual([
      expect.objectContaining({ name: 'My work', tag: 'New' }),
    ])
  })

  it('lists the menu in the design order with its counts', () => {
    const menu = talentNavSections({ assessments: 1, messages: 2 }, false)[0]

    expect(menu.items.map((item) => [item.name, item.count])).toEqual([
      ['Dashboard', undefined],
      ['Find Jobs', undefined],
      ['Applications', undefined],
      ['Assessments', 1],
      ['My Profile', undefined],
      ['Messages', 2],
    ])
  })

  it('sends Assessments to the pre-assessment and Settings to change password', () => {
    const items = talentNavSections({}, false).flatMap(
      (section) => section.items,
    )
    const link = (name: string) =>
      items.find((item) => item.name === name)?.link

    expect(link('Assessments')).toBe('/talentDashboard/talentQuiz')
    expect(link('Settings')).toBe('/talentDashboard/change-password')
    expect(link('Help Center')).toBe('/talentDashboard/support')
  })
})
