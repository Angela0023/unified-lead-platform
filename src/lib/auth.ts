import { cookies } from "next/headers";

const AUTH_COOKIE = "auth_session";
const AUTH_TOKEN = "authenticated";

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_COOKIE);
  return session?.value === AUTH_TOKEN;
}

/**
 * Verify password against environment variable
 */
export function verifyPassword(password: string): boolean {
  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedPassword) {
    console.error("APP_PASSWORD environment variable is not set");
    return false;
  }

  return password === expectedPassword;
}

/**
 * Set authentication cookie
 */
export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Clear authentication cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
