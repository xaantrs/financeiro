import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.transaction.deleteMany({ where: { id, userId: session.id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  await prisma.transaction.updateMany({
    where: { id, userId: session.id },
    data: {
      ...(body.kind !== undefined && { kind: body.kind }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
      ...(body.tagId !== undefined && { tagId: body.tagId }),
    },
  })

  return NextResponse.json({ success: true })
}
