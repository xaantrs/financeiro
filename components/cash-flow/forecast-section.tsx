'use client'

import useSWR from 'swr'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MonthForecast } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      <p className={cn('font-bold', d.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
        Acumulado: {fmt(d.value)}
      </p>
    </div>
  )
}

export function ForecastSection() {
  const { data, isLoading } = useSWR<MonthForecast[]>('/api/forecast', fetcher)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  const ultimoReal = data.filter(m => !m.isProjection).at(-1)
  const ultimoProjetado = data.at(-1)
  const variacaoTotal = ultimoProjetado && ultimoReal
    ? ultimoProjetado.acumulado - ultimoReal.acumulado
    : 0

  const hasRecurring = data.some(m => m.isProjection && (m.entradas > 0 || m.saidas > 0))

  return (
    <div className="space-y-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo atual</p>
          <p className={cn('text-xl font-bold', ultimoReal && ultimoReal.acumulado >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {ultimoReal ? fmt(ultimoReal.acumulado) : 'R$ 0'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Previsão 6 meses</p>
          <p className={cn('text-xl font-bold', ultimoProjetado && ultimoProjetado.acumulado >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {ultimoProjetado ? fmt(ultimoProjetado.acumulado) : 'R$ 0'}
          </p>
        </div>
        <div className={cn(
          'col-span-2 rounded-2xl p-4 flex items-center gap-3',
          variacaoTotal >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
        )}>
          {variacaoTotal >= 0
            ? <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            : <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />}
          <div>
            <p className="text-xs text-muted-foreground">Variação projetada (6 meses)</p>
            <p className={cn('font-bold', variacaoTotal >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {variacaoTotal >= 0 ? '+' : ''}{fmt(variacaoTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-medium text-foreground mb-1">Saldo acumulado</p>
        <p className="text-xs text-muted-foreground mb-4">Histórico + projeção dos próximos 6 meses</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradPos)"
              dot={(props) => {
                const { cx, cy, payload } = props
                return (
                  <circle
                    key={`dot-${payload.month}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.isProjection ? 'hsl(var(--muted))' : '#10b981'}
                    stroke={payload.isProjection ? '#10b981' : 'white'}
                    strokeWidth={1.5}
                    strokeDasharray={payload.isProjection ? '3 2' : '0'}
                  />
                )
              }}
              strokeDasharray="0"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-500 inline-block" /> Projeção
          </span>
        </div>
      </div>

      {/* Tabela mensal */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Detalhamento mensal</p>
        </div>
        <div className="divide-y divide-border">
          {data.map(m => (
            <div key={m.month} className={cn('px-4 py-3 flex items-center gap-3', m.isProjection && 'opacity-70')}>
              <div className="w-16">
                <p className="text-sm font-medium capitalize">{m.label}</p>
                {m.isProjection && <p className="text-[10px] text-muted-foreground">projeção</p>}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-right text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Entradas</p>
                  <p className="text-emerald-500 font-medium">{fmt(m.entradas)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Saidas</p>
                  <p className="text-red-500 font-medium">{fmt(m.saidas)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Acumulado</p>
                  <p className={cn('font-bold', m.acumulado >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {fmt(m.acumulado)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasRecurring && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Marque lançamentos como <strong>recorrentes</strong> ao criá-los para melhorar a precisão da previsão.</p>
        </div>
      )}
    </div>
  )
}
