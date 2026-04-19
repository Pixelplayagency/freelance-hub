CREATE TABLE IF NOT EXISTS discovery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default config
INSERT INTO discovery_config (id, config) VALUES (1, '{
  "questions": [
    {
      "id": "q1",
      "page": 1,
      "text": "How would you describe your current brand presence?",
      "type": "single_choice",
      "options": [
        "We don''t have any branding yet and would like support",
        "We have a logo but need help building full branding",
        "We have a complete brand kit (visuals, fonts, colors, and tone of voice)"
      ]
    },
    {
      "id": "q2",
      "page": 1,
      "text": "Have you worked with an agency before?",
      "type": "single_choice",
      "options": ["Yes", "No"]
    },
    {
      "id": "q3",
      "page": 1,
      "text": "When are you looking to start?",
      "type": "single_choice",
      "options": ["Immediately", "Within 1 month", "2–3 months", "5 months +"]
    },
    {
      "id": "q4_note",
      "page": 1,
      "text": "Please add all of your social media account @username",
      "type": "social_handles",
      "options": []
    },
    {
      "id": "q5",
      "page": 2,
      "text": "What kind of support do you expect from us?",
      "type": "multi_choice",
      "options": [
        "Social Media Strategy & Management",
        "Campaign Strategy & Production",
        "Brand Development & Identity Design",
        "Paid Media Strategy & Management"
      ]
    },
    {
      "id": "q6",
      "page": 2,
      "text": "What type of content do you need us to create?",
      "type": "multi_choice",
      "options": [
        "Photography",
        "Videography",
        "Graphic Design",
        "Short-Form Video Production",
        "Product & Lifestyle Content Production"
      ]
    },
    {
      "id": "q7",
      "page": 2,
      "text": "How much content do you roughly want per month?",
      "type": "single_choice",
      "options": ["6–12 Posts", "12–18 Posts", "18–28 Posts", "Not sure (need guidance)"]
    },
    {
      "id": "q8",
      "page": 2,
      "text": "How many reels are you expecting per month?",
      "type": "single_choice",
      "options": ["02 – 04 Reels", "04 – 06 Reels", "06 – 08 Reels", "Other Amounts"]
    },
    {
      "id": "q9",
      "page": 2,
      "text": "Are you okay with us visiting your site for content shoots at the end or start of the month (1–2 times per month)?",
      "type": "single_choice",
      "options": ["Yes, that works", "No, I''d prefer another arrangement"]
    },
    {
      "id": "q10",
      "page": 2,
      "text": "How much would you be able to spend on marketing (monthly budget range)?",
      "type": "single_choice",
      "options": [
        "Rs 80,000 – 100,000",
        "Rs 100,000 – 160,000",
        "Rs 160,000 – 200,000",
        "Rs 250,000 +"
      ]
    }
  ]
}') ON CONFLICT (id) DO NOTHING;

ALTER TABLE discovery_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage discovery config"
  ON discovery_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow public read for the form to load config
CREATE POLICY "Public read discovery config"
  ON discovery_config FOR SELECT
  USING (true);
