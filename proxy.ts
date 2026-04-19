import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/email/receive')
  ) {
    return NextResponse.next()
  }

  const { supabase, supabaseResponse } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicPaths = ['/login', '/signup', '/auth', '/events', '/terminos', '/privacidad', '/convertirse-organizador']
  const isPublic =
    publicPaths.some((p) => request.nextUrl.pathname.startsWith(p)) ||
    request.nextUrl.pathname === '/'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)',
  ],
}