import React from 'react'
import { FaFilePdf, FaFileWord, FaRegFile } from 'react-icons/fa'

import styles from './CvFile.module.scss'

interface CvFileProps {
  fileName: string
  /** When set, clicking the file name runs this handler (opens the CV through the signed-in route). */
  onOpen?: () => void
  /** id of a sibling file `<input>` — when given, renders a "Replace" label (talent's own profile). */
  replaceInputId?: string
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') return <FaFilePdf size={20} />
  if (ext === 'doc' || ext === 'docx') return <FaFileWord size={20} />
  return <FaRegFile size={20} />
}

export const CvFile: React.FC<CvFileProps> = ({
  fileName,
  onOpen,
  replaceInputId,
}) => {
  return (
    <div className={styles.box}>
      <div className={styles.icon}>{getFileIcon(fileName)}</div>
      {onOpen ? (
        <button
          type="button"
          className={styles.fileNameButton}
          title={fileName}
          onClick={onOpen}>
          {fileName}
        </button>
      ) : (
        <span className={styles.fileNameStatic} title={fileName}>
          {fileName}
        </span>
      )}
      {replaceInputId && (
        <label htmlFor={replaceInputId} className={styles.replace}>
          Replace
        </label>
      )}
    </div>
  )
}
