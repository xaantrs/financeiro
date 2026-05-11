'use client'

import useSWR from 'swr'
import type { CreditCard } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useCreditCards() {
  const { data, error, isLoading, mutate } = useSWR<CreditCard[]>('/api/credit-cards', fetcher)

  const addCard = async (name: string, paymentDay: number) => {
    const res = await fetch('/api/credit-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, paymentDay }),
    })
    if (!res.ok) throw new Error('Falha ao criar cartão')
    mutate()
    return res.json()
  }

  const deleteCard = async (id: string) => {
    const res = await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Falha ao deletar cartão')
    mutate()
  }

  return {
    cards: data || [],
    isLoading,
    isError: error,
    addCard,
    deleteCard,
  }
}
