'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, RepeatIcon, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionFormData, Transaction, CreditCard as CreditCardType } from '@/lib/types'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  defaultType?: 'entrada' | 'saida'
  editTransaction?: Transaction | null
  creditCards?: CreditCardType[]
}

const CATEGORIES = [
  'Alimentacao', 'Transporte', 'Moradia', 'Saude',
  'Educacao', 'Lazer', 'Salario', 'Investimentos', 'Outros',
]

export function AddTransactionModal({ open, onOpenChange, onSubmit, defaultType = 'saida', editTransaction, creditCards = [] }: AddTransactionModalProps) {
  const isEditing = !!editTransaction
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<'entrada' | 'saida'>(defaultType)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    status: 'pendente' as 'pendente' | 'confirmado',
    isRecurring: false,
    recurringEndDate: '',
    creditCardId: '',
  })

  useEffect(() => {
    if (open) {
      if (editTransaction) {
        setType(editTransaction.type)
        setFormData({
          description: editTransaction.description,
          amount: String(editTransaction.amount).replace('.', ','),
          date: editTransaction.date,
          category: editTransaction.category ?? '',
          status: editTransaction.status,
          isRecurring: editTransaction.isRecurring,
          recurringEndDate: editTransaction.recurringEndDate ?? '',
          creditCardId: editTransaction.creditCardId ?? '',
        })
      } else {
        setType(defaultType)
        setFormData({
          description: '',
          amount: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          category: '',
          status: 'pendente',
          isRecurring: false,
          recurringEndDate: '',
          creditCardId: '',
        })
      }
    }
  }, [open, defaultType, editTransaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        description: formData.description,
        amount: parseFloat(formData.amount.replace(',', '.')),
        date: formData.date,
        category: formData.category || '',
        status: formData.status,
        type,
        isRecurring: formData.isRecurring,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
        creditCardId: formData.creditCardId || null,
      })
    } catch (error) {
      console.error('Erro ao adicionar transacao:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEntrada = type === 'entrada'
  const isCardExpense = type === 'saida' && !!formData.creditCardId

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header colorido */}
        <div className={cn('px-5 pt-5 pb-4', isEntrada ? 'bg-emerald-500/10' : isCardExpense ? 'bg-blue-500/10' : 'bg-red-500/10')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              {isEditing ? 'Editar Lançamento' : isEntrada ? 'Nova Entrada' : isCardExpense ? 'Gasto no Cartão' : 'Nova Saída'}
            </h2>
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-background/60 rounded-xl">
            <button type="button" onClick={() => setType('saida')}
              className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all', type === 'saida' ? 'bg-red-500 text-white shadow-sm' : 'text-muted-foreground')}>
              Saída
            </button>
            <button type="button" onClick={() => setType('entrada')}
              className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all', type === 'entrada' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground')}>
              Entrada
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">

          {/* Valor */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={formData.amount}
              onChange={e => setFormData(p => ({ ...p, amount: e.target.value.replace(/[^0-9.,]/g, '') }))}
              required
              className={cn(
                'w-full pl-10 pr-4 py-3 text-2xl font-bold tabular-nums rounded-xl border-2 bg-muted/30 outline-none transition-colors border-border',
                isEntrada ? 'focus:border-emerald-500' : isCardExpense ? 'focus:border-blue-500' : 'focus:border-red-500'
              )}
            />
          </div>

          {/* Descrição */}
          <input
            type="text"
            placeholder="Descrição"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-colors"
          />

          {/* Data + Categoria */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide pl-1">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide pl-1">Categoria</label>
              <select
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="">Nenhuma</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Cartão de crédito — apenas para saídas */}
          {type === 'saida' && creditCards.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, creditCardId: p.creditCardId ? '' : creditCards[0].id }))}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                  formData.creditCardId ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-muted/30'
                )}
              >
                <CreditCard className={cn('w-4 h-4 shrink-0', formData.creditCardId ? 'text-blue-500' : 'text-muted-foreground')} />
                <div className="text-left flex-1">
                  <p className={cn('text-sm font-medium', formData.creditCardId ? 'text-blue-500' : '')}>Lançar no cartão</p>
                  <p className="text-[11px] text-muted-foreground">Entra na fatura do mês</p>
                </div>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', formData.creditCardId ? 'border-blue-500 bg-blue-500' : 'border-border')}>
                  {formData.creditCardId && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              {formData.creditCardId && (
                <select
                  value={formData.creditCardId}
                  onChange={e => setFormData(p => ({ ...p, creditCardId: e.target.value }))}
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-blue-500 bg-blue-500/5 text-sm outline-none focus:border-blue-600 transition-colors"
                >
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>{card.name} — paga dia {card.paymentDay}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Status — oculto quando é despesa de cartão (sempre pendente até pagar) */}
          {!formData.creditCardId && (
            <div className="flex gap-2">
              {(['pendente', 'confirmado'] as const).map(s => (
                <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-sm font-medium transition-all',
                    formData.status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  )}>
                  {s === 'pendente' ? 'Pendente' : 'Confirmado'}
                </button>
              ))}
            </div>
          )}

          {/* Recorrente */}
          <div className="space-y-2">
            <button type="button" onClick={() => setFormData(p => ({ ...p, isRecurring: !p.isRecurring }))}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                formData.isRecurring ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
              )}>
              <RepeatIcon className={cn('w-4 h-4 shrink-0', formData.isRecurring ? 'text-primary' : 'text-muted-foreground')} />
              <div className="text-left">
                <p className={cn('text-sm font-medium', formData.isRecurring ? 'text-primary' : '')}>Recorrente</p>
                <p className="text-[11px] text-muted-foreground">
                  {formData.creditCardId
                    ? 'Lança na fatura todo mês no mesmo dia'
                    : 'Repete todo mês no mesmo dia'}
                </p>
              </div>
              <div className={cn('ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', formData.isRecurring ? 'border-primary bg-primary' : 'border-border')}>
                {formData.isRecurring && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

            {formData.isRecurring && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide pl-1">Termina em (opcional)</label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  min={formData.date}
                  onChange={e => setFormData(p => ({ ...p, recurringEndDate: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98]',
              isEntrada ? 'bg-emerald-500 hover:bg-emerald-600' : isCardExpense ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600',
              isSubmitting && 'opacity-60'
            )}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : isCardExpense ? 'Lançar na Fatura' : `Salvar ${isEntrada ? 'Entrada' : 'Saída'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
