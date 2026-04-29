'use client'

import { useState } from 'react'
import { PiggyBank, Plus, TrendingUp, Shield, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Investment {
  id: string
  name: string
  amount: number
  date: string
  type: string
}

interface InvestmentsSectionProps {
  investments: Investment[]
  onAddInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>
  isLoading?: boolean
}

const typeConfig: Record<string, { label: string; icon: typeof PiggyBank; color: string }> = {
  renda_fixa: { label: 'Renda Fixa', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
  renda_variavel: { label: 'Renda Variavel', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
  reserva: { label: 'Reserva', icon: Coins, color: 'text-emerald-500 bg-emerald-500/10' },
  geral: { label: 'Geral', icon: PiggyBank, color: 'text-amber-500 bg-amber-500/10' }
}

export function InvestmentsSection({ investments, onAddInvestment, isLoading }: InvestmentsSectionProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('geral')
  const [submitting, setSubmitting] = useState(false)
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return
    
    setSubmitting(true)
    try {
      await onAddInvestment({
        name,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
        type
      })
      setName('')
      setAmount('')
      setType('geral')
      setOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar investimento:', error)
    } finally {
      setSubmitting(false)
    }
  }
  
  // Agrupar por tipo
  const groupedByType = investments.reduce((acc, inv) => {
    const key = inv.type || 'geral'
    if (!acc[key]) acc[key] = { total: 0, items: [] }
    acc[key].total += Number(inv.amount)
    acc[key].items.push(inv)
    return acc
  }, {} as Record<string, { total: number; items: Investment[] }>)
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded-xl"></div>
          <div className="h-16 bg-muted rounded-xl"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Investimentos</h2>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Investimento</DialogTitle>
              <DialogDescription>Adicione um novo investimento ao seu patrimonio</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
                <Input
                  placeholder="Ex: Tesouro Selic"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Valor</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                    <SelectItem value="renda_variavel">Renda Variavel</SelectItem>
                    <SelectItem value="reserva">Reserva de Emergencia</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Adicionando...' : 'Adicionar Investimento'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {investments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <PiggyBank className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum investimento registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByType).map(([typeKey, { total, items }]) => {
            const config = typeConfig[typeKey] || typeConfig.geral
            const Icon = config.icon
            
            return (
              <div 
                key={typeKey}
                className="border border-border rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", config.color.split(' ')[1])}>
                      <Icon className={cn("w-4 h-4", config.color.split(' ')[0])} />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <span className={cn("font-semibold", config.color.split(' ')[0])}>
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="space-y-1.5 pl-8">
                  {items.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{inv.name}</span>
                      <span>{formatCurrency(Number(inv.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
