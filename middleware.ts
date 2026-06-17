import { NextResponse, type NextRequest } from 'next/server'

// Check for a Supabase session cookie without making a network call.
// Full token validation happens in each route/layout via createServerClient.
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) =>
    name.startsWith('sb-') && name.endsWith('-auth-token')
  )
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const loggedIn = hasSessionCookie(request)

  const isProtected =
    path === '/' ||
    path === '/onboarding' ||
    path.startsWith('/admin') ||
    path.startsWith('/freelancer')

  const isPublicOnly = path === '/login' || path === '/signup'

  const isPublicRoute =
    path.startsWith('/join/') ||
    path.startsWith('/discovery/') ||
    path.startsWith('/auth/')

  if (!loggedIn && isProtected && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (loggedIn && isPublicOnly) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  // Skip Next.js internals, static files, and all API routes (each API route
  // handles its own auth directly — running middleware on them just adds an
  // extra getUser() round-trip for every request).
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
}
