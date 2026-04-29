'use client'

import { useEffect, useState } from 'react'
import { parseISO, isToday, isFuture, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { DayDetailModal } from './day-detail-modal'
import type { DayGroup } from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface TimelineProps {
  days: DayGroup[]
  onDeleteTransaction: (id: string) => void
  isLoading?: boolean
}

function DayRow({ day, onClick }: { day: DayGroup; onClick: () => void }) {
  const date = parseISO(day.date)
  const today = isToday(date)
  const future = isFuture(date)
  const hasTransactions = day.transactions.length > 0

  const cashSaidas = day.transactions
    .filter(t => t.type === 'saida' && t.paymentMethod !== 'cartao_credito')
    .reduce((s, t) => s + t.amount, 0)
  const cardSaidas = day.transactions
    .filter(t => t.type === 'saida' && t.paymentMethod === 'cartao_credito')
    .reduce((s, t) => s + t.amount, 0)

  const balance = day.accumulatedBalance
  const positive = balance >= 0

  return (
    <div id={today ? 'today-row' : undefined}>
      <button
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          today && 'bg-primary/5',
          hasTransactions ? 'active:bg-muted/50 cursor-pointer' : 'cursor-default'
        )}
        onClick={() => hasTransactions && onClick()}
      >
        {/* Dia */}
        <div className="w-12 shrink-0">
          <p className={cn(
            'text-base font-bold tabular-nums leading-none',
            today ? 'text-primary' : future ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {format(date, 'dd/MM')}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
            {today ? 'hoje' : format(date, 'EEE', { locale: ptBR })}
          </p>
        </div>

        {/* Movimentos */}
        <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
          {hasTransactions ? (
            <>
              {day.totalEntradas > 0 && (
                <span className="text-xs text-emerald-600 font-semibold">+{fmt(day.totalEntradas)}</span>
              )}
              {cashSaidas > 0 && (
                <span className="text-xs text-red-500 font-semibold">-{fmt(cashSaidas)}</span>
              )}
              {cardSaidas > 0 && (
                <span className="text-xs text-violet-500 font-semibold">-{fmt(cardSaidas)} cartão</span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground/40">sem lançamentos</span>
          )}
        </div>

        {/* Saldo acumulado */}
        <span className={cn(
          'text-sm font-bold tabular-nums shrink-0',
          positive ? 'text-emerald-600' : 'text-red-500'
        )}>
          {fmt(balance)}
        </span>
      </button>

      <div className="h-px bg-border/50 mx-4" />
    </div>
  )
}

function MonthHeader({ month }: { month: string }) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1, 1)
  return (
    <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-sm px-4 py-2 border-b border-border">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {format(date, 'MMMM yyyy', { locale: ptBR })}
      </p>
    </div>
  )
}

export function Timeline({ days, onDeleteTransaction, isLoading }: TimelineProps) {
  const [selectedDay, setSelectedDay] = useState<DayGroup | null>(null)

  useEffect(() => {
    if (!isLoading && days.length > 0) {
      requestAnimationFrame(() => {
        document.getElementById('today-row')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [isLoading, days.length])

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-border/50">
            <div className="w-12 h-8 bg-muted rounded-lg" />
            <div className="flex-1 h-4 bg-muted rounded" />
            <div className="w-14 h-5 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (days.length === 0) return null

  const elements: React.ReactNode[] = []
  let currentMonth = ''

  for (const day of days) {
    const month = day.date.slice(0, 7)
    if (month !== currentMonth) {
      currentMonth = month
      elements.push(<MonthHeader key={`h-${month}`} month={month} />)
    }
    elements.push(
      <DayRow key={day.date} day={day} onClick={() => setSelectedDay(day)} />
    )
  }

  return (
    <>
      <div>{elements}</div>
      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onDelete={(id) => { onDeleteTransaction(id); setSelectedDay(null) }}
      />
    </>
  )
}
