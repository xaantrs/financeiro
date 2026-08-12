'use client'

import useSWR from 'swr'
import type { DayCell, TransactionFormData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useSaldos(start: string, end: string) {
  const { data, isLoading, mutate } = useSWR<DayCell[]>(`/api/transactions?start=${start}&end=${end}`, fetcher)

  const addTransaction = async (transaction: TransactionFormData) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })
    if (!res.ok) throw new Error('Falha ao adicionar lançamento')
    mutate()
    return res.json()
  }

  const updateTransaction = async (id: string, updates: Partial<TransactionFormData>) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Falha ao atualizar lançamento')
    mutate()
  }

  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Falha ao excluir lançamento')
    mutate()
  }

  const confirmDay = async (date: string, status: 'pendente' | 'confirmado') => {
    const res = await fetch('/api/transactions/confirm-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, status }),
    })
    if (!res.ok) throw new Error('Falha ao confirmar dia')
    mutate()
  }

  return { cells: data ?? [], isLoading, addTransaction, updateTransaction, deleteTransaction, confirmDay, refresh: mutate }
}
