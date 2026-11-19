import React from 'react'

import { recruiterNavSections } from '@/components/features/recruiter/SideBar/sidebarData'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader/DashboardHeader'
import { PlanPromoCard } from '@/features/dashboard/components/PlanPromoCard/PlanPromoCard'
import { useRecruiterNavCounts } from '@/features/dashboard/hooks/useRecruiterNavCounts'
import { ProductTourHost } from '@/features/product-tour'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import { SideBar } from '../../components'
import { SidebarUserCard } from '../LoggedInUserBadge'
import { CompanyBanner } from './CompanyBanner/CompanyBanner'

const RecruiterProfileSidebar = () => {
  const { counts, showPeople } = useRecruiterNavCounts()

  return (
    <ThemeProvider>
      <DashboardShell
        header={<DashboardHeader audience="recruiter" />}
        sidebar={(close) => (
          <SideBar
            sections={recruiterNavSections(counts, showPeople)}
            handleClick={close}
            topSlot={<CompanyBanner onNavigate={close} />}
            promoSlot={<PlanPromoCard onNavigate={close} />}
            footerSlot={<SidebarUserCard />}
          />
        )}>
        <ProductTourHost audience="recruiter" />
      </DashboardShell>
    </ThemeProvider>
  )
}

export default RecruiterProfileSidebar
