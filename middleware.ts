import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production'
)

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
