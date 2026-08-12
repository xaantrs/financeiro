// Escala divergente verde (superávit) / vermelho (déficit) para saldo acumulado.
// Ancorada nos tons "status" (good/critical) do sistema, com 5 degraus de magnitude
// por lado e um neutro em ~0 — ramp sequencial (claro→escuro), não categórica.
const GREEN_STEPS = ['#e3f6e7', '#b9e8c2', '#7cd08f', '#34b355', '#0ca30c']
const RED_STEPS = ['#fbe4e4', '#f3bcbb', '#e88886', '#dd5654', '#d03b3b']
const NEUTRAL = '#f0efec'

export function balanceHeatColor(value: number, domainMax: number): { bg: string; fg: string } {
  if (!isFinite(value) || domainMax <= 0 || value === 0) return { bg: NEUTRAL, fg: '#52514e' }
  const t = Math.min(Math.abs(value) / domainMax, 1)
  const idx = Math.min(4, Math.round(t * 4))
  const steps = value > 0 ? GREEN_STEPS : RED_STEPS
  return { bg: steps[idx], fg: idx >= 3 ? '#ffffff' : '#0b0b0b' }
}
