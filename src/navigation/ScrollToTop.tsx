import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Open every route at the top of the page.
 * Hash-only changes on the same path are ignored so in-page anchors still work.
 * Dashboards scroll their content area rather than the window, so that is reset too.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search])

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>('[data-scroll-root]')
      .forEach((root) => {
        root.scrollTop = 0
      })
  }, [pathname])

  return null
}
