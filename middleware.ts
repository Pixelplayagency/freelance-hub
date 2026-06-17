import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // getSession() reads from the cookie — no network call, no timeout risk.
  // getUser() (network call) is done in each route/layout for real validation.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const path = request.nextUrl.pathname

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

  if (!user && isProtected && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isPublicOnly) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Skip Next.js internals, static files, and all API routes (each API route
  // handles its own auth directly — running middleware on them just adds an
  // extra getUser() round-trip for every request).
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
}
