/**
 * Feature: Supervisor Search
 * Browse available supervisors from mock data and draft outreach via Co-Pilot.
 */

import { useState } from 'react'
import { GraduationCap, Mail, Search } from 'lucide-react'
import { supervisors, fieldName, type Supervisor } from '@/data/mock'
// @ts-ignore
import _universities from '@mock/universities.json'
const universities = _universities as { id: string; name: string; country: string }[]
const uniName = (id: string) => universities.find((u: { id: string; name: string }) => u.id === id)?.name ?? id

interface SupervisorSearchProps {
  onOpenCoPilot: (prompt?: string) => void
}

function SupervisorCard({ supervisor, onDraftEmail }: { supervisor: Supervisor; onDraftEmail: (s: Supervisor) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 hover:shadow-sm hover:border-foreground/20 transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="ds-label text-foreground">
            {supervisor.title} {supervisor.firstName} {supervisor.lastName}
          </h3>
          <p className="ds-caption mt-0.5 flex items-center gap-1 text-muted-foreground">
            <GraduationCap className="size-3" />
            {uniName(supervisor.universityId)}
          </p>
        </div>
      </div>

      {/* Research interests */}
      <div className="flex flex-wrap gap-1.5">
        {supervisor.researchInterests.slice(0, 4).map((interest, i) => (
          <span key={i} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
            {interest}
          </span>
        ))}
      </div>

      {/* Fields */}
      {supervisor.fieldIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {supervisor.fieldIds.slice(0, 3).map((fid) => (
            <span key={fid} className="ds-caption rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {fieldName(fid)}
            </span>
          ))}
        </div>
      )}

      {/* About (expandable) */}
      {supervisor.about && (
        <div>
          <p className={`ds-small text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {supervisor.about}
          </p>
          {supervisor.about.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded((o) => !o)}
              className="ds-caption mt-1 text-muted-foreground hover:text-foreground"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Action */}
      <button
        type="button"
        onClick={() => onDraftEmail(supervisor)}
        className="ds-caption mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
      >
        <Mail className="size-3" />
        Draft outreach email →
      </button>
    </div>
  )
}

export function SupervisorSearch({ onOpenCoPilot }: SupervisorSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = supervisors.filter((s) => {
    const q = query.toLowerCase()
    return (
      !q ||
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.researchInterests.some((r) => r.toLowerCase().includes(q)) ||
      s.fieldIds.some((fid) => fieldName(fid).toLowerCase().includes(q))
    )
  })

  const handleDraftEmail = (s: Supervisor) => {
    const prompt = `Help me write a cold outreach email to Professor ${s.lastName} at ${uniName(s.universityId)}. Their research interests are: ${s.researchInterests.slice(0, 3).join(', ')}. I want to ask if they'd be willing to supervise my thesis. Keep it concise, professional, and personalised.`
    onOpenCoPilot(prompt)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="ds-label uppercase tracking-[0.18em] text-muted-foreground">Topic & Supervisor</p>
        <h2 className="ds-title-md mt-1 text-foreground">Find Supervisors</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {supervisors.length} academic supervisors across Swiss universities. Click "Draft outreach email" to get a personalised cold email from your Co-Pilot.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, research interest, or field…"
          className="ds-body w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      {/* Supervisor grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No supervisors match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.slice(0, 16).map((s) => (
            <SupervisorCard key={s.id} supervisor={s} onDraftEmail={handleDraftEmail} />
          ))}
        </div>
      )}
    </div>
  )
}
