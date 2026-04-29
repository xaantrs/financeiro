import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format, addMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MonthForecast } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = session.id
  const threeMonthsAgo = format(addMonths(new Date(), -3), 'yyyy-MM-dd')

  const allTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
    orderBy: { date: 'asc' },
  })

  const recurring = await prisma.transaction.findMany({
    where: { userId, isRecurring: true },
  })

  const now = new Date()
  const result: MonthForecast[] = []

  for (let i = -2; i <= 0; i++) {
    const monthDate = addMonths(startOfMonth(now), i)
    const monthStr = format(monthDate, 'yyyy-MM')
    const [year, mon] = monthStr.split('-')
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate()
    const startDate = `${monthStr}-01`
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

    const monthTx = allTransactions.filter(t => t.date >= startDate && t.date <= endDate)
    const entradas = monthTx.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
    const saidas = monthTx.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)

    result.push({
      month: monthStr,
      label: format(monthDate, "MMM/yy", { locale: ptBR }),
      entradas,
      saidas,
      saldo: entradas - saidas,
      acumulado: 0,
      isProjection: false,
    })
  }

  const recurringEntradas = recurring.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
  const recurringSaidas = recurring.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)

  for (let i = 1; i <= 6; i++) {
    const monthDate = addMonths(startOfMonth(now), i)
    result.push({
      month: format(monthDate, 'yyyy-MM'),
      label: format(monthDate, "MMM/yy", { locale: ptBR }),
      entradas: recurringEntradas,
      saidas: recurringSaidas,
      saldo: recurringEntradas - recurringSaidas,
      acumulado: 0,
      isProjection: true,
    })
  }

  let acumulado = 0
  for (const m of result) {
    acumulado += m.saldo
    m.acumulado = acumulado
  }

  return NextResponse.json(result)
}
