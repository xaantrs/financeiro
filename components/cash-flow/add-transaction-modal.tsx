'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { TransactionFormData } from '@/lib/types'

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionFormData) => Promise<void>
}

const CATEGORIES = [
  'Alimentacao',
  'Transporte',
  'Moradia',
  'Saude',
  'Educacao',
  'Lazer',
  'Salario',
  'Investimentos',
  'Outros',
]

export function AddTransactionModal({ open, onOpenChange, onSubmit }: AddTransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<'entrada' | 'saida'>('saida')
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    status: 'pendente' as const,
    isRecurring: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category || '',
        status: formData.status,
        type,
        isRecurring: formData.isRecurring,
      })
      setFormData({
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        status: 'pendente',
        isRecurring: false,
      })
      setType('saida')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao adicionar transacao:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Lancamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setType('saida')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                type === 'saida' ? 'bg-red-500 text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Saida
            </button>
            <button
              type="button"
              onClick={() => setType('entrada')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                type === 'entrada' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Entrada
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado, Salario..."
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.amount}
              onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData(p => ({ ...p, category: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'pendente' | 'confirmado') => setFormData(p => ({ ...p, status: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recorrente */}
          <label className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={e => setFormData(p => ({ ...p, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Lançamento recorrente</p>
              <p className="text-xs text-muted-foreground">Usado na previsão dos próximos meses</p>
            </div>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                type === 'entrada' && 'bg-emerald-500 hover:bg-emerald-600',
                type === 'saida' && 'bg-red-500 hover:bg-red-600'
              )}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
