'use client'

import useSWR from 'swr'
import type { MonthTotais, Transaction } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTotais(month: string) {
  const { data, isLoading } = useSWR<{ totais: MonthTotais; movimentacoes: Transaction[] }>(
    `/api/totais?month=${month}`,
    fetcher,
  )

  return { totais: data?.totais ?? null, movimentacoes: data?.movimentacoes ?? [], isLoading }
}
