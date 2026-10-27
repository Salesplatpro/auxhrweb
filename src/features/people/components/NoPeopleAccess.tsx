import React from 'react'
import { HiOutlineLockClosed } from 'react-icons/hi2'

import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui'

export const NoPeopleAccess = () => (
  <PageShell>
    <EmptyState
      icon={<HiOutlineLockClosed />}
      title="You don't have access to People"
      description="Ask your company owner."
    />
  </PageShell>
)
