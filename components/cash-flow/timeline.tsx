'use client'

import { format, parseISO, isToday, isFuture, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import type { DayGroup, Transaction } from '@/lib/types'

interface TimelineProps {
  days: DayGroup[]
  onDeleteTransaction: (id: string) => void
  isLoading?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function TransactionItem({ 
  transaction, 
  onDelete 
}: { 
  transaction: Transaction
  onDelete: (id: string) => void 
}) {
  const isEntrada = transaction.type === 'entrada'
  
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isEntrada ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
      )}>
        {isEntrada ? (
          <ArrowUpCircle className="w-5 h-5" />
        ) : (
          <ArrowDownCircle className="w-5 h-5" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {transaction.category && (
            <span className="text-xs text-muted-foreground">
              {transaction.category}
            </span>
          )}
          <Badge 
            variant={transaction.status === 'confirmado' ? 'default' : 'outline'}
            className="text-[10px] px-1.5 py-0"
          >
            {transaction.status}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-semibold tabular-nums",
          isEntrada ? "text-emerald-600" : "text-red-600"
        )}>
          {isEntrada ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
        </span>
        
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Deletar transacao"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DayCard({ 
  day, 
  onDeleteTransaction,
  isLast
}: { 
  day: DayGroup
  onDeleteTransaction: (id: string) => void 
  isLast: boolean
}) {
  const date = parseISO(day.date)
  const isCurrentDay = isToday(date)
  const isFutureDay = isFuture(date)
  const isPastDay = isPast(date) && !isCurrentDay
  const hasTransactions = day.transactions.length > 0
  
  return (
    <div className={cn(
      "relative",
      !isLast && "before:absolute before:left-4 before:top-8 before:bottom-0 before:w-0.5",
      !isLast && isPastDay && "before:bg-muted",
      !isLast && isCurrentDay && "before:bg-primary",
      !isLast && isFutureDay && "before:bg-muted-foreground/20"
    )}>
      {/* Date row */}
      <div className={cn(
        "flex items-center gap-3 py-2",
        !hasTransactions && "opacity-60"
      )}>
        {/* Day circle */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
          isCurrentDay && "bg-primary text-primary-foreground font-bold",
          isPastDay && hasTransactions && "bg-muted text-foreground",
          isPastDay && !hasTransactions && "bg-muted/50 text-muted-foreground",
          isFutureDay && hasTransactions && "bg-muted-foreground/20 text-foreground",
          isFutureDay && !hasTransactions && "bg-muted-foreground/10 text-muted-foreground"
        )}>
          {format(date, 'd')}
        </div>
        
        {/* Day name */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm",
            isCurrentDay && "text-primary font-semibold",
            !isCurrentDay && hasTransactions && "text-foreground font-medium",
            !isCurrentDay && !hasTransactions && "text-muted-foreground"
          )}>
            {isCurrentDay ? 'Hoje' : format(date, "EEE", { locale: ptBR })}
          </p>
        </div>
        
        {/* Daily movement (only if has transactions) */}
        {hasTransactions && (
          <div className="flex items-center gap-2 text-xs">
            {day.totalEntradas > 0 && (
              <span className="text-emerald-600 font-medium">
                +{formatCurrency(day.totalEntradas)}
              </span>
            )}
            {day.totalSaidas > 0 && (
              <span className="text-red-600 font-medium">
                -{formatCurrency(day.totalSaidas)}
              </span>
            )}
          </div>
        )}
        
        {/* Accumulated balance */}
        <div className="text-right min-w-[90px]">
          <p className={cn(
            "font-semibold tabular-nums text-sm",
            day.accumulatedBalance >= 0 ? "text-emerald-600" : "text-red-600",
            !hasTransactions && "opacity-60"
          )}>
            {formatCurrency(day.accumulatedBalance)}
          </p>
        </div>
      </div>
      
      {/* Transactions */}
      {hasTransactions && (
        <div className="ml-11 space-y-2 pb-3">
          {day.transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
              onDelete={onDeleteTransaction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Timeline({ days, onDeleteTransaction, isLoading }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
  
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ArrowUpCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          Nenhuma transacao encontrada
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione seu primeiro lancamento clicando no botao abaixo
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-0">
      {days.map((day, index) => (
        <DayCard 
          key={day.date} 
          day={day}
          onDeleteTransaction={onDeleteTransaction}
          isLast={index === days.length - 1}
        />
      ))}
    </div>
  )
}
