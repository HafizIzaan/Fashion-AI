# Deployment Plan

## Hosting
Deploy the web application to Vercel using the private GitHub repository.

A default Vercel `*.vercel.app` URL is sufficient for the private family application; a custom domain is not required.

## Backend
Use Vercel server-side routes/functions for protected AI and application operations.

## Supabase
Use Supabase for Postgres, Auth, and Storage. Configure Google Sign-In and database/storage security before production use.

## Environment configuration
Secrets and global server configuration belong in Vercel environment variables. Do not commit `.env` files or secret values to GitHub.

## Deployment flow
GitHub push → Vercel build/deploy → deployed app.

## Pre-deployment checks
- Build succeeds.
- Database migrations/schema are reviewed.
- RLS policies are enabled and tested.
- Provider credential handling is server-side and encrypted.
- AI calls do not occur before authorization/credit checks.
- Temporary assets are cleaned up.
- Mobile and desktop layouts are tested.
