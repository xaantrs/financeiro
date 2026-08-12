'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { AppShellContext, type OpenAddModalOptions } from './app-shell-context'
import { AddTransactionModal } from '@/components/finance/add-transaction-modal'
import type { TransactionKind } from '@/lib/types'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState<string | undefined>(undefined)
  const [addKind, setAddKind] = useState<TransactionKind | undefined>(undefined)

  const openAddModal = (opts?: OpenAddModalOptions) => {
    setAddDate(opts?.date)
    setAddKind(opts?.kind)
    setAddOpen(true)
  }

  return (
    <AppShellContext.Provider value={{ openAddModal }}>
      <div className="flex h-dvh bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileNav />
          <main className="flex-1 min-w-0 min-h-0 overflow-hidden">{children}</main>
        </div>
      </div>
      <AddTransactionModal open={addOpen} onOpenChange={setAddOpen} defaultDate={addDate} defaultKind={addKind} />
    </AppShellContext.Provider>
  )
}
