import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "auth_session";
const AUTH_TOKEN = "authenticated";

export async function GET(request: NextRequest) {
  const session = request.cookies.get(AUTH_COOKIE);
  const isAuthenticated = session?.value === AUTH_TOKEN;

  return NextResponse.json({
    authenticated: isAuthenticated,
    cookieValue: session?.value || null,
    expectedValue: AUTH_TOKEN,
  });
}
