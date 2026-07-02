-- Shareable, view-only links to a client's content calendar (with an optional
-- password gate) plus a notes feed the client can leave feedback in.
CREATE TABLE IF NOT EXISTS content_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  -- Plaintext by design: this is a lightweight "share password" the admin
  -- hands to the client, not a login credential — it must stay readable so
  -- it can be copied/shared again later, not just verified once.
  password TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_share_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES content_share_links(id) ON DELETE CASCADE,
  author_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_share_notes ENABLE ROW LEVEL SECURITY;

-- Admins/managers manage links and read notes. Public access (the /share/[token]
-- page and its note form) goes through the service client server-side and
-- never touches these RLS policies.
CREATE POLICY "Admins manage content share links"
  ON content_share_links FOR ALL
  USING (is_admin());

CREATE POLICY "Admins view content share notes"
  ON content_share_notes FOR ALL
  USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_content_share_links_token ON content_share_links(token);
CREATE INDEX IF NOT EXISTS idx_content_share_links_client ON content_share_links(client_id);
CREATE INDEX IF NOT EXISTS idx_content_share_notes_link ON content_share_notes(share_link_id);
