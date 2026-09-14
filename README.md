# Fashion AI

Private family-use AI fashion and outfit generation web app.

## Goal
Build a premium, minimalist fashion workspace for:
- storing clean clothing product images
- scanning outfit photos and detecting clothing items
- extracting individual garments/accessories into the library
- building outfits from library items
- generating outfit images with AI
- sharing selected family-library items/results

## Product Navigation
- Studio
- Clothes Library
- Generated Results
- Settings

## Core Stack
- Next.js / React / TypeScript
- Vercel
- Supabase Postgres, Auth, Storage
- Google Gemini initially, behind an AI provider abstraction
- GitHub for source, documentation, and development workflow

## Important Rules
- Private family app; not a public social product.
- AI/provider calls happen server-side.
- Never expose service/secret keys in browser code.
- User AI credentials must not be stored as plaintext.
- Use Supabase RLS for personal/family permissions.
- Validate clothing categories on both frontend and backend.
- Reserve credits before paid AI work; finalize on success and refund on failure.
- Temporary uploads are not permanent records unless the user explicitly saves them.
- Generated results are private by default.
- Use current official provider documentation when implementing integrations.

## UI Direction
Premium editorial/minimalist monochrome interface with large imagery, restrained controls, clean typography, and responsive mobile layouts.

## Development Approach
Do not build the whole application in one uncontrolled pass. Work in phases, inspect existing code before changing it, preserve working functionality, test each phase, and keep the implementation aligned with `/docs` and `/claude`.

## Documentation
- Product requirements: `docs/02-product-requirements.md`
- UI specification: `docs/03-ui-specification.md`
- Architecture: `docs/04-database-architecture.md`
- AI workflows: `docs/05-ai-workflows.md`
- Credits: `docs/06-credit-system.md`
- Authentication: `docs/07-authentication.md`
- Storage: `docs/08-storage.md`
- Security: `docs/09-security.md`
- Deployment: `docs/10-deployment.md`
- Roadmap: `docs/11-development-roadmap.md`
- Claude build prompts: `/claude`
- Database schema: `database/schema.sql`
