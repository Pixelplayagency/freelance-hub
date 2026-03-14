-- Project media table: tracks all Cloudinary-hosted images and reels per project

CREATE TABLE IF NOT EXISTS public.project_media (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL CHECK (type IN ('cover', 'avatar', 'image', 'reel')),
  cloudinary_public_id TEXT,
  url                  TEXT NOT NULL,
  thumbnail_url        TEXT,
  created_by           UUID REFERENCES public.profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON public.project_media(project_id);

-- RLS
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on project_media"
  ON public.project_media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Freelancers can read media for projects they have access to
CREATE POLICY "Freelancers read project_media"
  ON public.project_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'freelancer' AND status = 'active'
    )
  );
