'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PiggyBank, Plus, TrendingUp, Shield, Coins, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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

interface MonthSaving {
  month: string
  label: string
  totalGuardado: number
  totalEntradas: number
  percentual: number
}

interface SavingsSectionProps {
  investments: Investment[]
  onAddInvestment: (inv: Omit<Investment, 'id'>) => Promise<void>
  isLoading?: boolean
  totalEntradas: number
  currentMonth: string
}

const typeConfig: Record<string, { label: string; icon: typeof PiggyBank; color: string }> = {
  renda_fixa: { label: 'Renda Fixa', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
  renda_variavel: { label: 'Renda Variável', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
  reserva: { label: 'Reserva', icon: Coins, color: 'text-emerald-500 bg-emerald-500/10' },
  geral: { label: 'Geral', icon: PiggyBank, color: 'text-amber-500 bg-amber-500/10' },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SavingsSection({ investments, onAddInvestment, isLoading, totalEntradas, currentMonth }: SavingsSectionProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('geral')
  const [submitting, setSubmitting] = useState(false)

  // Busca dados dos últimos 6 meses para calcular economias mensais
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), i)
    return format(d, 'yyyy-MM')
  }).reverse()

  const { data: monthsData } = useSWR<Record<string, { entradas: number; guardado: number }>>(
    '/api/savings/summary',
    fetcher
  )

  const totalGuardado = investments.reduce((s, i) => s + Number(i.amount), 0)
  const percentualMes = totalEntradas > 0 ? Math.round((totalGuardado / totalEntradas) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return
    setSubmitting(true)
    try {
      await onAddInvestment({ name, amount: Number(amount), date: new Date().toISOString().split('T')[0], type })
      setName(''); setAmount(''); setType('geral'); setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const groupedByType = investments.reduce((acc, inv) => {
    const key = inv.type || 'geral'
    if (!acc[key]) acc[key] = { total: 0, items: [] }
    acc[key].total += Number(inv.amount)
    acc[key].items.push(inv)
    return acc
  }, {} as Record<string, { total: number; items: Investment[] }>)

  if (isLoading) {
    return <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
    </div>
  }

  return (
    <div className="space-y-4">
      {/* Resumo do mês */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <PiggyBank className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">Total guardado</p>
          </div>
          <p className="text-xl font-bold text-amber-500">{fmt(totalGuardado)}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">% das entradas</p>
          </div>
          <p className={cn('text-xl font-bold', percentualMes >= 20 ? 'text-emerald-500' : percentualMes >= 10 ? 'text-amber-500' : 'text-red-500')}>
            {percentualMes}%
          </p>
        </div>
      </div>

      {/* Barra de progresso da meta de poupança */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Meta de poupança</p>
          <p className="text-xs text-muted-foreground">Ideal: 20% da renda</p>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              percentualMes >= 20 ? 'bg-emerald-500' : percentualMes >= 10 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${Math.min(percentualMes * 5, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {percentualMes >= 20
            ? 'Parabéns! Você está poupando bem.'
            : percentualMes >= 10
            ? 'Bom progresso. Tente chegar a 20%.'
            : 'Tente guardar pelo menos 10% da sua renda.'}
        </p>
      </div>

      {/* Lista por tipo */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Economias registradas</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Economia</DialogTitle>
                <DialogDescription>Registre um valor guardado ou investido</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Descrição</label>
                  <Input placeholder="Ex: Tesouro Selic, Reserva..." value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Valor (R$)</label>
                  <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Tipo</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                      <SelectItem value="renda_variavel">Renda Variável</SelectItem>
                      <SelectItem value="reserva">Reserva de Emergência</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PiggyBank className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma economia registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByType).map(([typeKey, { total, items }]) => {
              const config = typeConfig[typeKey] || typeConfig.geral
              const Icon = config.icon
              const [colorText, colorBg] = config.color.split(' ')
              return (
                <div key={typeKey} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-lg', colorBg)}>
                        <Icon className={cn('w-4 h-4', colorText)} />
                      </div>
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <span className={cn('font-semibold text-sm', colorText)}>{fmt(total)}</span>
                  </div>
                  <div className="space-y-1 pl-8">
                    {items.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{inv.name}</span>
                        <span className="font-medium">{fmt(Number(inv.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
