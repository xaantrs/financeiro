'use client'

import useSWR from 'swr'
import type { DayGroup, TransactionFormData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTransactions(month?: string) {
  const url = month ? `/api/transactions?month=${month}` : '/api/transactions'
  
  const { data, error, isLoading, mutate } = useSWR<DayGroup[]>(url, fetcher)
  
  const addTransaction = async (transaction: TransactionFormData) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    })
    
    if (!res.ok) {
      throw new Error('Falha ao adicionar transação')
    }
    
    mutate()
    return res.json()
  }
  
  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      throw new Error('Falha ao deletar transação')
    }
    
    mutate()
  }
  
  const updateTransaction = async (id: string, updates: Partial<TransactionFormData>) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    
    if (!res.ok) {
      throw new Error('Falha ao atualizar transação')
    }
    
    mutate()
    return res.json()
  }
  
  return {
    days: data || [],
    isLoading,
    isError: error,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    refresh: mutate
  }
}
