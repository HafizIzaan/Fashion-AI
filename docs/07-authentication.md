# Authentication and Authorization

## Authentication
Use Supabase Auth with Google Sign-In for application login/account identity.

Google Sign-In is separate from the Gemini API credential connection.

## Authorization
Every protected server operation must identify the authenticated user and enforce authorization server-side.

### Personal library
The owner can view, add, edit, delete, and use personal items.

### Family library
All family members can view/use family items. Admins can add/edit/delete/manage family-library items.

### Administration
Only family admins can access family-member management, family-library management, and credit management.

## Security rules
- Never put Supabase service/secret keys in browser code.
- Use Supabase RLS for database access.
- Do not rely on hidden UI controls as authorization.
- AI provider credentials remain server-side.
- Failed authentication/authorization must stop the operation before credit reservation or provider calls.
