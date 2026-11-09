import React, { useState } from 'react'
import { LuEye, LuEyeOff } from 'react-icons/lu'

import { TextInput, TextInputProps } from '../TextInput'
import styles from './PasswordInput.module.scss'

type PasswordInputProps = Omit<TextInputProps, 'isPassword' | 'endAdornment'>

export const PasswordInput = (props: PasswordInputProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <TextInput
      {...props}
      isPassword={!visible}
      endAdornment={
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((prev) => !prev)}>
          {visible ? <LuEyeOff /> : <LuEye />}
        </button>
      }
    />
  )
}
