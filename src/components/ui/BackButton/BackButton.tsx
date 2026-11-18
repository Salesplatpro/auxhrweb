import React from 'react'
import { MdOutlineArrowBackIosNew } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

import styles from './BackButton.module.scss'

interface BackButtonProps {
  /** Defaults to browser-back (navigate(-1)) when omitted. */
  onClick?: () => void
  className?: string
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className = '',
}) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate(-1))}
      className={`${styles.button} ${className}`.trim()}>
      <MdOutlineArrowBackIosNew />
      Back
    </button>
  )
}
