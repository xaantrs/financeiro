'use client'

import { useEffect, useState } from 'react'
import { parseISO, isToday, isFuture, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Trash2, ArrowUpCircle, ArrowDownCircle, ChevronDown } from 'lucide-react'
import type { DayGroup, Transaction } from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface TimelineProps {
  days: DayGroup[]
  onDeleteTransaction: (id: string) => void
  isLoading?: boolean
}

function TransactionItem({ transaction, onDelete }: { transaction: Transaction; onDelete: (id: string) => void }) {
  const isEntrada = transaction.type === 'entrada'
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 bg-muted/40 rounded-xl">
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isEntrada ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
      )}>
        {isEntrada
          ? <ArrowUpCircle className="w-4 h-4" />
          : <ArrowDownCircle className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{transaction.description}</p>
        {transaction.category && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{transaction.category}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn('text-sm font-bold tabular-nums', isEntrada ? 'text-emerald-600' : 'text-red-500')}>
          {isEntrada ? '+' : '-'}{fmtFull(Number(transaction.amount))}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1.5 -mr-1 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-90"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function DayRow({ day, onDeleteTransaction }: { day: DayGroup; onDeleteTransaction: (id: string) => void }) {
  const date = parseISO(day.date)
  const today = isToday(date)
  const future = isFuture(date)
  const hasTransactions = day.transactions.length > 0
  const [expanded, setExpanded] = useState(today)

  const balance = day.accumulatedBalance
  const positive = balance >= 0

  return (
    <div id={today ? 'today-row' : undefined}>
      <button
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50',
          today && 'bg-primary/5',
          hasTransactions && !today && 'hover:bg-muted/30'
        )}
        onClick={() => hasTransactions && setExpanded(v => !v)}
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
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          {hasTransactions ? (
            <div className="flex items-center gap-2 flex-wrap">
              {day.totalEntradas > 0 && (
                <span className="text-xs text-emerald-600 font-semibold">+{fmt(day.totalEntradas)}</span>
              )}
              {day.totalSaidas > 0 && (
                <span className="text-xs text-red-500 font-semibold">-{fmt(day.totalSaidas)}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/40">sem lançamentos</span>
          )}
        </div>

        {/* Saldo acumulado */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn(
            'text-sm font-bold tabular-nums',
            positive ? 'text-emerald-600' : 'text-red-500'
          )}>
            {fmt(balance)}
          </span>
          {hasTransactions && (
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200',
              expanded && 'rotate-180'
            )} />
          )}
        </div>
      </button>

      {/* Transações expandidas */}
      {expanded && hasTransactions && (
        <div className="px-4 pb-3 space-y-2">
          {day.transactions.map(t => (
            <TransactionItem key={t.id} transaction={t} onDelete={onDeleteTransaction} />
          ))}
        </div>
      )}

      {/* Separador */}
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
  // Auto-scroll para hoje
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
      <DayRow key={day.date} day={day} onDeleteTransaction={onDeleteTransaction} />
    )
  }

  return <div>{elements}</div>
}
