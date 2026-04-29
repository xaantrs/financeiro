import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Transaction, DayGroup } from '@/lib/types'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  let dateFilter: { gte: string; lte: string } | undefined
  if (month) {
    const [year, monthNum] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    dateFilter = {
      gte: `${year}-${monthNum}-01`,
      lte: `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  const rows = await prisma.transaction.findMany({
    where: { userId: session.id, ...(dateFilter ? { date: dateFilter } : {}) },
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

  return NextResponse.json(groupTransactionsByDay(transactions, month))
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

function groupTransactionsByDay(transactions: Transaction[], month: string | null): DayGroup[] {
  const now = new Date()
  let year: number, monthNum: number
  if (month) {
    ;[year, monthNum] = month.split('-').map(Number)
  } else {
    year = now.getFullYear()
    monthNum = now.getMonth() + 1
  }

  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date)!.push(t)
  }

  let accumulated = 0
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayTx = byDate.get(dateStr) || []
    const totalEntradas = dayTx.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0)
    const totalSaidas = dayTx.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0)
    accumulated += totalEntradas - totalSaidas
    return { date: dateStr, transactions: dayTx, totalEntradas, totalSaidas, dailyBalance: totalEntradas - totalSaidas, accumulatedBalance: accumulated }
  })
}
