'use client'

import { useState } from 'react'
import { X, CreditCard, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreditCard as CreditCardType } from '@/lib/types'

interface CreditCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cards: CreditCardType[]
  onAddCard: (name: string, paymentDay: number) => Promise<void>
  onDeleteCard: (id: string) => Promise<void>
}

export function CreditCardModal({ open, onOpenChange, cards, onAddCard, onDeleteCard }: CreditCardModalProps) {
  const [name, setName] = useState('')
  const [paymentDay, setPaymentDay] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!open) return null

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const day = parseInt(paymentDay)
    if (!name || !day || day < 1 || day > 31) return
    setIsSubmitting(true)
    try {
      await onAddCard(name, day)
      setName('')
      setPaymentDay('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDeleteCard(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 bg-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <h2 className="text-base font-semibold">Cartões de Crédito</h2>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Lista de cartões */}
          {cards.length > 0 && (
            <div className="space-y-2">
              {cards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{card.name}</p>
                    <p className="text-[11px] text-muted-foreground">Pagamento dia {card.paymentDay} do mês seguinte</p>
                  </div>
                  <button
                    onClick={() => handleDelete(card.id)}
                    disabled={deletingId === card.id}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {cards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhum cartão cadastrado</p>
          )}

          {/* Formulário para novo cartão */}
          <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Novo cartão</p>
            <input
              type="text"
              placeholder="Nome do cartão (ex: Nubank, Inter)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-blue-500 transition-colors"
            />
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide pl-1">Dia de pagamento (mês seguinte)</label>
              <input
                type="number"
                placeholder="Ex: 10"
                value={paymentDay}
                onChange={e => setPaymentDay(e.target.value)}
                min={1}
                max={31}
                required
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] bg-blue-500 hover:bg-blue-600',
                isSubmitting && 'opacity-60'
              )}
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Adicionar Cartão'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
