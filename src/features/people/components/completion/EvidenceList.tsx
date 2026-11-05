import React from 'react'

import { Button } from '@/components/ui/Button'
import { CompletionRequest } from '@/features/people/types'

import styles from './EvidenceList.module.scss'

/** A link is shown as plain text beside its address, so a reader can see where it really goes. */
export const EvidenceList: React.FC<{
  request: Pick<CompletionRequest, 'links' | 'files'>
  onDownload: (file: CompletionRequest['files'][number]) => void
}> = ({ request, onDownload }) => (
  <>
    {request.links.length > 0 && (
      <ul className={styles.links}>
        {request.links.map((link) => (
          <li key={link}>
            <a href={link} target="_blank" rel="noopener noreferrer nofollow">
              {link}
            </a>
          </li>
        ))}
      </ul>
    )}
    {request.files.length > 0 && (
      <div className={styles.files}>
        {request.files.map((file) => (
          <Button
            key={file.id}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onDownload(file)}>
            Download {file.name}
          </Button>
        ))}
      </div>
    )}
  </>
)
