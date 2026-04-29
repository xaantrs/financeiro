'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Timeline } from '@/components/cash-flow/timeline'
import { AddTransactionModal } from '@/components/cash-flow/add-transaction-modal'
import { SavingsSection } from '@/components/cash-flow/savings-section'
import { ForecastSection } from '@/components/cash-flow/forecast-section'
import { useTransactions } from '@/hooks/use-transactions'
import { useInvestments } from '@/hooks/use-investments'
import { useSession } from '@/hooks/use-session'
import { Plus, Minus, LayoutList, PiggyBank, TrendingUp, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'fluxo' | 'economias' | 'previsao'
type ModalType = 'entrada' | 'saida' | null

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function HomePage() {
  const router = useRouter()
  const { user } = useSession()
  const [modalType, setModalType] = useState<ModalType>(null)
  const [activeTab, setActiveTab] = useState<Tab>('fluxo')

  const currentYear = new Date().getFullYear().toString()
  const { days, isLoading, addTransaction, deleteTransaction } = useTransactions(currentYear)
  const { investments, totalInvestido, isLoading: investmentsLoading, addInvestment } = useInvestments()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const currentMonthStr = format(new Date(), 'yyyy-MM')
  const currentMonthDays = days.filter(d => d.date.startsWith(currentMonthStr))
  const totalEntradas = currentMonthDays.reduce((s, d) => s + d.totalEntradas, 0)
  const totalSaidas = currentMonthDays.reduce((s, d) => s + d.totalSaidas, 0)
  const saldoTotal = days.reduce((s, d) => s + d.dailyBalance, 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">

      {/* ── HEADER COMPACTO ── */}
      <header className="shrink-0 border-b border-border bg-background px-4 pt-3 pb-2">
        <div className="max-w-lg mx-auto">

          {/* Linha 1: título + logout */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-bold">Fluxo de Caixa</h1>
              <span className="text-xs text-muted-foreground">
                {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Linha 2: saldo em destaque + entradas/saídas */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saldo hoje</p>
              <p className={cn('text-2xl font-bold tabular-nums leading-none', saldoTotal >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {fmt(saldoTotal)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entradas</p>
                <p className="text-sm font-semibold text-emerald-500 tabular-nums">+{fmt(totalEntradas)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saídas</p>
                <p className="text-sm font-semibold text-red-500 tabular-nums">-{fmt(totalSaidas)}</p>
              </div>
            </div>
          </div>

          {/* Linha 3: tabs */}
          <div className="flex gap-1.5">
            {([
              { id: 'fluxo',     label: 'Fluxo',    icon: LayoutList, active: 'bg-primary text-primary-foreground' },
              { id: 'economias', label: 'Economias', icon: PiggyBank,  active: 'bg-amber-500 text-white' },
              { id: 'previsao',  label: 'Previsão',  icon: TrendingUp, active: 'bg-violet-500 text-white' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  activeTab === tab.id ? tab.active : 'bg-muted text-muted-foreground'
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO — ocupa todo espaço restante ── */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn('max-w-lg mx-auto pb-28', activeTab !== 'fluxo' && 'px-4 pt-3')}>
          {activeTab === 'fluxo' && (
            <Timeline days={days} onDeleteTransaction={deleteTransaction} isLoading={isLoading} />
          )}
          {activeTab === 'economias' && (
            <SavingsSection
              investments={investments}
              onAddInvestment={addInvestment}
              isLoading={investmentsLoading}
              totalEntradas={totalEntradas}
              currentMonth={currentMonthStr}
            />
          )}
          {activeTab === 'previsao' && <ForecastSection />}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-10 py-3 px-6">
          <button onClick={() => setModalType('entrada')} className="flex flex-col items-center gap-0.5">
            <div className="w-14 h-14 rounded-full bg-emerald-500 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Plus className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Entrada</span>
          </button>

          <button onClick={() => setModalType('saida')} className="flex flex-col items-center gap-0.5">
            <div className="w-14 h-14 rounded-full bg-red-500 active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-red-500/25">
              <Minus className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] text-red-500 font-medium">Saída</span>
          </button>
        </div>
      </div>

      <AddTransactionModal
        open={modalType !== null}
        onOpenChange={(open) => { if (!open) setModalType(null) }}
        onSubmit={async (data) => { await addTransaction(data); setModalType(null) }}
        defaultType={modalType ?? 'saida'}
      />
    </div>
  )
}
