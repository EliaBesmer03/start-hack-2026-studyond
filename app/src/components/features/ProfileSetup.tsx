/**
 * Feature: Profile Setup
 * Lets the student enter free-text profile details that get saved as
 * thesis notes and injected into every Co-Pilot conversation.
 */

import { useState } from 'react'
import { Check, GraduationCap, User } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
// @ts-ignore
import _universities from '@mock/universities.json'

const universities = _universities as { id: string; name: string; domains: string[] }[]

function detectUniversity(email: string | null): string | null {
  if (!email) return null
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  const match = universities.find((u) => u.domains.some((d) => domain === d || domain.endsWith(`.${d}`)))
  return match?.name ?? null
}

const FIELD_OPTIONS = [
  'Business & Economics',
  'Computer Science & Engineering',
  'Social Sciences & Humanities',
  'Natural Sciences & Medicine',
  'Law & Political Science',
  'Other',
]

const DEGREE_OPTIONS = ['Bachelor (BSc / BA)', 'Master (MSc / MA)', 'PhD / Doctorate']

export function ProfileSetup() {
  const { profile, thesisNotes, addThesisNote, completeFeature } = useThesisStore()
  const detectedUniversity = detectUniversity(profile.email)

  const [field, setField] = useState('')
  const [degree, setDegree] = useState('')
  const [interest, setInterest] = useState('')
  const [constraints, setConstraints] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const notes: string[] = []
    if (detectedUniversity) notes.push(`My university: ${detectedUniversity}`)
    if (field) notes.push(`My field: ${field}`)
    if (degree) notes.push(`My degree level: ${degree}`)
    if (interest.trim()) notes.push(`My research interest: ${interest.trim()}`)
    if (constraints.trim()) notes.push(`My constraints / situation: ${constraints.trim()}`)

    notes.forEach((n) => addThesisNote(n))
    completeFeature('profile-setup')
    setSaved(true)
  }

  const hasInput = field || degree || interest.trim() || constraints.trim()

  if (saved) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-secondary/30 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground">
            <Check className="size-5 text-background" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="ds-title-sm text-foreground">Profile saved</h2>
            <p className="ds-body mt-1 text-muted-foreground">
              Your Co-Pilot now knows your background and will tailor every answer to your situation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="ds-caption rounded-full border border-border px-4 py-2 text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          >
            Edit profile
          </button>
        </div>

        {thesisNotes.length > 0 && (
          <div className="mt-6">
            <p className="ds-label mb-2 text-muted-foreground">Saved to Co-Pilot Notes</p>
            <div className="flex flex-col gap-2">
              {thesisNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="ds-body text-foreground">{note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-secondary">
          <User className="size-5 text-foreground" />
        </div>
        <h2 className="ds-title-md text-foreground">Thesis Profile</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Tell us about your background. This gets saved to your Co-Pilot Notes so every conversation is tailored to you.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* University — auto-detected from email */}
        <div>
          <label className="ds-label mb-2 block text-foreground">University</label>
          {detectedUniversity ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
              <span className="ds-body text-foreground">{detectedUniversity}</span>
              <span className="ml-auto ds-caption text-muted-foreground/60">detected from email</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-3">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground/40" />
              <span className="ds-body text-muted-foreground/50">
                {profile.email ? `Could not detect university from ${profile.email.split('@')[1]}` : 'No email on file'}
              </span>
            </div>
          )}
        </div>

        {/* Field */}
        <div>
          <label className="ds-label mb-2 block text-foreground">Research field</label>
          <div className="flex flex-wrap gap-2">
            {FIELD_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setField(field === opt ? '' : opt)}
                className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-all ${
                  field === opt
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Degree */}
        <div>
          <label className="ds-label mb-2 block text-foreground">Degree level</label>
          <div className="flex flex-wrap gap-2">
            {DEGREE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDegree(degree === opt ? '' : opt)}
                className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-all ${
                  degree === opt
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Research interest */}
        <div>
          <label className="ds-label mb-2 block text-foreground">
            Research interest <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. I'm interested in sustainable supply chain management, specifically in the textile industry…"
            rows={3}
            className="ds-body w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="ds-label mb-2 block text-foreground">
            Constraints or situation <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="e.g. I need to submit by June 2025, I prefer a company topic with a working-student option, I'm based in Zurich…"
            rows={3}
            className="ds-body w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasInput}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90 disabled:opacity-40"
        >
          Save to Co-Pilot
        </button>
      </div>
    </div>
  )
}
