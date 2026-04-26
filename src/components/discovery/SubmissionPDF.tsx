import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { DiscoverySubmission } from '@/lib/types/app.types'

// Register a clean font stack — Helvetica is built-in and crisp
const brand = '#f24a49'
const ink = '#1a1714'
const muted = '#8c8278'
const rule = '#e8e3dc'
const bg = '#faf9f7'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: 'white', paddingBottom: 48 },

  // Hero header
  hero: { backgroundColor: brand, paddingHorizontal: 40, paddingTop: 36, paddingBottom: 28 },
  heroLabel: { fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  heroName: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 2 },
  heroBrand: { fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 20 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: { fontSize: 9, color: 'rgba(255,255,255,0.75)' },

  // Body
  body: { paddingHorizontal: 40, paddingTop: 30 },

  // Section
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: brand, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: brand },

  // Row
  row: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: rule },
  rowLabel: { width: 140, fontSize: 8.5, color: muted, fontFamily: 'Helvetica-Bold' },
  rowValue: { flex: 1, fontSize: 9, color: ink, lineHeight: 1.45 },

  // Badge chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { fontSize: 8, color: brand, backgroundColor: 'rgba(242,74,73,0.09)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 },
  footerText: { fontSize: 8, color: muted },
})

function Row({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  if (!value || (Array.isArray(value) && !value.length)) return null
  if (Array.isArray(value)) {
    return (
      <View style={s.row}>
        <Text style={s.rowLabel}>{label}</Text>
        <View style={[s.chips, { flex: 1 }]}>
          {value.map((v, i) => <Text key={i} style={s.chip}>{v}</Text>)}
        </View>
      </View>
    )
  }
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  )
}

export function SubmissionDocument({ s: sub }: { s: DiscoverySubmission }) {
  const submitted = new Date(sub.submitted_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const hasSocial = sub.instagram_handle || sub.facebook_handle || sub.tiktok_handle || sub.website_url
  const hasRequirements = sub.support_types?.length || sub.content_types?.length || sub.posts_per_month || sub.reels_per_month || sub.site_visits_ok || sub.monthly_budget

  return (
    <Document title={`Discovery — ${sub.brand_name}`} author="PixelPlay Agency">
      <Page size="A4" style={s.page}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>Client Discovery Form</Text>
          <Text style={s.heroName}>{sub.first_name} {sub.last_name}</Text>
          <Text style={s.heroBrand}>{sub.brand_name}{sub.industry ? `  ·  ${sub.industry}` : ''}</Text>
          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}>
              <Text style={s.heroMetaText}>{sub.email}</Text>
            </View>
            {sub.contact_number && (
              <View style={s.heroMetaItem}>
                <Text style={s.heroMetaText}>{sub.contact_number}</Text>
              </View>
            )}
            <View style={[s.heroMetaItem, { marginLeft: 'auto' }]}>
              <Text style={s.heroMetaText}>Submitted {submitted}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Business Overview */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Business Overview</Text>
            <Row label="Business role" value={sub.business_role} />
            <Row label="Brand name" value={sub.brand_name} />
            <Row label="Industry" value={sub.industry} />
            <Row label="Description" value={sub.business_description} />
            <Row label="Brand presence" value={sub.brand_presence} />
            <Row label="Worked with agency" value={sub.worked_with_agency} />
            <Row label="Start timeline" value={sub.start_timeline} />
          </View>

          {/* Social Media */}
          {hasSocial && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Online Presence</Text>
              <Row label="Instagram" value={sub.instagram_handle} />
              <Row label="Facebook" value={sub.facebook_handle} />
              <Row label="TikTok" value={sub.tiktok_handle} />
              <Row label="Website" value={sub.website_url} />
            </View>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Requirements & Budget</Text>
              <Row label="Support needed" value={sub.support_types} />
              <Row label="Content types" value={sub.content_types} />
              <Row label="Posts / month" value={sub.posts_per_month} />
              <Row label="Reels / month" value={sub.reels_per_month} />
              <Row label="Site visits ok" value={sub.site_visits_ok} />
              <Row label="Monthly budget" value={sub.monthly_budget} />
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>PixelPlay Agency  ·  Confidential</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
