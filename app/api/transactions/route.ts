import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { buildDayCells, expandRecurringTransactions } from '@/lib/finance'
import type { Transaction } from '@/lib/types'
import type { Prisma } from '@prisma/client'

type TagRow = { id: string; name: string; color: string; createdAt: Date }
type Row = {
  id: string
  kind: string
  description: string
  amount: Prisma.Decimal
  date: string
  status: string
  recurrence: string
  tagId: string | null
  tag: TagRow | null
  createdAt: Date
  updatedAt: Date
}

function mapRow(r: Row): Transaction {
  return {
    id: r.id,
    kind: r.kind as Transaction['kind'],
    description: r.description,
    amount: Number(r.amount),
    date: r.date,
    status: r.status as Transaction['status'],
    recurrence: r.recurrence as Transaction['recurrence'],
    tagId: r.tagId,
    tag: r.tag ? { id: r.tag.id, name: r.tag.name, color: r.tag.color, createdAt: r.tag.createdAt.toISOString() } : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end) return NextResponse.json({ error: 'start e end são obrigatórios' }, { status: 400 })

  const rows = await prisma.transaction.findMany({ where: { userId: session.id }, include: { tag: true }, orderBy: { date: 'asc' } })
  const transactions = rows.map(mapRow)

  const earliest = transactions.length > 0 ? transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date) : start
  const spanStart = earliest < start ? earliest : start

  const expanded = expandRecurringTransactions(transactions, spanStart, end)
  const allCells = buildDayCells(expanded, spanStart, end)
  const cells = allCells.filter(c => c.date >= start && c.date <= end)

  return NextResponse.json(cells)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.kind || !body.description || typeof body.amount !== 'number' || !body.date) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const row = await prisma.transaction.create({
    data: {
      kind: body.kind,
      description: body.description,
      amount: body.amount,
      date: body.date,
      status: body.status || 'pendente',
      recurrence: body.recurrence ?? 'none',
      tagId: body.tagId ?? null,
      userId: session.id,
    },
    include: { tag: true },
  })

  return NextResponse.json(mapRow(row), { status: 201 })
}
