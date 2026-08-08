# Authentication

## Development Password

**Password:** `demo123`

This password is set in `.env.local` as the `APP_PASSWORD` variable.

## How to Change the Password

1. Open `.env.local`
2. Change the `APP_PASSWORD` value:
   ```
   APP_PASSWORD="your-secure-password-here"
   ```
3. Restart the development server (`npm run dev`)

## Production Setup

For production deployment, set `APP_PASSWORD` in your hosting platform's environment variables (Vercel, Railway, etc.) with a secure password.

**Important:** Never commit your actual password to GitHub. The `.env.local` file is already in `.gitignore`.
