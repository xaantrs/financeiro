import type { Recurrence } from '@/lib/types'

export const recurrenceConfig: Record<Recurrence, { label: string; description?: string }> = {
  monthly: { label: 'mensalmente', description: 'repete o mesmo valor mensalmente' },
  weekly: { label: 'semanalmente', description: 'repete o mesmo valor semanalmente' },
  daily: { label: 'diariamente', description: 'repete o mesmo valor diariamente' },
  none: { label: 'não repete' },
}

export const recurrenceOrder: Recurrence[] = ['monthly', 'weekly', 'daily', 'none']
