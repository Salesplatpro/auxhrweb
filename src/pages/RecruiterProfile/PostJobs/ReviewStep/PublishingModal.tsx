import 'react-responsive-modal/styles.css'

import React from 'react'
import { Modal } from 'react-responsive-modal'

import { Spinner } from '@/components/ui/Spinner'

import styles from './ReviewStep.module.scss'

export const PublishingModal = ({
  open,
  roleName,
}: {
  open: boolean
  roleName: string
}) => (
  <Modal
    open={open}
    onClose={() => undefined}
    center
    closeOnEsc={false}
    closeOnOverlayClick={false}
    showCloseIcon={false}
    classNames={{ overlay: 'dashboard-modal-overlay', modal: styles.modal }}
    aria-labelledby="publishing-title">
    <Spinner size="lg" />
    <h2 id="publishing-title" className={styles.modalTitle}>
      Publishing your job...
    </h2>
    <p className={styles.modalText}>
      Writing tailored test questions{roleName ? ` for ${roleName}` : ''}. This
      takes a few seconds.
    </p>
  </Modal>
)
