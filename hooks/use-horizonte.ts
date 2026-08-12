'use client'

import useSWR from 'swr'
import type { HorizonteMonth } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useHorizonte() {
  const { data, isLoading } = useSWR<{ months: HorizonteMonth[]; today: string }>('/api/horizonte', fetcher)

  return { months: data?.months ?? [], today: data?.today ?? '', isLoading }
}
