'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactions } from '@/hooks/use-transactions'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export default function ExtratoPage() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'confirmado'>('all')
  
  const { days, isLoading, deleteTransaction } = useTransactions(currentMonth)
  
  // Flatten all transactions and apply filters
  const allTransactions = days.flatMap(day => day.transactions)
  
  const filteredTransactions = allTransactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })
  
  // Calculate totals
  const totalEntradas = filteredTransactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + Number(t.amount), 0)
    
  const totalSaidas = filteredTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Generate month options
  const monthOptions = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
    })
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="font-bold text-lg text-foreground">Extrato</h1>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={currentMonth} onValueChange={setCurrentMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="capitalize">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'entrada' | 'saida')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saidas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'pendente' | 'confirmado')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      
      {/* Summary */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-700 mb-1">Entradas</p>
            <p className="font-bold text-emerald-600 tabular-nums">
              {formatCurrency(totalEntradas)}
            </p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-red-700 mb-1">Saidas</p>
            <p className="font-bold text-red-600 tabular-nums">
              {formatCurrency(totalSaidas)}
            </p>
          </div>
          <div className={cn(
            "rounded-lg p-3 text-center",
            (totalEntradas - totalSaidas) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Saldo</p>
            <p className={cn(
              "font-bold tabular-nums",
              (totalEntradas - totalSaidas) >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(totalEntradas - totalSaidas)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Transaction list */}
      <main className="max-w-lg mx-auto px-4 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma transacao encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction: Transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  transaction.type === 'entrada' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}>
                  {transaction.type === 'entrada' ? (
                    <ArrowUpCircle className="w-5 h-5" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(transaction.date), "dd/MM/yyyy")}
                    </span>
                    {transaction.category && (
                      <span className="text-xs text-muted-foreground">
                        - {transaction.category}
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
                    "font-semibold tabular-nums text-right",
                    transaction.type === 'entrada' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                  </span>
                  
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Deletar transacao"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
