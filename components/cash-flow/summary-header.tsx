'use client'

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryHeaderProps {
  saldoAtual: number
  totalEntradas: number
  totalSaidas: number
  totalInvestido: number
}

export function SummaryHeader({ 
  saldoAtual, 
  totalEntradas, 
  totalSaidas, 
  totalInvestido 
}: SummaryHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Porcentagem do saldo em relacao ao investido
  const porcentagemInvestido = totalInvestido > 0 
    ? ((totalInvestido / (saldoAtual + totalInvestido)) * 100).toFixed(1)
    : '0'
  
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Saldo Atual */}
      <div className="col-span-2 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              saldoAtual >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {formatCurrency(saldoAtual)}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            saldoAtual >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            <Wallet className={cn(
              "w-6 h-6",
              saldoAtual >= 0 ? "text-emerald-500" : "text-red-500"
            )} />
          </div>
        </div>
      </div>
      
      {/* Entradas */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-muted-foreground">Entradas</p>
        </div>
        <p className="text-lg font-semibold text-emerald-500">
          {formatCurrency(totalEntradas)}
        </p>
      </div>
      
      {/* Saidas */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-red-500/10">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xs text-muted-foreground">Saidas</p>
        </div>
        <p className="text-lg font-semibold text-red-500">
          {formatCurrency(totalSaidas)}
        </p>
      </div>
      
      {/* Investimentos */}
      <div className="col-span-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <PiggyBank className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground">Investido</p>
            </div>
            <p className="text-xl font-semibold text-amber-500">
              {formatCurrency(totalInvestido)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">do patrimonio</p>
            <p className="text-2xl font-bold text-amber-500">{porcentagemInvestido}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
