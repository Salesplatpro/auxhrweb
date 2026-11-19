import React, { useEffect, useState } from 'react'
import { HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2'

import { paths } from '@/paths'
import { BREAKPOINTS, isBelow } from '@/styles/breakpoints'

import chevronDown from './assets/chevron-down.svg'
import logoMark from './assets/logo-mark.png'
import styles from './Navbar.module.scss'
import { navLinks } from './navLinks'

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (!isBelow(BREAKPOINTS.lg) && isMenuOpen) setIsMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMenuOpen])

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <a href="/" className={styles.logo}>
            <img src={logoMark} alt="AuxHR" />
          </a>

          <nav className={styles.links} aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                className={styles.link}>
                {link.label}
                {link.label === 'Solutions' && (
                  <img
                    src={chevronDown}
                    aria-hidden
                    className={styles.linkChevron}
                    alt=""
                  />
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className={styles.actions}>
          <a href={`/${paths.register}`} className={styles.ctaOutline}>
            Get a Demo
          </a>
          <a href={`/${paths.register}`} className={styles.ctaSolid}>
            Try it Free
          </a>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}>
            {isMenuOpen ? (
              <HiOutlineXMark size={24} />
            ) : (
              <HiOutlineBars3 size={24} />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={styles.drawer} role="dialog" aria-modal="true">
          <nav className={styles.drawerLinks} aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                className={styles.drawerLink}
                onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className={styles.drawerActions}>
            <a
              href={`/${paths.register}`}
              className={styles.ctaOutline}
              onClick={() => setIsMenuOpen(false)}>
              Get a Demo
            </a>
            <a
              href={`/${paths.register}`}
              className={styles.ctaSolid}
              onClick={() => setIsMenuOpen(false)}>
              Try it Free
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
