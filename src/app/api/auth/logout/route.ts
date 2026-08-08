import { NextResponse } from "next/server";

const AUTH_COOKIE = "auth_session";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the auth cookie
  response.cookies.delete(AUTH_COOKIE);

  return response;
}
