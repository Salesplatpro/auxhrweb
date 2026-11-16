import 'react-responsive-modal/styles.css'

import React from 'react'
import { Modal } from 'react-responsive-modal'

import { Button } from '@/components/ui/Button'

import { Alert } from '../Alert'
import styles from './ConfirmDialog.module.scss'

type ConfirmDialogProps = {
  open: boolean
  title: string
  /** Shown in an alert. Pass `children` instead for a custom body. */
  message?: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default' | 'ink' | 'gradient'
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  description,
  icon,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal
    open={open}
    onClose={onCancel}
    center
    classNames={{ root: styles.root, overlay: 'dashboard-modal-overlay' }}>
    <div className={styles.container}>
      {icon}
      <div>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {message && (
        <Alert variant={variant === 'danger' ? 'warning' : 'info'}>
          {message}
        </Alert>
      )}
      {children}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={
            variant === 'danger'
              ? 'secondary'
              : variant === 'ink' || variant === 'gradient'
              ? variant
              : 'primary'
          }
          className={variant === 'danger' ? styles.dangerButton : undefined}
          onClick={onConfirm}
          loading={isConfirming}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
)
