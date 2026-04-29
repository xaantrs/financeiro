import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rows = await prisma.investment.findMany({
    where: { userId: session.id },
    orderBy: { date: 'desc' },
  })

  const investments = rows.map(r => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    date: r.date,
    type: r.type,
    created_at: r.createdAt.toISOString(),
  }))

  return NextResponse.json({ investments, totalInvestido: investments.reduce((s, i) => s + i.amount, 0) })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, amount, date, type } = await request.json()
  if (!name || !amount || !date) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, amount, date' }, { status: 400 })
  }

  const row = await prisma.investment.create({
    data: { name, amount: Number(amount), date, type: type || 'geral', userId: session.id },
  })

  return NextResponse.json(row, { status: 201 })
}
