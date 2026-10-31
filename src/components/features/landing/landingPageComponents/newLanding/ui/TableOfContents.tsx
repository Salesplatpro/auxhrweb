import React, { useEffect, useState } from 'react'

import styles from './TableOfContents.module.scss'

export type TocItem = { id: string; label: string }

type TableOfContentsProps = {
  items: TocItem[]
  title?: string
}

export const TableOfContents = ({
  items,
  title = 'On this page',
}: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState(items[0]?.id)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px' },
    )

    items.forEach(({ id }) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [items])

  return (
    <nav className={styles.toc} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={[styles.link, isActive ? styles.active : ''].join(
                  ' ',
                )}
                aria-current={isActive ? 'location' : undefined}>
                <span className={styles.number}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
