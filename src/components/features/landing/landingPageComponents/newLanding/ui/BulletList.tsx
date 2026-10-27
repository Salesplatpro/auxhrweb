import React from 'react'

import styles from './BulletList.module.scss'

export type BulletItem = string | { lead: string; text: string }

export const BulletList = ({ items }: { items: BulletItem[] }) => (
  <ul className={styles.list}>
    {items.map((item) => (
      <li
        key={typeof item === 'string' ? item : item.lead}
        className={styles.item}>
        {typeof item === 'string' ? (
          item
        ) : (
          <>
            <strong className={styles.lead}>{item.lead}</strong> {item.text}
          </>
        )}
      </li>
    ))}
  </ul>
)
