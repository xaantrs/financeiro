import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.id } })
  if (!card) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.creditCard.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.id } })
  if (!card) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await prisma.creditCard.update({
    where: { id },
    data: {
      name: body.name ?? card.name,
      paymentDay: body.paymentDay != null ? Number(body.paymentDay) : card.paymentDay,
    },
  })

  return NextResponse.json({ id: updated.id, name: updated.name, paymentDay: updated.paymentDay, createdAt: updated.createdAt.toISOString() })
}
