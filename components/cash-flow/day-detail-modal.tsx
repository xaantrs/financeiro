'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, ArrowUpCircle, ArrowDownCircle, Trash2, RepeatIcon, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddTransactionModal } from './add-transaction-modal'
import type { DayGroup, Transaction, TransactionFormData } from '@/lib/types'

interface DayDetailModalProps {
  day: DayGroup | null
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: TransactionFormData) => Promise<void>
}

const fmtFull = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function TransactionRow({ t, onDelete, onEdit }: { t: Transaction; onDelete: (id: string) => void; onEdit: (t: Transaction) => void }) {
  const isEntrada = t.type === 'entrada'
  const isVirtual = t.id.includes('-v')

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn('shrink-0 w-9 h-9 rounded-full flex items-center justify-center', isEntrada ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500')}>
        {isEntrada ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{t.description}</p>
          {t.isRecurring && <RepeatIcon className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {t.category && <span className="text-[11px] text-muted-foreground">{t.category}</span>}
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', t.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
            {t.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className={cn('text-sm font-bold tabular-nums', isEntrada ? 'text-emerald-600' : 'text-red-500')}>
          {isEntrada ? '+' : '-'}{fmtFull(t.amount)}
        </span>
        {!isVirtual && (
          <>
            <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function DayDetailModal({ day, onClose, onDelete, onUpdate }: DayDetailModalProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  if (!day) return null

  const date = parseISO(day.date)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl max-h-[80dvh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
            <div>
              <p className="text-base font-bold capitalize">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {day.totalEntradas > 0 && <span className="text-xs text-emerald-600 font-semibold">+{fmtFull(day.totalEntradas)}</span>}
                {day.totalSaidas > 0 && <span className="text-xs text-red-500 font-semibold">-{fmtFull(day.totalSaidas)}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-5">
            {day.transactions.map(t => (
              <TransactionRow key={t.id} t={t} onDelete={(id) => { onDelete(id); onClose() }} onEdit={setEditingTransaction} />
            ))}
          </div>
        </div>
      </div>

      <AddTransactionModal
        open={!!editingTransaction}
        onOpenChange={(open) => { if (!open) setEditingTransaction(null) }}
        editTransaction={editingTransaction}
        onSubmit={async (data) => {
          if (editingTransaction) {
            await onUpdate(editingTransaction.id, data)
            setEditingTransaction(null)
            onClose()
          }
        }}
      />
    </>
  )
}
