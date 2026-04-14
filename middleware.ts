import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware runs on Edge Runtime — we only check cookie existence here.
// Full JWT verification happens in Node.js API routes/server components.
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // Protected routes
  if (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/api/protected')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect root to dashboard or login
  if (request.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
