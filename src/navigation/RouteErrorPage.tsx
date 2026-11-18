import React from 'react'
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import PageNotFound from '@/PageNotFound'

import styles from './RouteErrorPage.module.scss'

/**
 * Root error boundary. Unmatched splat / 404 responses stay on PageNotFound.
 * Thrown loader/render errors used to look like a 404 because every
 * errorElement was PageNotFound.
 */
export const RouteErrorPage = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PageNotFound />
  }

  const message =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
      ? error.statusText || 'Something went wrong'
      : 'Something went wrong'

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.message}>{message}</p>
      <Button type="button" size="lg" onClick={() => navigate(-1)}>
        Previous page
      </Button>
    </div>
  )
}
