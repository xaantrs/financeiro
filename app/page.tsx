'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Timeline } from '@/components/cash-flow/timeline'
import { AddTransactionModal } from '@/components/cash-flow/add-transaction-modal'
import { SummaryHeader } from '@/components/cash-flow/summary-header'
import { SavingsSection } from '@/components/cash-flow/savings-section'
import { ForecastSection } from '@/components/cash-flow/forecast-section'
import { useTransactions } from '@/hooks/use-transactions'
import { useInvestments } from '@/hooks/use-investments'
import { useSession } from '@/hooks/use-session'
import { Plus, Minus, LayoutList, PiggyBank, TrendingUp, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'fluxo' | 'economias' | 'previsao'
type ModalType = 'entrada' | 'saida' | null

export default function HomePage() {
  const router = useRouter()
  const { user } = useSession()
  const [modalType, setModalType] = useState<ModalType>(null)
  const [activeTab, setActiveTab] = useState<Tab>('fluxo')

  const currentYear = new Date().getFullYear().toString()
  const { days, isLoading, addTransaction, deleteTransaction } = useTransactions(currentYear)
  const { investments, totalInvestido, isLoading: investmentsLoading, addInvestment } = useInvestments()

  const currentMonthStr = format(new Date(), 'yyyy-MM')
  const currentMonthDays = days.filter(d => d.date.startsWith(currentMonthStr))
  const totalEntradas = currentMonthDays.reduce((s, d) => s + d.totalEntradas, 0)
  const totalSaidas = currentMonthDays.reduce((s, d) => s + d.totalSaidas, 0)
  const saldoAtual =
    days.find(d => d.date === format(new Date(), 'yyyy-MM-dd'))?.accumulatedBalance ??
    (days.length > 0 ? days[days.length - 1].accumulatedBalance : 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* HEADER FIXO E COMPACTO */}
      <header className="shrink-0 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4">

          {/* Linha superior: data + logout */}
          <div className="flex items-center justify-between pt-3 pb-1">
            <div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "dd/MM/yyyy · EEEE", { locale: ptBR })}
              </p>
              <h1 className="text-lg font-bold leading-tight">Fluxo de Caixa</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-25 truncate">{user?.name ?? user?.email}</span>
            </button>
          </div>

          {/* Cards de resumo */}
          <SummaryHeader
            saldoAtual={saldoAtual}
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            totalInvestido={totalInvestido}
          />

          {/* Tabs */}
          <div className="flex gap-2 py-2">
            {([
              { id: 'fluxo',     label: 'Fluxo',    icon: LayoutList, active: 'bg-primary text-primary-foreground' },
              { id: 'economias', label: 'Economias', icon: PiggyBank,  active: 'bg-amber-500 text-white' },
              { id: 'previsao',  label: 'Previsão',  icon: TrendingUp, active: 'bg-violet-500 text-white' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all',
                  activeTab === tab.id
                    ? tab.active
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO — ocupa 100% do espaço restante e scrolla */}
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

      {/* FOOTER FIXO */}
      <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-center gap-8">
          <button onClick={() => setModalType('entrada')} className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Plus className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Entrada</span>
          </button>

          <button onClick={() => setModalType('saida')} className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-500/30">
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
