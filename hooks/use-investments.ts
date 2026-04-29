'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface Investment {
  id: string
  name: string
  amount: number
  date: string
  type: string
  created_at: string
}

export interface InvestmentsData {
  investments: Investment[]
  totalInvestido: number
}

export function useInvestments() {
  const { data, error, isLoading, mutate } = useSWR<InvestmentsData>(
    '/api/investments',
    fetcher
  )
  
  const addInvestment = async (investment: Omit<Investment, 'id' | 'created_at'>) => {
    const response = await fetch('/api/investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investment)
    })
    
    if (!response.ok) {
      throw new Error('Erro ao adicionar investimento')
    }
    
    mutate()
    return response.json()
  }
  
  return {
    investments: data?.investments || [],
    totalInvestido: data?.totalInvestido || 0,
    isLoading,
    error,
    addInvestment,
    mutate
  }
}
