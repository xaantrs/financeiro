'use client'

import { useState, useEffect } from 'react'
import { parseISO, isToday, format, addMonths, startOfMonth, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { DayDetailModal } from './day-detail-modal'
import type { DayGroup, TransactionFormData } from '@/lib/types'

interface QuarterlyViewProps {
  days: DayGroup[]
  onDeleteTransaction: (id: string) => void
  onUpdateTransaction: (id: string, data: TransactionFormData) => Promise<void>
}

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

export function QuarterlyView({ days, onDeleteTransaction, onUpdateTransaction }: QuarterlyViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null)

  const now = new Date()
  const months = [0, 1, 2].map(i => addMonths(startOfMonth(now), i))

  const dayMap = new Map<string, DayGroup>()
  for (const d of days) dayMap.set(d.date, d)

  const maxDays = Math.max(...months.map(m => getDaysInMonth(m)))

  // Scroll para hoje
  useEffect(() => {
    requestAnimationFrame(() => {
      document.getElementById('today-quarterly')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  return (
    <>
      <div className="flex flex-col">
        {/* Header com nome dos meses — sticky */}
        <div className="grid grid-cols-3 border-b border-border bg-background sticky top-0 z-10">
          {months.map(m => (
            <div key={m.toISOString()} className="px-2 py-2.5 text-center border-r border-border last:border-r-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground capitalize">
                {format(m, 'MMM', { locale: ptBR })}
              </p>
              <p className="text-[10px] text-muted-foreground">{format(m, 'yyyy')}</p>
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="divide-y divide-border/40">
          {Array.from({ length: maxDays }, (_, i) => {
            const dayNum = i + 1
            const cells = months.map(m => {
              if (dayNum > getDaysInMonth(m)) return null
              const dateStr = `${format(m, 'yyyy-MM')}-${String(dayNum).padStart(2, '0')}`
              return dayMap.get(dateStr) ?? {
                date: dateStr, transactions: [],
                totalEntradas: 0, totalSaidas: 0, dailyBalance: 0, accumulatedBalance: 0,
              } as DayGroup
            })

            const rowHasToday = cells.some(c => c && isToday(parseISO(c.date)))

            return (
              <div
                key={dayNum}
                id={rowHasToday ? 'today-quarterly' : undefined}
                className={cn('grid grid-cols-3', rowHasToday && 'bg-primary/5')}
              >
                {cells.map((cell, ci) => {
                  if (!cell) {
                    return <div key={ci} className="border-r border-border/40 last:border-r-0 bg-muted/10 min-h-13" />
                  }

                  const today = isToday(parseISO(cell.date))
                  const hasT = cell.transactions.length > 0
                  const weekday = format(parseISO(cell.date), 'EEE', { locale: ptBR })

                  return (
                    <button
                      key={ci}
                      onClick={() => hasT && setSelectedDay(cell)}
                      className={cn(
                        'border-r border-border/40 last:border-r-0 px-2 py-2 text-left transition-colors min-h-[60px] flex flex-col gap-1',
                        hasT ? 'cursor-pointer active:bg-muted/60 hover:bg-muted/30' : 'cursor-default'
                      )}
                    >
                      {/* Dia + weekday */}
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          'text-xs font-bold tabular-nums leading-none',
                          today ? 'text-primary' : 'text-foreground/80'
                        )}>
                          {dayNum}
                        </span>
                        <span className="text-[9px] text-muted-foreground capitalize leading-none">{weekday}</span>
                        {today && (
                          <span className="ml-auto text-[8px] font-black text-primary uppercase tracking-tight">hoje</span>
                        )}
                      </div>

                      {/* Saldo acumulado do dia — sempre visível */}
                      <span className={cn(
                        'text-[11px] font-bold leading-none tabular-nums',
                        cell.accumulatedBalance >= 0 ? 'text-emerald-600' : 'text-red-500',
                        !hasT && 'opacity-40'
                      )}>
                        {fmtCompact(cell.accumulatedBalance)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onDelete={(id) => { onDeleteTransaction(id); setSelectedDay(null) }}
        onUpdate={onUpdateTransaction}
      />
    </>
  )
}
