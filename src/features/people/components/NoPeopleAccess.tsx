import React from 'react'
import { HiOutlineLockClosed } from 'react-icons/hi2'

import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/ui'

export const NoPeopleAccess = () => (
  <PageShell>
    <EmptyState
      icon={<HiOutlineLockClosed />}
      title="You don't have access to this"
      description="Ask your company's creator."
    />
  </PageShell>
)
