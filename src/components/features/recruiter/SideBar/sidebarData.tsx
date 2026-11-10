import React from 'react'
import { BsChatDots } from 'react-icons/bs'
import { CiBoxList, CiSearch } from 'react-icons/ci'
import { HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { IoBookOutline } from 'react-icons/io5'
import { MdWorkOutline } from 'react-icons/md'
import { RxDashboard } from 'react-icons/rx'

const ICON_SIZE = 20

export const sidebarData = [
  {
    name: 'Dashboard',
    icon: <RxDashboard size={ICON_SIZE} />,
    link: '/recruiterDashboard/dashboard',
  },
  {
    name: 'My Job Posts',
    tourId: 'nav-my-job-posts',
    icon: <MdWorkOutline size={ICON_SIZE} />,
    link: '/recruiterDashboard/myJobPosts',
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
    icon: <CiSearch size={ICON_SIZE} />,
    link: '/recruiterDashboard/talent-search',
    end: false,
  },

  {
    name: 'Chat',
    tourId: 'nav-chat',
    icon: <BsChatDots size={ICON_SIZE} />,
    link: '/recruiterDashboard/chat',
  },
  {
    name: 'Shortlist',
    icon: <CiBoxList size={ICON_SIZE} />,
    link: '/recruiterDashboard/shortlist',
  },
]

export const sidebarFooterData = [
  {
    name: 'Guide',
    tourId: 'nav-guide',
    icon: <IoBookOutline size={ICON_SIZE} />,
    link: '/recruiterDashboard/guide',
  },
]
