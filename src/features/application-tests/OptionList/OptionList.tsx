import cn from 'classnames'
import React from 'react'

import styles from './OptionList.module.scss'

const LETTERS = ['A', 'B', 'C', 'D']

type OptionListProps = {
  name: string
  options: string[]
  selected: number | undefined
  onSelect: (index: number) => void
}

export const OptionList = ({
  name,
  options,
  selected,
  onSelect,
}: OptionListProps) => (
  <div className={styles.list} role="radiogroup">
    {options.map((option, index) => (
      <label
        key={option}
        className={cn(styles.option, selected === index && styles.selected)}>
        <input
          type="radio"
          className={styles.input}
          name={name}
          checked={selected === index}
          onChange={() => onSelect(index)}
        />
        <span className={styles.radio} aria-hidden />
        <span className={styles.letter}>{LETTERS[index]}</span>
        <span>{option}</span>
      </label>
    ))}
  </div>
)
