import { paths } from '@/paths'

export type FooterLink = {
  label: string
  href: string
  external?: boolean
}

export type FooterColumn = {
  title: string
  links: FooterLink[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'For Organisation', href: '#' },
      { label: 'For Talents', href: '#' },
      { label: 'For Recruiters', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: `/${paths.aboutUs}` },
      { label: 'Support', href: '#' },
      { label: 'Contact', href: `/${paths.contact}` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Features', href: `/${paths.features}` },
      { label: 'Pricing', href: `/${paths.pricing}` },
    ],
  },
  {
    title: 'Use cases',
    links: [
      { label: 'Startups', href: '#' },
      { label: 'Enterprise', href: '#' },
      { label: 'Companies', href: '#' },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'Instagram', href: paths.instagram, external: true },
      { label: 'LinkedIn', href: paths.linkedIn, external: true },
      { label: 'Facebook', href: paths.facebook, external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: `/${paths.termsConditions}` },
      { label: 'Privacy', href: `/${paths.privacyPolicy}` },
      { label: 'Cookies', href: '#' },
    ],
  },
]
