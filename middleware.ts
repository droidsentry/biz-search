import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import AppMiddleware from './lib/middleware/app-middleware'

export async function middleware(request: NextRequest) {
  // update user's auth session
  const { supabaseResponse, user } = await updateSession(request)
  return AppMiddleware(request, supabaseResponse, user)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    {  
      source:'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
          { type: "header", key: "next-router-prefetch" },
          { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}