import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const customerToken = req.cookies.get("customer_token")?.value;
  const { pathname } = req.nextUrl;

  // Admin rotalarını koru
  if (pathname.startsWith("/admin")) {
    if (!token || token !== "berilis-admin-token") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Müşteri rotalarını koru (/customer/login hariç)
  if (pathname.startsWith("/customer") && !pathname.startsWith("/customer/login")) {
    if (!customerToken) {
      return NextResponse.redirect(new URL("/customer/login", req.url));
    }
  }

  // Admin giriş yapmışsa /login'e gitmesin
  if (pathname === "/login") {
    if (token === "berilis-admin-token") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // Müşteri giriş yapmışsa /customer/login'e gitmesin
  if (pathname === "/customer/login") {
    if (customerToken) {
      return NextResponse.redirect(new URL("/customer/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/customer/:path*"],
};