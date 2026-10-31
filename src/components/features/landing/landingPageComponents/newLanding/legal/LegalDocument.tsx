import React from 'react'

import {
  BulletList,
  DocSection,
  InfoCard,
  PageHero,
  TableOfContents,
} from '../ui'
import styles from './LegalDocument.module.scss'
import { LegalBlock, LegalContent } from './types'

const renderBlock = (block: LegalBlock, key: number) => {
  if (block.type === 'subheading') return <h3 key={key}>{block.text}</h3>
  if (block.type === 'bullets')
    return <BulletList key={key} items={block.items} />
  return <p key={key}>{block.text}</p>
}

export const LegalDocument = ({
  eyebrow,
  title,
  meta,
  intro,
  highlights,
  sections,
}: LegalContent) => (
  <>
    <PageHero eyebrow={eyebrow} title={title} meta={meta} subtitle={intro}>
      <div className={styles.highlights}>
        {highlights.map(({ icon: Icon, ...highlight }) => (
          <InfoCard key={highlight.title} icon={<Icon />} {...highlight} />
        ))}
      </div>
    </PageHero>

    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <TableOfContents
          items={sections.map(({ id, title: label }) => ({ id, label }))}
        />
      </aside>
      <div>
        {sections.map((section, index) => (
          <DocSection
            key={section.id}
            id={section.id}
            index={index + 1}
            title={section.title}>
            {section.blocks.map(renderBlock)}
          </DocSection>
        ))}
      </div>
    </div>
  </>
)
