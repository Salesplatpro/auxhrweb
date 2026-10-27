import React from 'react'
import {
  HiArrowRight,
  HiCheck,
  HiOutlineEnvelope,
  HiUser,
} from 'react-icons/hi2'
import { PiSparkleFill } from 'react-icons/pi'

import { chatMessages } from './contactData'
import styles from './SupportPanel.module.scss'

export const SupportPanel = () => (
  <div className={styles.panel}>
    <div className={styles.scene} aria-hidden>
      <span className={styles.ring} />
      <span className={styles.dots} />
      <PiSparkleFill className={`${styles.sparkle} ${styles.sparkleLg}`} />
      <PiSparkleFill className={`${styles.sparkle} ${styles.sparkleTop}`} />
      <PiSparkleFill className={`${styles.sparkle} ${styles.sparkleLeft}`} />
      <PiSparkleFill className={`${styles.sparkle} ${styles.sparkleRight}`} />

      <div className={styles.chat}>
        <span className={styles.mailTile}>
          <HiOutlineEnvelope />
        </span>

        <div className={styles.chatHeader}>
          <span className={styles.avatar}>
            <HiUser />
          </span>
          <div>
            <p className={styles.agentName}>AuxHR Support</p>
            <p className={styles.status}>
              <span className={styles.statusDot} />
              Online · replies in minutes
            </p>
          </div>
        </div>

        <div className={styles.messages}>
          {chatMessages.map((message) => (
            <p
              key={message.text}
              className={`${styles.bubble} ${
                message.from === 'user' ? styles.bubbleOut : styles.bubbleIn
              }`}>
              {message.text}
            </p>
          ))}
          <span className={styles.typing}>
            <span />
            <span />
            <span />
          </span>
        </div>

        <div className={styles.composer}>
          <span>Type a message...</span>
          <span className={styles.send}>
            <HiArrowRight />
          </span>
        </div>

        <div className={styles.ticket}>
          <span className={styles.ticketCheck}>
            <HiCheck />
          </span>
          <div>
            <p className={styles.ticketTitle}>Ticket #2048</p>
            <p className={styles.ticketMeta}>Resolved in 2h</p>
          </div>
        </div>
      </div>
    </div>

    <div className={styles.copy}>
      <h2 className={styles.heading}>We’re here to help</h2>
      <p className={styles.subcopy}>
        Live chat, support tickets and a knowledge base for talents and
        recruiters.
      </p>
    </div>
  </div>
)
