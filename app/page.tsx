'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Timeline } from '@/components/cash-flow/timeline'
import { MonthFilter } from '@/components/cash-flow/month-filter'
import { AddTransactionModal } from '@/components/cash-flow/add-transaction-modal'
import { SummaryHeader } from '@/components/cash-flow/summary-header'
import { SavingsSection } from '@/components/cash-flow/savings-section'
import { ForecastSection } from '@/components/cash-flow/forecast-section'
import { useTransactions } from '@/hooks/use-transactions'
import { useInvestments } from '@/hooks/use-investments'
import { useSession } from '@/hooks/use-session'
import { Plus, Minus, LayoutList, PiggyBank, TrendingUp, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'fluxo' | 'economias' | 'previsao'
type ModalType = 'entrada' | 'saida' | null

export default function HomePage() {
  const router = useRouter()
  const { user } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modalType, setModalType] = useState<ModalType>(null)
  const [activeTab, setActiveTab] = useState<Tab>('fluxo')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const lastScrollY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const monthParam = format(currentMonth, 'yyyy-MM')
  const { days, isLoading, addTransaction, deleteTransaction } = useTransactions(monthParam)
  const { investments, totalInvestido, isLoading: investmentsLoading, addInvestment } = useInvestments()

  const totalEntradas = days.reduce((sum, day) => sum + day.totalEntradas, 0)
  const totalSaidas = days.reduce((sum, day) => sum + day.totalSaidas, 0)
  const saldoAtual = days.length > 0 ? days[days.length - 1].accumulatedBalance : 0

  // Colapsa header ao rolar para baixo, expande ao rolar para cima
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const y = el.scrollTop
      if (y > lastScrollY.current && y > 60) setHeaderCollapsed(true)
      else if (y < lastScrollY.current) setHeaderCollapsed(false)
      lastScrollY.current = y
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleAddTransaction = async (data: Parameters<typeof addTransaction>[0]) => {
    await addTransaction(data)
    setModalType(null)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* HEADER RETRÁTIL */}
      <header className={cn(
        'flex-shrink-0 bg-background border-b border-border transition-all duration-300 overflow-hidden',
        headerCollapsed ? 'max-h-14' : 'max-h-[500px]'
      )}>
        <div className="max-w-lg mx-auto px-4">
          {/* Topo sempre visível */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHeaderCollapsed(v => !v)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-300', headerCollapsed && 'rotate-180')} />
              </button>
              <div>
                <p className="text-xs text-muted-foreground leading-none">
                  {format(new Date(), "EEE, d 'de' MMM", { locale: ptBR })}
                </p>
                <h1 className="text-base font-bold text-foreground leading-tight">Fluxo de Caixa</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user?.name ?? user?.email ?? 'Sair'}</span>
            </button>
          </div>

          {/* Conteúdo colapsável */}
          <div className={cn('transition-all duration-300', headerCollapsed ? 'opacity-0 pb-0' : 'opacity-100 pb-3')}>
            <SummaryHeader
              saldoAtual={saldoAtual}
              totalEntradas={totalEntradas}
              totalSaidas={totalSaidas}
              totalInvestido={totalInvestido}
            />

            {/* Tabs */}
            <div className="flex gap-2 mt-1">
              {([
                { id: 'fluxo', label: 'Fluxo', icon: LayoutList, active: 'bg-primary text-primary-foreground' },
                { id: 'economias', label: 'Economias', icon: PiggyBank, active: 'bg-amber-500 text-white' },
                { id: 'previsao', label: 'Previsão', icon: TrendingUp, active: 'bg-violet-500 text-white' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium transition-all',
                    activeTab === tab.id ? tab.active : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro de mês (só na aba fluxo) */}
            {activeTab === 'fluxo' && (
              <div className="mt-2">
                <MonthFilter currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO SCROLLÁVEL */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 pb-24">
          {activeTab === 'fluxo' && (
            <Timeline days={days} onDeleteTransaction={deleteTransaction} isLoading={isLoading} />
          )}
          {activeTab === 'economias' && (
            <SavingsSection
              investments={investments}
              onAddInvestment={addInvestment}
              isLoading={investmentsLoading}
              totalEntradas={totalEntradas}
              currentMonth={monthParam}
            />
          )}
          {activeTab === 'previsao' && <ForecastSection />}
        </div>
      </div>

      {/* FOOTER — só ícones + e - */}
      <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-center gap-8">
          {/* Entrada */}
          <button
            onClick={() => setModalType('entrada')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Plus className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Entrada</span>
          </button>

          {/* Saída */}
          <button
            onClick={() => setModalType('saida')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-red-500/30">
              <Minus className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <span className="text-[10px] text-red-500 font-medium">Saída</span>
          </button>
        </div>
      </div>

      {/* Modal de lançamento */}
      <AddTransactionModal
        open={modalType !== null}
        onOpenChange={(open) => { if (!open) setModalType(null) }}
        onSubmit={handleAddTransaction}
        defaultType={modalType ?? 'saida'}
      />
    </div>
  )
}
