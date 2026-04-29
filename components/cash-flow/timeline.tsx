'use client'

import { useEffect, useRef, useState } from 'react'
import { parseISO, isToday, isFuture, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex items-center gap-2 py-2 px-3 bg-background rounded-lg border border-border">
      <div className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
        isEntrada ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600')}>
        {isEntrada ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {transaction.category && <span className="text-[10px] text-muted-foreground">{transaction.category}</span>}
          <Badge variant={transaction.status === 'confirmado' ? 'default' : 'outline'} className="text-[9px] px-1 py-0 h-4">
            {transaction.status}
          </Badge>
          {transaction.isRecurring && <span className="text-[10px] text-violet-500">● recorrente</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('font-semibold tabular-nums text-sm', isEntrada ? 'text-emerald-600' : 'text-red-600')}>
          {isEntrada ? '+' : '-'}{fmtFull(Number(transaction.amount))}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function DayRow({ day, onDeleteTransaction }: { day: DayGroup; onDeleteTransaction: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const date = parseISO(day.date)
  const today = isToday(date)
  const future = isFuture(date)
  const hasTransactions = day.transactions.length > 0

  // Expande automaticamente o dia de hoje
  useEffect(() => { if (today) setExpanded(true) }, [today])

  const balance = day.accumulatedBalance
  const balancePositive = balance >= 0

  return (
    <div
      id={today ? 'today-row' : undefined}
      className={cn(
        'border-b border-border/50 transition-colors',
        today && 'bg-primary/5',
        !today && hasTransactions && 'hover:bg-muted/30',
        !hasTransactions && !today && 'opacity-50'
      )}
    >
      {/* Linha principal — sempre clicável */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        onClick={() => hasTransactions && setExpanded(v => !v)}
      >
        {/* Data DD/MM */}
        <div className="w-14 flex-shrink-0">
          <p className={cn('text-sm font-semibold tabular-nums', today ? 'text-primary' : 'text-foreground')}>
            {format(date, 'dd/MM')}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {format(date, 'EEE', { locale: ptBR })}
          </p>
        </div>

        {/* Indicador hoje */}
        {today && (
          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
            Hoje
          </span>
        )}

        {/* Movimentações do dia */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {hasTransactions ? (
            <div className="flex items-center gap-2 flex-wrap">
              {day.totalEntradas > 0 && (
                <span className="text-xs text-emerald-600 font-medium">+{fmt(day.totalEntradas)}</span>
              )}
              {day.totalSaidas > 0 && (
                <span className="text-xs text-red-500 font-medium">-{fmt(day.totalSaidas)}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>

        {/* Saldo acumulado */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('text-sm font-bold tabular-nums', balancePositive ? 'text-emerald-600' : 'text-red-500')}>
            {fmt(balance)}
          </span>
          {hasTransactions && (
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          )}
        </div>
      </button>

      {/* Transações expandidas */}
      {expanded && hasTransactions && (
        <div className="px-4 pb-3 space-y-1.5">
          {day.transactions.map(t => (
            <TransactionItem key={t.id} transaction={t} onDelete={onDeleteTransaction} />
          ))}
        </div>
      )}
    </div>
  )
}

// Agrupa dias por mês para mostrar cabeçalho de mês
function MonthHeader({ month }: { month: string }) {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1, 1)
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-1.5 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">
        {format(date, 'MMMM yyyy', { locale: ptBR })}
      </p>
    </div>
  )
}

export function Timeline({ days, onDeleteTransaction, isLoading }: TimelineProps) {
  const todayRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para hoje ao carregar
  useEffect(() => {
    if (!isLoading && days.length > 0) {
      setTimeout(() => {
        const el = document.getElementById('today-row')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [isLoading, days.length])

  if (isLoading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 animate-pulse">
            <div className="w-14 h-8 bg-muted rounded" />
            <div className="flex-1 h-4 bg-muted rounded" />
            <div className="w-16 h-5 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (days.length === 0) return null

  // Agrupa por mês para inserir cabeçalhos
  let currentMonth = ''
  const elements: React.ReactNode[] = []

  for (const day of days) {
    const month = day.date.slice(0, 7) // "YYYY-MM"
    if (month !== currentMonth) {
      currentMonth = month
      elements.push(<MonthHeader key={`header-${month}`} month={month} />)
    }
    elements.push(
      <DayRow key={day.date} day={day} onDeleteTransaction={onDeleteTransaction} />
    )
  }

  return <div ref={todayRef} className="divide-y-0">{elements}</div>
}
