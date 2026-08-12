'use client'

import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { fmtCurrency, monthLabelFull, cn } from '@/lib/utils'
import { balanceHeatColor } from '@/lib/heat'
import { kindConfig, KindIcon } from './kind-config'
import { GO_TO_TODAY_EVENT } from '@/components/layout/app-shell-context'
import { useLongPress } from '@/hooks/use-long-press'
import type { DayCell, TransactionKind } from '@/lib/types'

const COLS = 'grid grid-cols-[36px_78px_78px_66px_78px_66px_88px]'
const kindsOrder: TransactionKind[] = ['entrada', 'saida', 'diario', 'economia', 'cartao']

interface MonthGroup { month: string; cells: DayCell[] }

function ValueCell({ kind, value, onOpenDetail, onQuickAdd }: { kind: TransactionKind; value: number; onOpenDetail: () => void; onQuickAdd: () => void }) {
  const handlers = useLongPress(onQuickAdd, onOpenDetail)
  return (
    <button {...handlers} className={cn('tabular-nums truncate text-left', value > 0 ? kindConfig[kind].textClass + ' font-medium' : 'text-muted-foreground/40')}>
      {fmtCurrency(value)}
    </button>
  )
}

export function SaldosDesktop({ months, today, domainMax, onDayClick, onToggleConfirm, onQuickAdd }: {
  months: MonthGroup[]
  today: string
  domainMax: number
  onDayClick: (cell: DayCell) => void
  onToggleConfirm: (cell: DayCell) => void
  onQuickAdd: (date: string, kind: TransactionKind) => void
}) {
  useEffect(() => {
    const handler = () => {
      const el = document.getElementById(`saldos-day-${today}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
    window.addEventListener(GO_TO_TODAY_EVENT, handler)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handler)
  }, [today])

  return (
    <div className="h-full overflow-auto">
      <div className="flex w-max">
        {months.map(({ month, cells }) => {
          const totals = kindsOrder.reduce((acc, k) => {
            acc[k] = cells.reduce((s, c) => s + (k === 'entrada' ? c.entradas : k === 'saida' ? c.saidas : k === 'diario' ? c.diarios : k === 'economia' ? c.economias : c.cartao), 0)
            return acc
          }, {} as Record<TransactionKind, number>)

          return (
            <div key={month} className="w-[510px] shrink-0 border-r border-border last:border-r-0">
              <div className="sticky top-0 z-20 bg-background px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground capitalize">{monthLabelFull(month)}</p>
              </div>

              <div className={cn(COLS, 'sticky top-[33px] z-20 bg-background border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground font-medium')}>
                <span>dia</span>
                {kindsOrder.map(k => (
                  <span key={k} className="flex items-center gap-1">
                    <KindIcon kind={k} className="w-3.5 h-3.5" />
                  </span>
                ))}
                <span>saldos</span>
              </div>

              {cells.map(cell => {
                const day = parseInt(cell.date.slice(8, 10))
                const isToday = cell.date === today
                const hasData = cell.transactions.some(t => !t.isVirtual)
                const heat = balanceHeatColor(cell.accumulatedBalance, domainMax)
                return (
                  <div
                    key={cell.date}
                    id={`saldos-day-${cell.date}`}
                    className={cn(COLS, 'items-center px-3 py-1.5 text-xs border-b border-border/50 hover:bg-muted/20 transition-colors')}
                  >
                    <button
                      onClick={() => hasData && onToggleConfirm(cell)}
                      className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0',
                        isToday ? 'bg-foreground text-background' : cell.allConfirmed ? 'bg-emerald-500/15 text-emerald-600' : 'text-foreground',
                      )}
                    >
                      {cell.allConfirmed ? <Check className="w-3 h-3" strokeWidth={3} /> : day}
                    </button>
                    {kindsOrder.map(k => (
                      <ValueCell
                        key={k}
                        kind={k}
                        value={k === 'entrada' ? cell.entradas : k === 'saida' ? cell.saidas : k === 'diario' ? cell.diarios : k === 'economia' ? cell.economias : cell.cartao}
                        onOpenDetail={() => onDayClick(cell)}
                        onQuickAdd={() => onQuickAdd(cell.date, k)}
                      />
                    ))}
                    <button
                      onClick={() => onDayClick(cell)}
                      className="tabular-nums font-semibold rounded-md px-1.5 py-0.5 -mx-1.5 text-right"
                      style={{ backgroundColor: heat.bg, color: heat.fg }}
                    >
                      {fmtCurrency(cell.accumulatedBalance)}
                    </button>
                  </div>
                )
              })}

              <div className={cn(COLS, 'sticky bottom-0 z-20 bg-background border-t border-border px-3 py-2 text-xs font-semibold')}>
                <span />
                {kindsOrder.map(k => (
                  <span key={k} className={cn('tabular-nums truncate', kindConfig[k].textClass)}>{fmtCurrency(totals[k])}</span>
                ))}
                <span />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
