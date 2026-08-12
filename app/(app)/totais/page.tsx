'use client'

import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { useTotais } from '@/hooks/use-totais'
import { MonthNav } from '@/components/finance/month-nav'
import { TotaisView } from '@/components/finance/totais-view'

export default function TotaisPage() {
  const [month, setMonth] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM'))
  const { totais, movimentacoes, isLoading } = useTotais(month)

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border grid grid-cols-3 items-center">
        <h1 className="text-base md:text-lg font-semibold">totais</h1>
        <div className="col-span-2 md:col-span-1 justify-self-end md:justify-self-center">
          <MonthNav month={month} onChange={setMonth} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading || !totais ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <TotaisView totais={totais} movimentacoes={movimentacoes} />
        )}
      </div>
    </div>
  )
}
