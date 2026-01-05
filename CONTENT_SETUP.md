# Content Storage Setup

Run the following SQL in your Supabase SQL Editor to set up the content management system.

## 1. Create the content table

```sql
-- Create content type enum
CREATE TYPE content_type AS ENUM ('study_guide', 'video', 'extra', 'podcast', 'note');

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin_upload BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_uploaded_by ON content(uploaded_by);
CREATE INDEX idx_content_is_admin ON content(is_admin_upload);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Policy: Admin uploads are visible to everyone
CREATE POLICY "Admin uploads visible to all authenticated users"
ON content FOR SELECT
USING (is_admin_upload = true AND auth.role() = 'authenticated');

-- Policy: Users can see their own uploads
CREATE POLICY "Users can view their own uploads"
ON content FOR SELECT
USING (uploaded_by = auth.uid() AND is_admin_upload = false);

-- Policy: Users can insert their own content
CREATE POLICY "Users can insert their own content"
ON content FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own non-admin uploads
CREATE POLICY "Users can delete their own uploads"
ON content FOR DELETE
USING (uploaded_by = auth.uid() AND is_admin_upload = false);

-- Policy: Admins can do anything (checking profile role)
CREATE POLICY "Admins have full access"
ON content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## 2. Create flashcards table

```sql
-- Create question type enum for flashcards
CREATE TYPE question_type AS ENUM ('short', 'long', 'multiple_choice', 'fill_blank', 'image');

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_type question_type NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  options JSONB, -- For multiple choice: [{label: 'A', text: '...'}, ...]
  correct_option TEXT, -- For multiple choice: 'A', 'B', 'C', or 'D'
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_flashcards_type ON flashcards(question_type);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);

-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view flashcards
CREATE POLICY "Authenticated users can view flashcards"
ON flashcards FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert flashcards
CREATE POLICY "Admins can insert flashcards"
ON flashcards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can delete flashcards
CREATE POLICY "Admins can delete flashcards"
ON flashcards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update flashcards
CREATE POLICY "Admins can update flashcards"
ON flashcards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## 3. Create storage buckets

Go to **Storage** in your Supabase dashboard and create the following public buckets:

### study-guides bucket

1. Click "New bucket"
2. Name: `study-guides`
3. Check "Public bucket"
4. Click "Create bucket"

### extras bucket

1. Click "New bucket"
2. Name: `extras`
3. Check "Public bucket"
4. Click "Create bucket"

### notes bucket

1. Click "New bucket"
2. Name: `notes`
3. Check "Public bucket"
4. Click "Create bucket"

### flashcard-images bucket

1. Click "New bucket"
2. Name: `flashcard-images`
3. Check "Public bucket"
4. Click "Create bucket"

## 4. Storage bucket policies

After creating the buckets, add these policies:

### For study-guides bucket:

```sql
-- Allow authenticated users to upload to study-guides
CREATE POLICY "Authenticated users can upload to study-guides"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-guides'
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public read access for study-guides"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-guides');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files from study-guides"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-guides'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to delete any file
CREATE POLICY "Admins can delete any file from study-guides"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-guides'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### For extras bucket:

```sql
-- Allow authenticated users to upload to extras
CREATE POLICY "Authenticated users can upload to extras"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'extras'
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public read access for extras"
ON storage.objects FOR SELECT
USING (bucket_id = 'extras');

-- Allow admins to delete files from extras
CREATE POLICY "Admins can delete from extras"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'extras'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### For notes bucket:

```sql
-- Allow authenticated users to upload to notes
CREATE POLICY "Authenticated users can upload to notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notes'
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Public read access for notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files from notes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to delete any file
CREATE POLICY "Admins can delete any file from notes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notes'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### For flashcard-images bucket:

```sql
-- Allow admins to upload to flashcard-images
CREATE POLICY "Admins can upload to flashcard-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flashcard-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow public read access
CREATE POLICY "Public read access for flashcard-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'flashcard-images');

-- Allow admins to delete from flashcard-images
CREATE POLICY "Admins can delete from flashcard-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flashcard-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## 5. Update trigger for updated_at

```sql
-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_updated_at
BEFORE UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_content_updated_at();
```

## File Size Limits

The application enforces a **50MB limit per file** in the upload API. This is handled in the code, not at the database level.

## Notes

- Admin uploads are visible to ALL authenticated users
- Student uploads are only visible to the student who uploaded them
- Only admins can upload to the "videos" content type (YouTube URLs)
- Only admins can upload to the "extras" content type (images)
- Only admins can upload to the "podcast" content type (YouTube URLs)
- Only admins can create flashcards (all types)
- Both admins and students can upload to the "notes" content type
- Students can upload their own study guides for personal use

## Flashcard Types

- **Short Answer**: Brief question with a short text answer
- **Long Answer**: Question with a detailed text answer
- **Multiple Choice**: Question with A, B, C, D options and one correct answer
- **Fill in the Blank**: Sentence with **\_** to indicate the blank, student fills in
- **Image Based**: Question with an image (graphs, diagrams, math problems)
