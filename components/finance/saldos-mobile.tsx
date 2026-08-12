'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { kindConfig, KindIcon } from './kind-config'
import { fmtCurrency, cn } from '@/lib/utils'
import { GO_TO_TODAY_EVENT } from '@/components/layout/app-shell-context'
import { useLongPress } from '@/hooks/use-long-press'
import type { DayCell, TransactionKind } from '@/lib/types'

const kindsOrder: TransactionKind[] = ['entrada', 'saida', 'diario', 'economia', 'cartao']

function DayRow({ cell, kind, isToday, onOpenDetail, onQuickAdd, onToggleConfirm }: {
  cell: DayCell
  kind: TransactionKind
  isToday: boolean
  onOpenDetail: () => void
  onQuickAdd: () => void
  onToggleConfirm: () => void
}) {
  const day = parseInt(cell.date.slice(8, 10))
  const v = kind === 'entrada' ? cell.entradas : kind === 'saida' ? cell.saidas : kind === 'diario' ? cell.diarios : kind === 'economia' ? cell.economias : cell.cartao
  const positive = cell.accumulatedBalance >= 0
  const hasData = cell.transactions.some(t => !t.isVirtual)
  const handlers = useLongPress(onQuickAdd, onOpenDetail)

  return (
    <div
      id={`saldos-mobile-day-${cell.date}`}
      className={cn('w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/40', positive ? 'bg-emerald-50' : 'bg-red-50')}
    >
      <button
        onClick={() => hasData && onToggleConfirm()}
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0',
          isToday ? 'bg-foreground text-background' : cell.allConfirmed ? 'bg-emerald-500/20 text-emerald-700' : 'text-foreground',
        )}
      >
        {cell.allConfirmed ? <Check className="w-3 h-3" strokeWidth={3} /> : day}
      </button>
      <span className="text-[10px] text-muted-foreground capitalize w-8 shrink-0">
        {format(parseISO(cell.date), 'EEE', { locale: ptBR })}
      </span>
      <button {...handlers} className="flex-1 flex items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <KindIcon kind={kind} className="w-4 h-4" />
          {fmtCurrency(v)}
        </span>
        <span className={cn('text-sm font-semibold tabular-nums', positive ? 'text-emerald-700' : 'text-red-600')}>
          {fmtCurrency(cell.accumulatedBalance)}
        </span>
      </button>
    </div>
  )
}

export function SaldosMobile({ cells, today, onDayClick, onToggleConfirm, onQuickAdd }: {
  cells: DayCell[]
  today: string
  onDayClick: (cell: DayCell) => void
  onToggleConfirm: (cell: DayCell) => void
  onQuickAdd: (date: string, kind: TransactionKind) => void
}) {
  const [kind, setKind] = useState<TransactionKind>('diario')

  useEffect(() => {
    const handler = () => document.getElementById(`saldos-mobile-day-${today}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.addEventListener(GO_TO_TODAY_EVENT, handler)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handler)
  }, [today])

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">dia</span>
        <Select value={kind} onValueChange={v => setKind(v as TransactionKind)}>
          <SelectTrigger size="sm" className="w-auto gap-1.5 border-none shadow-none text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {kindsOrder.map(k => (
              <SelectItem key={k} value={k}>
                <KindIcon kind={k} className="w-4 h-4" /> {kindConfig[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs font-medium text-muted-foreground">saldos</span>
      </div>

      {cells.map(cell => (
        <DayRow
          key={cell.date}
          cell={cell}
          kind={kind}
          isToday={cell.date === today}
          onOpenDetail={() => onDayClick(cell)}
          onQuickAdd={() => onQuickAdd(cell.date, kind)}
          onToggleConfirm={() => onToggleConfirm(cell)}
        />
      ))}
    </div>
  )
}
