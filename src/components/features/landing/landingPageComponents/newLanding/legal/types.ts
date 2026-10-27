import { IconType } from 'react-icons'

import { BulletItem } from '../ui'

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'bullets'; items: BulletItem[] }

export type LegalSection = {
  id: string
  title: string
  blocks: LegalBlock[]
}

export type LegalHighlight = {
  icon: IconType
  title: string
  body: string
}

export type LegalContent = {
  eyebrow: string
  title: string
  meta: string
  intro: string
  highlights: LegalHighlight[]
  sections: LegalSection[]
}
