import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.next({ request })
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh session — MUST use getUser() not getSession() for security
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Redirect unauthenticated users away from protected routes (including root)
    // /join/[token] is public — anyone with a valid invite link can access it
    if (!user && !path.startsWith('/join/') && !path.startsWith('/discovery/') && (path === '/' || path === '/onboarding' || path.startsWith('/admin') || path.startsWith('/freelancer'))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users away from auth pages
    if (user && (path === '/login' || path === '/signup' || path === '/')) {
      // Role-based redirect handled in the dashboard layout
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return supabaseResponse
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
