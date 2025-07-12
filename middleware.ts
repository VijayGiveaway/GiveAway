import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip middleware for login page
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next()
    }

    // For API routes, let them pass through (they'll handle auth internally)
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.next()
    }

    // For other admin routes, check for admin session
    // In a production app, you'd validate a proper JWT token here
    // For now, we'll let the client-side handle authentication
    // The admin dashboard will redirect to login if not authenticated
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ],
}
