import { IconType } from 'react-icons'
import {
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlineMapPin,
} from 'react-icons/hi2'

import { paths } from '@/paths'

import { InfoCardAction } from '../ui'

export const RESPONSE_TIME = '[1 business day]'
export const SUPPORT_EMAIL = '[support@auxhr.com]'
export const OFFICE_ADDRESS = '[Street address], Lagos, Nigeria'

export type ContactRole = 'recruiter' | 'talent'

export const roleOptions: { value: ContactRole; label: string }[] = [
  { value: 'recruiter', label: 'Recruiter / Business' },
  { value: 'talent', label: 'Talent / Job seeker' },
]

export const subjectOptions = [
  { value: 'demo', label: 'Book a demo' },
  { value: 'sales', label: 'Sales & pricing' },
  { value: 'account', label: 'Account & billing' },
  { value: 'applications', label: 'Applications & job posts' },
  { value: 'other', label: 'Something else' },
]

export const chatMessages: { from: 'agent' | 'user'; text: string }[] = [
  { from: 'agent', text: 'Hi there! How can we help today?' },
  { from: 'user', text: 'We’d like a demo for our hiring team.' },
  {
    from: 'agent',
    text: 'Happy to help. Pick a time and we’ll walk you through AuxHR.',
  },
]

export const contactChannels: {
  icon: IconType
  title: string
  body: string
  action: InfoCardAction
}[] = [
  {
    icon: HiOutlineEnvelope,
    title: 'Email support',
    body: `For help with your account, applications or job posts. We reply within ${RESPONSE_TIME}.`,
    action: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  },
  {
    icon: HiOutlineCalendarDays,
    title: 'Sales & demos',
    body: 'See how AuxHR screens, matches and manages candidates for your team.',
    action: {
      label: 'Book a demo',
      href: `/${paths.register}`,
      showArrow: true,
    },
  },
  {
    icon: HiOutlineMapPin,
    title: 'Office',
    body: 'Come say hi. Visits by appointment.',
    action: { label: OFFICE_ADDRESS },
  },
]
