
-- Add new columns to applications table
ALTER TABLE public.applications
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN street_address TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state_province TEXT,
  ADD COLUMN country TEXT,
  ADD COLUMN occupation TEXT,
  ADD COLUMN id_card_front_url TEXT,
  ADD COLUMN id_card_back_url TEXT;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to read all documents
CREATE POLICY "Admins can read all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow service role full access (for signed URLs in edge functions)
CREATE POLICY "Service role full access to documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'application-documents')
WITH CHECK (bucket_id = 'application-documents');
