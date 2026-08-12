import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  if (!body.date || !body.status) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  await prisma.transaction.updateMany({
    where: { userId: session.id, date: body.date },
    data: { status: body.status },
  })

  return NextResponse.json({ success: true })
}
