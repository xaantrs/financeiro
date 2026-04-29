'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, CreditCard, Banknote, RepeatIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionFormData, Transaction } from '@/lib/types'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  defaultType?: 'entrada' | 'saida'
  editTransaction?: Transaction | null
}

const CATEGORIES = [
  'Alimentacao', 'Transporte', 'Moradia', 'Saude',
  'Educacao', 'Lazer', 'Salario', 'Investimentos', 'Outros',
]

export function AddTransactionModal({ open, onOpenChange, onSubmit, defaultType = 'saida', editTransaction }: AddTransactionModalProps) {
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
    paymentMethod: 'dinheiro' as 'dinheiro' | 'cartao_credito',
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
          paymentMethod: editTransaction.paymentMethod ?? 'dinheiro',
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
          paymentMethod: 'dinheiro',
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
        paymentMethod: formData.paymentMethod,
      })
    } catch (error) {
      console.error('Erro ao adicionar transacao:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEntrada = type === 'entrada'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header colorido */}
        <div className={cn(
          'px-5 pt-5 pb-4',
          isEntrada ? 'bg-emerald-500/10' : 'bg-red-500/10'
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              {isEditing ? 'Editar Lançamento' : isEntrada ? 'Nova Entrada' : 'Nova Saída'}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle tipo */}
          <div className="flex gap-2 p-1 bg-background/60 rounded-xl">
            <button
              type="button"
              onClick={() => setType('saida')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                type === 'saida' ? 'bg-red-500 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setType('entrada')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                type === 'entrada' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Entrada
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">

          {/* Valor — destaque */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={formData.amount}
              onChange={e => {
                // Permite apenas dígitos, vírgula e ponto
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setFormData(p => ({ ...p, amount: val }))
              }}
              required
              className={cn(
                'w-full pl-10 pr-4 py-3 text-2xl font-bold tabular-nums rounded-xl border-2 bg-muted/30 outline-none transition-colors',
                isEntrada ? 'focus:border-emerald-500' : 'focus:border-red-500',
                'border-border'
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
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Método de pagamento (só para saída) */}
          {type === 'saida' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide pl-1">Pagamento</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'dinheiro' }))}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all',
                    formData.paymentMethod === 'dinheiro'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <Banknote className="w-4 h-4" />
                  Dinheiro / PIX
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'cartao_credito' }))}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all',
                    formData.paymentMethod === 'cartao_credito'
                      ? 'border-violet-500 bg-violet-500/10 text-violet-600'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </button>
              </div>
              {formData.paymentMethod === 'cartao_credito' && (
                <p className="text-[11px] text-violet-500 mt-1 pl-1">Não debita do saldo em dinheiro</p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="flex gap-2">
            {(['pendente', 'confirmado'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData(p => ({ ...p, status: s }))}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-medium transition-all capitalize',
                  formData.status === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                )}
              >
                {s === 'pendente' ? 'Pendente' : 'Confirmado'}
              </button>
            ))}
          </div>

          {/* Recorrente */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, isRecurring: !p.isRecurring }))}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                formData.isRecurring
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30'
              )}
            >
              <RepeatIcon className={cn('w-4 h-4 shrink-0', formData.isRecurring ? 'text-primary' : 'text-muted-foreground')} />
              <div className="text-left">
                <p className={cn('text-sm font-medium', formData.isRecurring ? 'text-primary' : '')}>
                  Recorrente
                </p>
                <p className="text-[11px] text-muted-foreground">Repete todo mês no mesmo dia</p>
              </div>
              <div className={cn(
                'ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                formData.isRecurring ? 'border-primary bg-primary' : 'border-border'
              )}>
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

          {/* Botão submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98]',
              isEntrada ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600',
              isSubmitting && 'opacity-60'
            )}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : `Salvar ${isEntrada ? 'Entrada' : 'Saída'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
