'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, ArrowUpCircle, ArrowDownCircle, CreditCard, Trash2, RepeatIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DayGroup, Transaction } from '@/lib/types'

interface DayDetailModalProps {
  day: DayGroup | null
  onClose: () => void
  onDelete: (id: string) => void
}

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function TransactionRow({ t, onDelete }: { t: Transaction; onDelete: (id: string) => void }) {
  const isEntrada = t.type === 'entrada'
  const isCard = t.paymentMethod === 'cartao_credito'
  const isVirtual = t.id.includes('-v')

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn(
        'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
        isEntrada ? 'bg-emerald-500/15 text-emerald-600' : isCard ? 'bg-violet-500/15 text-violet-600' : 'bg-red-500/15 text-red-500'
      )}>
        {isEntrada
          ? <ArrowUpCircle className="w-4 h-4" />
          : isCard
            ? <CreditCard className="w-4 h-4" />
            : <ArrowDownCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{t.description}</p>
          {t.isRecurring && <RepeatIcon className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {t.category && <span className="text-[11px] text-muted-foreground">{t.category}</span>}
          {isCard && <span className="text-[10px] text-violet-500 font-medium bg-violet-500/10 px-1.5 py-0.5 rounded-full">Cartão</span>}
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            t.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          )}>
            {t.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          isEntrada ? 'text-emerald-600' : isCard ? 'text-violet-600' : 'text-red-500'
        )}>
          {isEntrada ? '+' : '-'}{fmtFull(t.amount)}
        </span>
        {!isVirtual && (
          <button
            onClick={() => onDelete(t.id)}
            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function DayDetailModal({ day, onClose, onDelete }: DayDetailModalProps) {
  if (!day) return null

  const date = parseISO(day.date)
  const cashSaidas = day.transactions.filter(t => t.type === 'saida' && t.paymentMethod !== 'cartao_credito').reduce((s, t) => s + t.amount, 0)
  const cardSaidas = day.transactions.filter(t => t.type === 'saida' && t.paymentMethod === 'cartao_credito').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <p className="text-base font-bold capitalize">
              {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              {day.totalEntradas > 0 && (
                <span className="text-xs text-emerald-600 font-semibold">
                  +{fmtFull(day.totalEntradas)} entrada
                </span>
              )}
              {cashSaidas > 0 && (
                <span className="text-xs text-red-500 font-semibold">
                  -{fmtFull(cashSaidas)} dinheiro
                </span>
              )}
              {cardSaidas > 0 && (
                <span className="text-xs text-violet-600 font-semibold">
                  -{fmtFull(cardSaidas)} cartão
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto px-5">
          {day.transactions.map(t => (
            <TransactionRow key={t.id} t={t} onDelete={(id) => { onDelete(id); onClose() }} />
          ))}
        </div>
      </div>
    </div>
  )
}
