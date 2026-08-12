'use client'

import { OptionPopover } from './option-popover'
import { kindConfig, kindOrder, KindIcon } from './kind-config'
import { useAppShell } from '@/components/layout/app-shell-context'
import type { TransactionKind } from '@/lib/types'

export function AddKindPopover({ trigger, align, side }: { trigger: React.ReactNode; align?: 'start' | 'center' | 'end'; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  const { openAddModal } = useAppShell()

  return (
    <OptionPopover
      align={align}
      side={side}
      options={kindOrder.map(k => ({
        value: k,
        label: kindConfig[k].singular,
        description: kindConfig[k].description,
        icon: <KindIcon kind={k} className="w-7 h-7 mt-0.5" />,
      }))}
      onSelect={v => openAddModal({ kind: v as TransactionKind })}
      trigger={trigger}
    />
  )
}
