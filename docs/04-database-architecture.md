# Database Architecture

## Tables

### profiles
- id
- display_name
- avatar_url
- created_at
- updated_at

### families
- id
- name
- created_at
- updated_at

### family_members
- id
- family_id
- user_id
- role
- created_at

Roles: `admin`, `member`.

### clothing_categories
- id
- name
- slug
- sort_order

### clothing_items
- id
- name
- category_id
- subcategory
- owner_user_id
- family_id
- library_type
- image_path
- thumbnail_path
- source_type
- created_at
- updated_at

`library_type`: `personal` or `family`.
`source_type`: `manual_upload` or `ai_extraction`.

### generation_jobs
- id
- user_id
- status
- provider_id
- model
- credit_cost
- input_data
- error_message
- created_at
- started_at
- completed_at

Status: queued, processing, completed, failed, cancelled.

### generated_results
- id
- user_id
- family_id
- generation_job_id
- image_path
- visibility
- created_at

Visibility: `private` or `family`.

### ai_providers
- id
- name
- slug
- enabled

### user_ai_connections
- id
- user_id
- provider_id
- encrypted_credential
- status
- created_at
- updated_at

Status: connected, invalid, disabled.

### credit_accounts
- id
- user_id
- balance
- mode
- updated_at

Mode: `limited` or `unlimited`.

### credit_transactions
- id
- user_id
- amount
- transaction_type
- generation_job_id
- description
- created_at

## Rules
- Store image files in Supabase Storage, not binary data in Postgres.
- Use category metadata rather than separate jacket/shirt/etc. tables.
- Use RLS for personal/family access control.
- Credit mutations must be atomic to prevent double-spending.
- Do not create a permanent outfit table in V1; temporary combinations can live in generation job input data.
