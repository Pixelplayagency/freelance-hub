-- Client discovery tokens (shareable links admins generate)
CREATE TABLE IF NOT EXISTS client_discovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  label TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client discovery submissions (form responses)
CREATE TABLE IF NOT EXISTS client_discovery_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES client_discovery_tokens(id) ON DELETE SET NULL,

  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT,

  -- Company info
  business_role TEXT,
  brand_name TEXT NOT NULL,
  industry TEXT,
  business_description TEXT,

  -- Q1–Q4
  brand_presence TEXT,
  worked_with_agency TEXT,
  start_timeline TEXT,
  instagram_handle TEXT,
  facebook_handle TEXT,
  tiktok_handle TEXT,
  website_url TEXT,

  -- Q5–Q10
  support_types TEXT[],
  content_types TEXT[],
  posts_per_month TEXT,
  reels_per_month TEXT,
  site_visits_ok TEXT,
  monthly_budget TEXT,

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE client_discovery_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_discovery_submissions ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins manage discovery tokens"
  ON client_discovery_tokens FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins view discovery submissions"
  ON client_discovery_submissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public can read a token by its token value (for validation, via service client in API)
-- Public can insert submissions (via service client in API route — no RLS bypass needed there)

CREATE INDEX IF NOT EXISTS idx_discovery_tokens_token ON client_discovery_tokens(token);
CREATE INDEX IF NOT EXISTS idx_discovery_submissions_token_id ON client_discovery_submissions(token_id);
