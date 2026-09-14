# Security Requirements

- Keep all provider/API secrets server-side.
- Never commit secrets to GitHub.
- Never expose Supabase service/secret keys to the browser.
- Encrypt user-supplied AI credentials at rest; store the encryption key in server environment configuration.
- Never return plaintext provider credentials after saving.
- Validate uploads for type, size, and authorization.
- Enforce family/personal permissions with Supabase RLS plus backend checks.
- Enforce category/slot compatibility on the backend as well as frontend.
- Enforce credit balance and credit mutations on the backend.
- Use atomic credit reservations to avoid concurrent double-spending.
- Keep private storage private.
- Clean up temporary files.
- Log generation status and safe error information without logging credentials or other secrets.
