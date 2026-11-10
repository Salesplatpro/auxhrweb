import React from 'react'
import { HiOutlineSparkles } from 'react-icons/hi2'

import { PageHeaderTitle } from '@/components/layout/PageHeaderTitle'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'

type ComingSoonPageProps = {
  title: string
  description: string
}

export const ComingSoonPage = ({ title, description }: ComingSoonPageProps) => (
  <PageShell>
    <PageHeaderTitle title={title} description={description} />
    <EmptyState
      icon={<HiOutlineSparkles size={28} />}
      title="Coming soon"
      description="This page is on its way. Everything you need today is still in Job Posts and Applications."
    />
  </PageShell>
)
