import React from 'react'
import { useParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'

import {
  fetchMyDocument,
  MY_WORK_KEY,
  signMyDocument,
} from '@/features/people/services/peopleService'
import { SigningPage } from '@/features/sign-document/SignDocument'

export const MyWorkDocument = () => {
  const { documentId = '' } = useParams<{ documentId: string }>()
  const { mutate } = useSWRConfig()

  return (
    <SigningPage
      cacheKey={`${MY_WORK_KEY}/documents/${documentId}`}
      loadDocument={() => fetchMyDocument(documentId)}
      submitSignature={(fullName) => signMyDocument(documentId, fullName)}
      onSigned={() => void mutate(MY_WORK_KEY)}
    />
  )
}
