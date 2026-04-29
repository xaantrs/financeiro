import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken, setSessionCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  const token = await createToken({ id: user.id, email: user.email, name: user.name })
  await setSessionCookie(token)

  return NextResponse.json({ ok: true })
}
