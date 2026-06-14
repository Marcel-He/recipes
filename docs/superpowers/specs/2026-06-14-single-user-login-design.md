---
title: Single-User Login
date: 2026-06-14
status: approved
---

# Single-User Login

Password-protect the recipes app for a single user. Deployed on Vercel Hobby plan, so Vercel's built-in password protection is unavailable. Solution uses Vercel Edge Middleware to guard all routes and a serverless function to verify the password.

## Architecture

Three new files, two Vercel env vars, no changes to existing templates:

```
middleware.js        ← Vercel Edge Middleware, runs on every request
api/
  login.js          ← serverless function, handles POST from login form
src/
  login.njk         ← 11ty login page template (standalone, no base.njk)
```

**Env vars (set in Vercel dashboard):**
- `PASSWORD` — the plain-text password, compared on login
- `COOKIE_SECRET` — a random string (32+ chars) used to sign the auth cookie

## Login Flow

1. User visits any protected route (everything except `/login`).
2. `middleware.js` checks for a valid `auth` cookie. The middleware skips `/login` and `/api/login` (both are always accessible).
   - No valid cookie → redirect to `/login?redirect=<original-path>`.
3. User submits the password form on `/login`; form POSTs to `/api/login`.
4. `api/login.js` compares the submitted password against the `PASSWORD` env var.
   - Wrong password → redirect to `/login?error=1`.
   - Correct → compute `HMAC-SHA256("authenticated", COOKIE_SECRET)`, set cookie as `authenticated:<hmac>`, redirect to the original path (or `/` if none).
5. On subsequent requests, middleware splits the cookie on `:`, recomputes the HMAC of `"authenticated"` with `COOKIE_SECRET`, and compares it to the stored HMAC. Mismatch or missing cookie → redirect to `/login`.

## Cookie Properties

- `HttpOnly` — not accessible to JavaScript
- `Secure` — HTTPS only
- `SameSite=Strict` — not sent on cross-site requests
- No expiry — persists for the browser session only

## Login Page

- Standalone page, does **not** extend `base.njk` (no nav or recipe chrome)
- Centered card layout using existing SCSS design tokens (colors, fonts, spacing)
- Contains: password input, submit button, conditional error message
- Error message shown when `?error=1` is present: "Incorrect password"

## Out of Scope

- Logout (no `/api/logout` route)
- Rate limiting / brute-force protection
- Session expiry
- Multiple users
