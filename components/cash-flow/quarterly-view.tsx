'use client'

import { useState } from 'react'
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

  // Indexa os dias por data
  const dayMap = new Map<string, DayGroup>()
  for (const d of days) dayMap.set(d.date, d)

  // Máximo de dias entre os 3 meses
  const maxDays = Math.max(...months.map(m => getDaysInMonth(m)))

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header com nome dos meses */}
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
        <div className="divide-y divide-border/50">
          {Array.from({ length: maxDays }, (_, i) => {
            const dayNum = i + 1
            const cells = months.map(m => {
              const daysInM = getDaysInMonth(m)
              if (dayNum > daysInM) return null
              const dateStr = `${format(m, 'yyyy-MM')}-${String(dayNum).padStart(2, '0')}`
              return dayMap.get(dateStr) ?? { date: dateStr, transactions: [], totalEntradas: 0, totalSaidas: 0, dailyBalance: 0, accumulatedBalance: 0 }
            })

            return (
              <div key={dayNum} className="grid grid-cols-3">
                {cells.map((cell, ci) => {
                  if (!cell) {
                    return <div key={ci} className="border-r border-border/50 last:border-r-0 bg-muted/20" />
                  }
                  const today = isToday(parseISO(cell.date))
                  const hasT = cell.transactions.length > 0
                  const weekday = format(parseISO(cell.date), 'EEE', { locale: ptBR })

                  return (
                    <button
                      key={ci}
                      onClick={() => hasT && setSelectedDay(cell)}
                      className={cn(
                        'border-r border-border/50 last:border-r-0 px-2 py-2 text-left transition-colors min-h-[52px]',
                        today && 'bg-primary/8',
                        hasT ? 'cursor-pointer active:bg-muted/60' : 'cursor-default'
                      )}
                    >
                      {/* Número do dia + weekday */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className={cn(
                          'text-sm font-bold tabular-nums leading-none',
                          today ? 'text-primary' : 'text-foreground'
                        )}>
                          {dayNum}
                        </span>
                        <span className="text-[9px] text-muted-foreground capitalize">{weekday}</span>
                        {today && <span className="ml-auto text-[8px] font-bold text-primary uppercase">hoje</span>}
                      </div>

                      {/* Valores */}
                      {hasT && (
                        <div className="space-y-0.5">
                          {cell.totalEntradas > 0 && (
                            <p className="text-[10px] font-semibold text-emerald-600 leading-none">
                              +{fmtCompact(cell.totalEntradas)}
                            </p>
                          )}
                          {cell.totalSaidas > 0 && (
                            <p className="text-[10px] font-semibold text-red-500 leading-none">
                              -{fmtCompact(cell.totalSaidas)}
                            </p>
                          )}
                        </div>
                      )}
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
