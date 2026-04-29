import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Transaction, DayGroup } from '@/lib/types'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') ?? new Date().getFullYear().toString()

  // Busca todas as transações do ano
  const rows = await prisma.transaction.findMany({
    where: {
      userId: session.id,
      date: {
        gte: `${year}-01-01`,
        lte: `${year}-12-31`,
      },
    },
    orderBy: { date: 'asc' },
  })

  const transactions: Transaction[] = rows.map(r => ({
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    date: r.date,
    category: r.category,
    status: r.status as 'pendente' | 'confirmado',
    type: r.type as 'entrada' | 'saida',
    isRecurring: r.isRecurring,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))

  return NextResponse.json(groupByDay(transactions, parseInt(year)))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const row = await prisma.transaction.create({
    data: {
      description: body.description,
      amount: body.amount,
      date: body.date,
      category: body.category || null,
      status: body.status || 'pendente',
      type: body.type,
      isRecurring: body.isRecurring ?? false,
      userId: session.id,
    },
  })

  return NextResponse.json(row, { status: 201 })
}

function groupByDay(transactions: Transaction[], year: number): DayGroup[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date)!.push(t)
  }

  // Gera todos os 365/366 dias do ano
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeap ? 366 : 365
  const startDate = new Date(year, 0, 1)

  let accumulated = 0
  const result: DayGroup[] = []

  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayTx = byDate.get(dateStr) || []
    const totalEntradas = dayTx.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
    const totalSaidas = dayTx.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)
    accumulated += totalEntradas - totalSaidas
    result.push({
      date: dateStr,
      transactions: dayTx,
      totalEntradas,
      totalSaidas,
      dailyBalance: totalEntradas - totalSaidas,
      accumulatedBalance: accumulated,
    })
  }

  return result
}
