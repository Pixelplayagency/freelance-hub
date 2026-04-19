'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  tokenId: string
  token: string
  label: string | null
  isExpired: boolean
  isUsed: boolean
}

const INDUSTRIES = [
  'Fashion & Apparel', 'Food & Beverage', 'Beauty & Wellness', 'Real Estate',
  'Technology', 'Healthcare', 'Education', 'Retail', 'Travel & Hospitality',
  'Automotive', 'Finance', 'Entertainment', 'Sports & Fitness', 'Other',
]

const ROLES = ['Owner / Founder', 'Manager', 'Marketing / Brand Lead', 'Team Member', 'Other']

const BRAND_PRESENCE = [
  "We don't have any branding yet and would like support",
  'We have a logo but need help building full branding',
  'We have a complete brand kit (visuals, fonts, colors, and tone of voice)',
]

const TIMELINES = ['Immediately', 'Within 1 month', '2–3 months', '5 months +']

const SUPPORT_TYPES = [
  'Social Media Strategy & Management',
  'Campaign Strategy & Production',
  'Brand Development & Identity Design',
  'Paid Media Strategy & Management',
]

const CONTENT_TYPES = [
  'Photography',
  'Videography',
  'Graphic Design',
  'Short-Form Video Production',
  'Product & Lifestyle Content Production',
]

const POSTS_OPTIONS = ['6–12 Posts', '12–18 Posts', '18–28 Posts', 'Not sure (need guidance)']
const REELS_OPTIONS = ['02 – 04 Reels', '04 – 06 Reels', '06 – 08 Reels', 'Other Amounts']
const BUDGET_OPTIONS = ['Rs 80,000 – 100,000', 'Rs 100,000 – 160,000', 'Rs 160,000 – 200,000', 'Rs 250,000 +']

function CheckboxGroup({
  options,
  selected,
  onChange,
  single,
}: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
  single?: boolean
}) {
  const toggle = (opt: string) => {
    if (single) {
      onChange(selected[0] === opt ? [] : [opt])
    } else {
      onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
    }
  }
  return (
    <div className="space-y-2.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150"
          style={{
            borderColor: selected.includes(opt) ? '#f24a49' : '#e5e0d8',
            backgroundColor: selected.includes(opt) ? 'rgba(242,74,73,0.05)' : 'white',
          }}
        >
          <div
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
            style={{
              borderColor: selected.includes(opt) ? '#f24a49' : '#c9c2b8',
              backgroundColor: selected.includes(opt) ? '#f24a49' : 'transparent',
            }}
          >
            {selected.includes(opt) && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium" style={{ color: selected.includes(opt) ? '#f24a49' : '#3a3530' }}>
            {opt}
          </span>
        </button>
      ))}
    </div>
  )
}

function FormInput({
  label, value, onChange, placeholder, type = 'text', required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>
        {label}{required && <span style={{ color: '#f24a49' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
        style={{ borderColor: '#e5e0d8', backgroundColor: 'white', color: '#1a1714' }}
        onFocus={e => { e.target.style.borderColor = '#f24a49' }}
        onBlur={e => { e.target.style.borderColor = '#e5e0d8' }}
      />
    </div>
  )
}

function FormSelect({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>
        {label}{required && <span style={{ color: '#f24a49' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all appearance-none cursor-pointer"
        style={{ borderColor: '#e5e0d8', backgroundColor: 'white', color: value ? '#1a1714' : '#a09690' }}
        onFocus={e => { e.target.style.borderColor = '#f24a49' }}
        onBlur={e => { e.target.style.borderColor = '#e5e0d8' }}
      >
        <option value="" disabled>Select an option</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export function DiscoveryForm({ tokenId, token, label, isExpired, isUsed }: Props) {
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Page 1 fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [businessRole, setBusinessRole] = useState('')
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [brandPresence, setBrandPresence] = useState('')
  const [workedWithAgency, setWorkedWithAgency] = useState('')
  const [startTimeline, setStartTimeline] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [facebookHandle, setFacebookHandle] = useState('')
  const [tiktokHandle, setTiktokHandle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Page 2 fields
  const [supportTypes, setSupportTypes] = useState<string[]>([])
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [postsPerMonth, setPostsPerMonth] = useState<string[]>([])
  const [reelsPerMonth, setReelsPerMonth] = useState<string[]>([])
  const [siteVisitsOk, setSiteVisitsOk] = useState<string[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState<string[]>([])

  if (isExpired || isUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" style={{ color: '#f24a49' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#1a1714' }}>
            {isUsed ? 'Form Already Submitted' : 'Link Expired'}
          </h1>
          <p className="text-sm" style={{ color: '#8c8278' }}>
            {isUsed
              ? 'This discovery form has already been completed. Please contact us if you need to make changes.'
              : 'This link has expired. Please contact us to get a new one.'}
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(242,74,73,0.1)' }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: '#f24a49' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1a1714' }}>Thank you!</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#8c8278' }}>
            We've received your discovery form. Our team will review your information and reach out to you shortly.
          </p>
          <div className="mt-6 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(242,74,73,0.06)' }}>
            <p className="text-sm font-semibold" style={{ color: '#f24a49' }}>
              📩 Check your inbox for a confirmation
            </p>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/discovery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          token,
          firstName,
          lastName,
          email,
          contactNumber,
          businessRole,
          brandName,
          industry,
          businessDescription,
          brandPresence,
          workedWithAgency,
          startTimeline,
          instagramHandle,
          facebookHandle,
          tiktokHandle,
          websiteUrl,
          supportTypes,
          contentTypes,
          postsPerMonth: postsPerMonth[0] ?? null,
          reelsPerMonth: reelsPerMonth[0] ?? null,
          siteVisitsOk: siteVisitsOk[0] ?? null,
          monthlyBudget: monthlyBudget[0] ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Submission failed')
      setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const page1Valid = firstName && lastName && email && brandName

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.35)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1a1714' }}>CLIENT DISCOVERY</h1>
          <p className="text-sm mt-1.5" style={{ color: '#8c8278' }}>
            This form helps us understand your brand and build a custom content system tailored to your needs.
          </p>
          {label && (
            <p className="text-xs mt-1 font-medium" style={{ color: '#f24a49' }}>{label}</p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: page === s ? '#f24a49' : page > s ? 'rgba(242,74,73,0.12)' : '#e5e0d8',
                  color: page === s ? 'white' : page > s ? '#f24a49' : '#8c8278',
                }}
              >
                {page > s ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{s}</span>
                )}
                <span>{s === 1 ? 'Your Details' : 'Your Needs'}</span>
              </div>
              {s < 2 && <div className="w-8 h-px" style={{ backgroundColor: '#e5e0d8' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8 shadow-sm space-y-6" style={{ backgroundColor: 'white', border: '1px solid #e5e0d8' }}>
          {page === 1 ? (
            <>
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#f24a49' }}>Your Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="First name" value={firstName} onChange={setFirstName} placeholder="John" required />
                  <FormInput label="Last name" value={lastName} onChange={setLastName} placeholder="Doe" required />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="john@brand.com" required />
                  <FormInput label="Contact number" value={contactNumber} onChange={setContactNumber} placeholder="+94 77 123 4567" />
                </div>
              </section>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#f24a49' }}>Company Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect label="Your role in the business" value={businessRole} onChange={setBusinessRole} options={ROLES} />
                  <FormInput label="Brand / company name" value={brandName} onChange={setBrandName} placeholder="Acme Co." required />
                </div>
                <div className="mt-4">
                  <FormSelect label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
                </div>
                <div className="mt-4 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>
                    Short description of your business
                  </label>
                  <textarea
                    value={businessDescription}
                    onChange={e => setBusinessDescription(e.target.value)}
                    placeholder="Tell us what you do..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all resize-none"
                    style={{ borderColor: '#e5e0d8', backgroundColor: 'white', color: '#1a1714' }}
                    onFocus={e => { e.target.style.borderColor = '#f24a49' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e0d8' }}
                  />
                </div>
              </section>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <section className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                    01. How would you describe your current brand presence?
                  </h3>
                  <CheckboxGroup options={BRAND_PRESENCE} selected={brandPresence ? [brandPresence] : []} onChange={v => setBrandPresence(v[0] ?? '')} single />
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                    02. Have you worked with an agency before?
                  </h3>
                  <CheckboxGroup options={['Yes', 'No']} selected={workedWithAgency ? [workedWithAgency] : []} onChange={v => setWorkedWithAgency(v[0] ?? '')} single />
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                    03. When are you looking to start?
                  </h3>
                  <CheckboxGroup options={TIMELINES} selected={startTimeline ? [startTimeline] : []} onChange={v => setStartTimeline(v[0] ?? '')} single />
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                    04. Please add all of your social media account @username
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Instagram" value={instagramHandle} onChange={setInstagramHandle} placeholder="@username" />
                    <FormInput label="Facebook" value={facebookHandle} onChange={setFacebookHandle} placeholder="@username" />
                    <FormInput label="TikTok" value={tiktokHandle} onChange={setTiktokHandle} placeholder="@username" />
                    <FormInput label="Website" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://..." />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  05. What kind of support do you expect from us?
                </h3>
                <CheckboxGroup options={SUPPORT_TYPES} selected={supportTypes} onChange={setSupportTypes} />
              </div>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  06. What type of content do you need us to create?
                </h3>
                <CheckboxGroup options={CONTENT_TYPES} selected={contentTypes} onChange={setContentTypes} />
              </div>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  07. How much content do you roughly want per month?
                </h3>
                <CheckboxGroup options={POSTS_OPTIONS} selected={postsPerMonth} onChange={setPostsPerMonth} single />
              </div>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  08. How many reels are you expecting per month?
                </h3>
                <CheckboxGroup options={REELS_OPTIONS} selected={reelsPerMonth} onChange={setReelsPerMonth} single />
              </div>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  09. Are you okay with us visiting your site for content shoots at the end or start of the month (1–2 times per month)?
                </h3>
                <CheckboxGroup options={['Yes, that works', "No, I'd prefer another arrangement"]} selected={siteVisitsOk} onChange={setSiteVisitsOk} single />
              </div>

              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />

              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>
                  10. How much would you be able to spend on marketing (monthly budget range)?
                </h3>
                <CheckboxGroup options={BUDGET_OPTIONS} selected={monthlyBudget} onChange={setMonthlyBudget} single />
              </div>
            </section>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(242,74,73,0.08)', color: '#c0392b' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          {page === 2 ? (
            <button
              type="button"
              onClick={() => setPage(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#e5e0d8', color: '#8c8278' }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {page === 1 ? (
            <button
              type="button"
              onClick={() => setPage(2)}
              disabled={!page1Valid}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.30)' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.30)' }}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : 'Submit'}
            </button>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#c0b8b0' }}>
          Powered by PixelFlow
        </p>
      </div>
    </div>
  )
}
