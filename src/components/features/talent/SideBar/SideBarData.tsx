import React from 'react'
import {
  HiOutlineBriefcase,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineQuestionMarkCircle,
  HiOutlineSquares2X2,
  HiOutlineUser,
} from 'react-icons/hi2'

import type {
  SideBarItem,
  SideBarSection,
} from '@/components/layout/sidebar/SideBar'
import { myWorkPath } from '@/features/people/paths'

const ICON_SIZE = 20

export type TalentNavCountKey = 'assessments' | 'messages'

type TalentNavItem = SideBarItem & { countKey?: TalentNavCountKey }

export const menuItems: TalentNavItem[] = [
  {
    name: 'Dashboard',
    icon: <HiOutlineSquares2X2 size={ICON_SIZE} />,
    link: '/talentDashboard',
  },
  {
    name: 'Find Jobs',
    tourId: 'nav-jobs',
    icon: <HiOutlineMagnifyingGlass size={ICON_SIZE} />,
    link: '/talentDashboard/job',
    end: false,
  },
  {
    name: 'Applications',
    tourId: 'nav-pipeline',
    icon: <HiOutlineDocumentText size={ICON_SIZE} />,
    link: '/talentDashboard/applicationPipeline',
    end: false,
  },
  {
    name: 'Assessments',
    tourId: 'nav-pre-assessment',
    icon: <HiOutlineClipboardDocumentCheck size={ICON_SIZE} />,
    link: '/talentDashboard/talentQuiz',
    countKey: 'assessments',
  },
  {
    name: 'My Profile',
    icon: <HiOutlineUser size={ICON_SIZE} />,
    link: '/talentDashboard/talentProfile',
  },
  {
    name: 'Messages',
    tourId: 'nav-inbox',
    icon: <HiOutlineChatBubbleOvalLeft size={ICON_SIZE} />,
    link: '/talentDashboard/chat',
    countKey: 'messages',
  },
]

export const workItems: TalentNavItem[] = [
  {
    name: 'My work',
    icon: <HiOutlineBriefcase size={ICON_SIZE} />,
    link: myWorkPath,
    end: false,
    tag: 'New',
  },
]

export const accountItems: TalentNavItem[] = [
  {
    name: 'Settings',
    icon: <HiOutlineCog6Tooth size={ICON_SIZE} />,
    link: '/talentDashboard/change-password',
  },
  {
    name: 'Help Center',
    icon: <HiOutlineQuestionMarkCircle size={ICON_SIZE} />,
    link: '/talentDashboard/support',
  },
]

const withCounts = (
  items: TalentNavItem[],
  counts: Partial<Record<TalentNavCountKey, number>>,
): SideBarItem[] =>
  items.map(({ countKey, ...item }) =>
    countKey ? { ...item, count: counts[countKey] } : item,
  )

export const talentNavSections = (
  counts: Partial<Record<TalentNavCountKey, number>>,
  showWork: boolean,
): SideBarSection[] => [
  { label: 'Menu', items: withCounts(menuItems, counts) },
  ...(showWork
    ? [{ label: 'Work', items: withCounts(workItems, counts) }]
    : []),
  { label: 'Account', items: withCounts(accountItems, counts) },
]
