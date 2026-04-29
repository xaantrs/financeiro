'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Timeline } from '@/components/cash-flow/timeline'
import { MonthFilter } from '@/components/cash-flow/month-filter'
import { AddTransactionModal } from '@/components/cash-flow/add-transaction-modal'
import { SummaryHeader } from '@/components/cash-flow/summary-header'
import { InvestmentsSection } from '@/components/cash-flow/investments-section'
import { ForecastSection } from '@/components/cash-flow/forecast-section'
import { useTransactions } from '@/hooks/use-transactions'
import { useInvestments } from '@/hooks/use-investments'
import { useSession } from '@/hooks/use-session'
import { Button } from '@/components/ui/button'
import { Plus, LayoutList, PiggyBank, FileText, TrendingUp, LogOut } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Tab = 'fluxo' | 'investimentos' | 'previsao'

export default function HomePage() {
  const router = useRouter()
  const { user } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('fluxo')

  const monthParam = format(currentMonth, 'yyyy-MM')
  const { days, isLoading, addTransaction, deleteTransaction } = useTransactions(monthParam)
  const { investments, totalInvestido, isLoading: investmentsLoading, addInvestment } = useInvestments()

  const totalEntradas = days.reduce((sum, day) => sum + day.totalEntradas, 0)
  const totalSaidas = days.reduce((sum, day) => sum + day.totalSaidas, 0)
  const saldoAtual = days.length > 0 ? days[days.length - 1].accumulatedBalance : 0

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {user?.name ?? user?.email ?? 'Sair'}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-6">Fluxo de Caixa</h1>

          <SummaryHeader
            saldoAtual={saldoAtual}
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            totalInvestido={totalInvestido}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('fluxo')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                activeTab === 'fluxo' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className="w-4 h-4" />
              Fluxo
            </button>
            <button
              onClick={() => setActiveTab('investimentos')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                activeTab === 'investimentos' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <PiggyBank className="w-4 h-4" />
              Aportes
            </button>
            <button
              onClick={() => setActiveTab('previsao')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                activeTab === 'previsao' ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Previsão
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'fluxo' && (
          <>
            <div className="mb-4">
              <MonthFilter currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
            </div>
            <Timeline days={days} onDeleteTransaction={deleteTransaction} isLoading={isLoading} />
          </>
        )}
        {activeTab === 'investimentos' && (
          <InvestmentsSection investments={investments} onAddInvestment={addInvestment} isLoading={investmentsLoading} />
        )}
        {activeTab === 'previsao' && <ForecastSection />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/extrato" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <FileText className="w-4 h-4" />
              Extrato
            </Button>
          </Link>
          <Button size="lg" className="flex-1 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Novo Lancamento
          </Button>
        </div>
      </div>

      <AddTransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={addTransaction} />
    </div>
  )
}
