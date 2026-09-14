# Project Overview

## Purpose
Fashion AI is a private family-use web application for managing clothing images and generating AI-assisted outfits.

## Primary capabilities
1. Maintain a personal and family clothing library.
2. Upload an outfit photo and scan it for clothing/accessory items.
3. Select detected items and generate clean standalone product images.
4. Build outfits from library items in Studio.
5. Generate outfit imagery using a connected AI provider.
6. Download generated images without saving them unless explicitly requested.
7. Save and share selected results with family members.
8. Manage AI providers, models, and application credits.

## Product principles
- Premium editorial/minimalist monochrome visual language.
- Large, image-first presentation.
- Simple workflows suitable for mobile and desktop.
- Strong separation between temporary processing and permanent library data.
- Server-side enforcement for authentication, authorization, credits, provider credentials, and category rules.

## Initial technology direction
- Next.js / React / TypeScript
- Vercel
- Supabase Auth, Postgres, Storage
- Gemini initially through a provider abstraction
- GitHub as the source of truth for code and documentation
