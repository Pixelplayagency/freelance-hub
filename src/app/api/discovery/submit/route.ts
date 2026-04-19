import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tokenId, token,
      firstName, lastName, email, contactNumber,
      businessRole, brandName, industry, businessDescription,
      brandPresence, workedWithAgency, startTimeline,
      instagramHandle, facebookHandle, tiktokHandle, websiteUrl,
      supportTypes, contentTypes,
      postsPerMonth, reelsPerMonth, siteVisitsOk, monthlyBudget,
    } = body

    if (!tokenId || !firstName || !lastName || !email || !brandName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    // Re-validate token is still valid
    const { data: tokenRow } = await supabase
      .from('client_discovery_tokens')
      .select('id, used_at, expires_at')
      .eq('id', tokenId)
      .eq('token', token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Form already submitted' }, { status: 409 })
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 })
    }

    // Insert submission
    const { error: insertError } = await supabase
      .from('client_discovery_submissions')
      .insert({
        token_id: tokenId,
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contactNumber || null,
        business_role: businessRole || null,
        brand_name: brandName,
        industry: industry || null,
        business_description: businessDescription || null,
        brand_presence: brandPresence || null,
        worked_with_agency: workedWithAgency || null,
        start_timeline: startTimeline || null,
        instagram_handle: instagramHandle || null,
        facebook_handle: facebookHandle || null,
        tiktok_handle: tiktokHandle || null,
        website_url: websiteUrl || null,
        support_types: supportTypes?.length ? supportTypes : null,
        content_types: contentTypes?.length ? contentTypes : null,
        posts_per_month: postsPerMonth || null,
        reels_per_month: reelsPerMonth || null,
        site_visits_ok: siteVisitsOk || null,
        monthly_budget: monthlyBudget || null,
      })

    if (insertError) {
      console.error('Discovery submission insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // Mark token as used
    await supabase
      .from('client_discovery_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenId)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Discovery submit error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
