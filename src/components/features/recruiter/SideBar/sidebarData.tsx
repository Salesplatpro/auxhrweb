import React from 'react'
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineBell,
  HiOutlineBookOpen,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice,
  HiOutlineBuildingOffice2,
  HiOutlineChartBar,
  HiOutlineChartPie,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCog6Tooth,
  HiOutlineEye,
  HiOutlineGift,
  HiOutlineMagnifyingGlass,
  HiOutlineQuestionMarkCircle,
  HiOutlineReceiptPercent,
  HiOutlineRectangleGroup,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineViewfinderCircle,
} from 'react-icons/hi2'

import type {
  SideBarItem,
  SideBarSection,
} from '@/components/layout/sidebar/SideBar'
import { peoplePaths } from '@/features/people/paths'

const ICON_SIZE = 20

export const RECRUITER_PLACEHOLDER_PATHS = {
  preScreening: '/recruiterDashboard/pre-screening',
  aiConfiguration: '/recruiterDashboard/ai-configuration',
}

export type RecruiterNavCountKey =
  | 'jobPosts'
  | 'applications'
  | 'shortlist'
  | 'employees'
  | 'notifications'
  | 'chats'

type RecruiterNavItem = SideBarItem & { countKey?: RecruiterNavCountKey }

export const hiringItems: RecruiterNavItem[] = [
  {
    name: 'Dashboard',
    icon: <HiOutlineSquares2X2 size={ICON_SIZE} />,
    link: '/recruiterDashboard/dashboard',
  },
  {
    name: 'Job Posts',
    tourId: 'nav-my-job-posts',
    icon: <HiOutlineBriefcase size={ICON_SIZE} />,
    link: '/recruiterDashboard/myJobPosts',
    countKey: 'jobPosts',
  },
  {
    name: 'Applications',
    icon: <HiOutlineUsers size={ICON_SIZE} />,
    link: '/recruiterDashboard/dashboard/allapplications',
    countKey: 'applications',
  },
  {
    name: 'Pre-Screening',
    icon: <HiOutlineClipboardDocumentCheck size={ICON_SIZE} />,
    link: RECRUITER_PLACEHOLDER_PATHS.preScreening,
  },
  {
    name: 'AI Configuration',
    icon: <HiOutlineAdjustmentsHorizontal size={ICON_SIZE} />,
    link: RECRUITER_PLACEHOLDER_PATHS.aiConfiguration,
  },
  {
    name: 'Shortlist',
    icon: <HiOutlineStar size={ICON_SIZE} />,
    link: '/recruiterDashboard/shortlist',
    countKey: 'shortlist',
  },
  {
    name: 'Scout',
    tourId: 'nav-scout',
    icon: <HiOutlineViewfinderCircle size={ICON_SIZE} />,
    link: '/recruiterDashboard/scout',
    end: false,
  },
  {
    name: 'Talent Search',
    tourId: 'nav-talent-search',
    icon: <HiOutlineMagnifyingGlass size={ICON_SIZE} />,
    link: '/recruiterDashboard/talent-search',
    end: false,
  },
]

export const peopleItems: RecruiterNavItem[] = [
  {
    name: 'Employees',
    icon: <HiOutlineUserGroup size={ICON_SIZE} />,
    link: peoplePaths.employees,
    end: false,
    countKey: 'employees',
  },
  {
    name: 'Org chart',
    icon: <HiOutlineRectangleGroup size={ICON_SIZE} />,
    link: peoplePaths.orgChart,
  },
  {
    name: 'Company profile',
    icon: <HiOutlineBuildingOffice2 size={ICON_SIZE} />,
    link: peoplePaths.companyProfile,
  },
  {
    name: 'Benefits',
    icon: <HiOutlineGift size={ICON_SIZE} />,
    link: peoplePaths.benefits,
  },
  {
    name: 'Commission plans',
    icon: <HiOutlineReceiptPercent size={ICON_SIZE} />,
    link: peoplePaths.commissionPlans,
  },
  {
    name: 'Headcount cost',
    icon: <HiOutlineChartPie size={ICON_SIZE} />,
    link: peoplePaths.headcountCost,
  },
  {
    name: 'Quarterly review',
    icon: <HiOutlineChartBar size={ICON_SIZE} />,
    link: peoplePaths.quarterlyReview,
  },
  {
    name: 'Access log',
    icon: <HiOutlineEye size={ICON_SIZE} />,
    link: peoplePaths.accessLog,
  },
]

export const workspaceItems: RecruiterNavItem[] = [
  {
    name: 'Notifications',
    icon: <HiOutlineBell size={ICON_SIZE} />,
    link: '/recruiterDashboard/notifications',
    countKey: 'notifications',
  },
  {
    name: 'Chats',
    tourId: 'nav-chat',
    icon: <HiOutlineChatBubbleLeftRight size={ICON_SIZE} />,
    link: '/recruiterDashboard/chat',
    countKey: 'chats',
  },
  {
    name: 'Company',
    icon: <HiOutlineBuildingOffice size={ICON_SIZE} />,
    link: '/recruiterDashboard/company',
    end: false,
  },
  {
    name: 'Guide',
    tourId: 'nav-guide',
    icon: <HiOutlineBookOpen size={ICON_SIZE} />,
    link: '/recruiterDashboard/guide',
  },
  {
    name: 'Support',
    icon: <HiOutlineQuestionMarkCircle size={ICON_SIZE} />,
    link: '/recruiterDashboard/support',
  },
  {
    name: 'Settings',
    icon: <HiOutlineCog6Tooth size={ICON_SIZE} />,
    link: '/recruiterDashboard/change-password',
  },
]

const withCounts = (
  items: RecruiterNavItem[],
  counts: Partial<Record<RecruiterNavCountKey, number>>,
): SideBarItem[] =>
  items.map(({ countKey, ...item }) =>
    countKey ? { ...item, count: counts[countKey] } : item,
  )

export const recruiterNavSections = (
  counts: Partial<Record<RecruiterNavCountKey, number>>,
  showPeople: boolean,
): SideBarSection[] => [
  { label: 'Hiring', items: withCounts(hiringItems, counts) },
  ...(showPeople
    ? [{ label: 'People', items: withCounts(peopleItems, counts) }]
    : []),
  { label: 'Workspace', items: withCounts(workspaceItems, counts) },
]
