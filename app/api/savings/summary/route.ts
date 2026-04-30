import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format, subMonths, startOfMonth } from 'date-fns'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const months = Array.from({ length: 6 }, (_, i) =>
    format(subMonths(startOfMonth(new Date()), i), 'yyyy-MM')
  ).reverse()

  const result: Record<string, { entradas: number; guardado: number }> = {}

  for (const month of months) {
    const [year, mon] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate()
    const start = `${month}-01`
    const end = `${month}-${String(lastDay).padStart(2, '0')}`

    const [entradasAgg, investmentsAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: session.id, date: { gte: start, lte: end }, type: 'entrada' },
        _sum: { amount: true },
      }),
      prisma.investment.aggregate({
        where: { userId: session.id, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ])

    result[month] = {
      entradas: Number(entradasAgg._sum.amount ?? 0),
      guardado: Number(investmentsAgg._sum.amount ?? 0),
    }
  }

  return NextResponse.json(result)
}
