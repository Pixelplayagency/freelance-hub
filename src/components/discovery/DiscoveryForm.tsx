'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import type { DiscoveryConfig, DiscoveryQuestion } from '@/lib/types/app.types'
import { DEFAULT_DISCOVERY_CONFIG } from '@/lib/types/app.types'

interface Props {
  tokenId: string
  token: string
  label: string | null
  isExpired: boolean
  isUsed: boolean
  previewConfig?: DiscoveryConfig
}

const INDUSTRIES = [
  'Fashion & Apparel', 'Food & Beverage', 'Beauty & Wellness', 'Real Estate',
  'Technology', 'Healthcare', 'Education', 'Retail', 'Travel & Hospitality',
  'Automotive', 'Finance', 'Entertainment', 'Sports & Fitness', 'Other',
]

const ROLES = ['Owner / Founder', 'Manager', 'Marketing / Brand Lead', 'Team Member', 'Other']

function CheckboxGroup({ options, selected, onChange, single }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; single?: boolean
}) {
  const toggle = (opt: string) => {
    if (single) onChange(selected[0] === opt ? [] : [opt])
    else onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div className="space-y-2.5">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150"
          style={{ borderColor: selected.includes(opt) ? '#f24a49' : '#e5e0d8', backgroundColor: selected.includes(opt) ? 'rgba(242,74,73,0.05)' : 'white' }}
        >
          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
            style={{ borderColor: selected.includes(opt) ? '#f24a49' : '#c9c2b8', backgroundColor: selected.includes(opt) ? '#f24a49' : 'transparent' }}
          >
            {selected.includes(opt) && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium" style={{ color: selected.includes(opt) ? '#f24a49' : '#3a3530' }}>{opt}</span>
        </button>
      ))}
    </div>
  )
}

function FormInput({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>
        {label}{required && <span style={{ color: '#f24a49' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
        style={{ borderColor: '#e5e0d8', backgroundColor: 'white', color: '#1a1714' }}
        onFocus={e => { e.target.style.borderColor = '#f24a49' }}
        onBlur={e => { e.target.style.borderColor = '#e5e0d8' }}
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>
        {label}{required && <span style={{ color: '#f24a49' }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
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

function QuestionBlock({ q, answers, setAnswer }: {
  q: DiscoveryQuestion
  answers: Record<string, string[]>
  setAnswer: (id: string, val: string[]) => void
}) {
  const val = answers[q.id] ?? []

  if (q.type === 'social_handles') {
    return (
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>{q.text}</h3>
        <div className="grid grid-cols-2 gap-3">
          {['Instagram', 'Facebook', 'TikTok', 'Website'].map((platform, i) => (
            <FormInput key={platform} label={platform} value={val[i] ?? ''} placeholder={platform === 'Website' ? 'https://...' : '@username'}
              onChange={v => { const next = [...val]; next[i] = v; setAnswer(q.id, next) }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#3a3530' }}>{q.text}</h3>
      <CheckboxGroup options={q.options} selected={val} onChange={v => setAnswer(q.id, v)} single={q.type === 'single_choice'} />
    </div>
  )
}

export function DiscoveryForm({ tokenId, token, label, isExpired, isUsed, previewConfig }: Props) {
  const [config, setConfig] = useState<DiscoveryConfig>(previewConfig ?? DEFAULT_DISCOVERY_CONFIG)
  const [page, setPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})

  // Fixed fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [businessRole, setBusinessRole] = useState('')
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')

  useEffect(() => {
    if (previewConfig) { setConfig(previewConfig); return }
    fetch('/api/discovery/config').then(r => r.json()).then(setConfig).catch(() => {})
  }, [previewConfig])

  const setAnswer = (id: string, val: string[]) => setAnswers(prev => ({ ...prev, [id]: val }))

  const page1Questions = config.questions.filter(q => q.page === 1)
  const page2Questions = config.questions.filter(q => q.page === 2)

  const isPreview = !tokenId

  if (!isPreview && (isExpired || isUsed)) {
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
            {isUsed ? 'This discovery form has already been completed.' : 'This link has expired. Please contact us to get a new one.'}
          </p>
        </div>
      </div>
    )
  }

  if (!isPreview && submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(242,74,73,0.1)' }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: '#f24a49' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1a1714' }}>Thank you!</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#8c8278' }}>
            We've received your discovery form. Our team will review your information and reach out to you shortly.
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const socialAnswers = answers['q4_note'] ?? []
      const res = await fetch('/api/discovery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId, token,
          firstName, lastName, email, contactNumber,
          businessRole, brandName, industry, businessDescription,
          brandPresence: answers['q1']?.[0] ?? null,
          workedWithAgency: answers['q2']?.[0] ?? null,
          startTimeline: answers['q3']?.[0] ?? null,
          instagramHandle: socialAnswers[0] ?? null,
          facebookHandle: socialAnswers[1] ?? null,
          tiktokHandle: socialAnswers[2] ?? null,
          websiteUrl: socialAnswers[3] ?? null,
          supportTypes: answers['q5'] ?? [],
          contentTypes: answers['q6'] ?? [],
          postsPerMonth: answers['q7']?.[0] ?? null,
          reelsPerMonth: answers['q8']?.[0] ?? null,
          siteVisitsOk: answers['q9']?.[0] ?? null,
          monthlyBudget: answers['q10']?.[0] ?? null,
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
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.35)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1a1714' }}>CLIENT DISCOVERY</h1>
          <p className="text-sm mt-1.5" style={{ color: '#8c8278' }}>
            This form helps us understand your brand and build a custom content system tailored to your needs.
          </p>
          {label && <p className="text-xs mt-1 font-medium" style={{ color: '#f24a49' }}>{label}</p>}
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ backgroundColor: page === s ? '#f24a49' : page > s ? 'rgba(242,74,73,0.12)' : '#e5e0d8', color: page === s ? 'white' : page > s ? '#f24a49' : '#8c8278' }}
              >
                {page > s ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : <span>{s}</span>}
                <span>{s === 1 ? 'Your Details' : 'Your Needs'}</span>
              </div>
              {s < 2 && <div className="w-8 h-px" style={{ backgroundColor: '#e5e0d8' }} />}
            </div>
          ))}
        </div>

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
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8c8278' }}>Short description of your business</label>
                  <textarea value={businessDescription} onChange={e => setBusinessDescription(e.target.value)}
                    placeholder="Tell us what you do..." rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all resize-none"
                    style={{ borderColor: '#e5e0d8', backgroundColor: 'white', color: '#1a1714' }}
                    onFocus={e => { e.target.style.borderColor = '#f24a49' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e0d8' }}
                  />
                </div>
              </section>
              <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />
              <section className="space-y-5">
                {page1Questions.map((q, i) => (
                  <div key={q.id}>
                    {i > 0 && <div className="h-px mb-5" style={{ backgroundColor: '#f0ece6' }} />}
                    <QuestionBlock q={q} answers={answers} setAnswer={setAnswer} />
                  </div>
                ))}
              </section>
            </>
          ) : (
            <section className="space-y-6">
              {page2Questions.map((q, i) => (
                <div key={q.id}>
                  {i > 0 && <div className="h-px" style={{ backgroundColor: '#f0ece6' }} />}
                  <QuestionBlock q={q} answers={answers} setAnswer={setAnswer} />
                </div>
              ))}
            </section>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(242,74,73,0.08)', color: '#c0392b' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          {page === 2 ? (
            <button type="button" onClick={() => setPage(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#e5e0d8', color: '#8c8278' }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {page === 1 ? (
            <button type="button" onClick={() => setPage(2)} disabled={!page1Valid && !isPreview}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.30)' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={isPreview ? () => setPage(1) : handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.30)' }}
            >
              {isPreview ? 'Back to Start (Preview)' : submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#c0b8b0' }}>Powered by PixelFlow</p>
      </div>
    </div>
  )
}
