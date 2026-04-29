'use client'

import useSWR from 'swr'

interface SessionUser { id: string; email: string; name: string | null }

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useSession() {
  const { data, isLoading } = useSWR<{ user: SessionUser } | null>('/api/auth/session', fetcher)
  return { user: data?.user ?? null, isLoading }
}
