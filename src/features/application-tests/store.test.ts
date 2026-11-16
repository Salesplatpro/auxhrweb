import { beforeEach, describe, expect, it } from 'vitest'

import { draftKey, useApplicationTestsStore } from './store'

const store = () => useApplicationTestsStore.getState()

describe('application test drafts', () => {
  beforeEach(() => store().reset())

  it('keeps each user’s answers apart', () => {
    store().setAnswer(draftKey('ada', 'app1', 'culture-fit'), 'q1', 2)
    store().setAnswer(draftKey('bob', 'app1', 'culture-fit'), 'q1', 0)

    expect(store().drafts['ada:app1:culture-fit']!.answers).toEqual({ q1: 2 })
    expect(store().drafts['bob:app1:culture-fit']!.answers).toEqual({ q1: 0 })
  })

  it('drops answers to questions that are no longer in the set and keeps the place in range', () => {
    const key = draftKey('ada', 'app1', 'problem-solving')
    store().setAnswer(key, 'q1', 1)
    store().setAnswer(key, 'gone', 3)
    store().setIndex(key, 4)

    store().keepOnly(key, ['q1', 'q2'])

    expect(store().drafts[key]).toEqual({ answers: { q1: 1 }, index: 1 })
  })

  it('forgets a draft once it is sent, and everything on reset', () => {
    const key = draftKey('ada', 'app1', 'problem-solving')
    store().setAnswer(key, 'q1', 1)
    store().clear(key)
    expect(store().drafts[key]).toBeUndefined()

    store().setAnswer(key, 'q1', 1)
    store().reset()
    expect(store().drafts).toEqual({})
  })
})
