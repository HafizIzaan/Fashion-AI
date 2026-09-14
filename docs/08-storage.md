# Storage Architecture

Use Supabase Storage for images and Postgres for metadata.

## Stored assets
- Clothing library images.
- Optional thumbnails.
- Explicitly saved generated results.

## Temporary assets
Studio model uploads and unsaved generated outputs are temporary. They should not become permanent database/storage records unless the user chooses Save.

## Access
Prefer private buckets and signed/authorized access for private/family content. Storage permissions must match application authorization rules.

## Cleanup
Implement cleanup for abandoned temporary uploads and generated assets after an appropriate retention period.

## Do not
- Store image binaries in Postgres.
- Expose private storage paths without authorization.
- Store temporary assets indefinitely.
