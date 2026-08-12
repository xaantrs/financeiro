'use client'

import { createContext, useContext } from 'react'
import type { TransactionKind } from '@/lib/types'

export interface OpenAddModalOptions {
  date?: string
  kind?: TransactionKind
}

interface AppShellContextValue {
  openAddModal: (opts?: OpenAddModalOptions) => void
}

export const AppShellContext = createContext<AppShellContextValue>({
  openAddModal: () => {},
})

export function useAppShell() {
  return useContext(AppShellContext)
}

export const GO_TO_TODAY_EVENT = 'app:go-to-today'

export function goToToday() {
  window.dispatchEvent(new Event(GO_TO_TODAY_EVENT))
}
