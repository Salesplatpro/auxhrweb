import cn from 'classnames'
import React, { useRef } from 'react'
import { LuRefreshCw, LuUpload } from 'react-icons/lu'

import styles from './CvField.module.scss'
import { CV_EXTENSIONS } from './profileBuilder'

type CvFieldProps = {
  fileName?: string | null
  progress: number | null
  isUploading: boolean
  error?: string | null
  onSelect: (file: File) => void
}

export const CvField = ({
  fileName,
  progress,
  isUploading,
  error,
  onSelect,
}: CvFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onSelect(file)
  }

  return (
    <div className={styles.field} data-field="cv">
      <span className={styles.label}>
        CV
        <span className={styles.required} aria-hidden>
          *
        </span>
      </span>
      {fileName && (
        <div className={cn(styles.file, isUploading && styles.active)}>
          <span className={styles.badge} aria-hidden>
            {fileName.toLowerCase().endsWith('.docx') ? 'DOC' : 'PDF'}
          </span>
          <div className={styles.fileBody}>
            <div className={styles.fileTop}>
              <span className={styles.fileName}>{fileName}</span>
              <span className={styles.percent}>
                {isUploading ? `${progress ?? 0}%` : 'Uploaded'}
              </span>
            </div>
            {isUploading && (
              <div
                className={styles.track}
                role="progressbar"
                aria-label="CV upload"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress ?? 0}>
                <span style={{ width: `${progress ?? 0}%` }} />
              </div>
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        className={styles.drop}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}>
        {fileName ? <LuRefreshCw aria-hidden /> : <LuUpload aria-hidden />}
        <strong>{fileName ? 'Replace file' : 'Upload your CV'}</strong>
        <span>PDF or DOCX, up to 5 MB</span>
      </button>
      <input
        ref={inputRef}
        id="cv"
        type="file"
        accept={CV_EXTENSIONS.join(',')}
        className={styles.input}
        onChange={handleChange}
        aria-label="CV file"
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
