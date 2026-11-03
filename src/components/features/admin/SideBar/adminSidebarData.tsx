import React from 'react'
import {
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import {
  HiOutlineCpuChip,
  HiOutlineUserCircle,
  HiOutlineUsers,
} from 'react-icons/hi2'
import { MdOutlineAdminPanelSettings } from 'react-icons/md'

const ICON_SIZE = 20

export const adminSidebarData = [
  {
    name: 'Overview',
    icon: <HiOutlineChartBar size={ICON_SIZE} />,
    link: '/adminDashboard',
    end: true,
  },
  {
    name: 'Talents',
    icon: <HiOutlineUsers size={ICON_SIZE} />,
    link: '/adminDashboard/talents',
  },
  {
    name: 'Recruiters',
    icon: <HiOutlineUserCircle size={ICON_SIZE} />,
    link: '/adminDashboard/recruiters',
  },
  {
    name: 'Organizations',
    icon: <HiOutlineOfficeBuilding size={ICON_SIZE} />,
    link: '/adminDashboard/organizations',
    end: false,
  },
  {
    name: 'Jobs',
    icon: <HiOutlineBriefcase size={ICON_SIZE} />,
    link: '/adminDashboard/jobs',
  },
  {
    name: 'Applications',
    icon: <HiOutlineClipboardList size={ICON_SIZE} />,
    link: '/adminDashboard/applications',
  },
  {
    name: 'Roles',
    icon: <MdOutlineAdminPanelSettings size={ICON_SIZE} />,
    link: '/adminDashboard/roles',
  },
  {
    name: 'AI Models',
    icon: <HiOutlineCpuChip size={ICON_SIZE} />,
    link: '/adminDashboard/ai-models',
  },
  {
    name: 'Feedback',
    icon: <HiOutlineChatAlt2 size={ICON_SIZE} />,
    link: '/adminDashboard/feedback',
  },
]
