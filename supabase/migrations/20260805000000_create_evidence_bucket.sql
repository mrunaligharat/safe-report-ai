-- Create the evidence storage bucket if it doesn't already exist.
-- This bucket holds uploaded photos, videos, and audio files for incident reports.
-- Access is controlled by RLS policies defined in the previous migration.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/avi',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;
