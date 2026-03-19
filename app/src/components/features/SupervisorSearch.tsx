/**
 * Feature: Supervisor Search
 * Browse available supervisors from mock data and draft outreach via Co-Pilot.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, ChevronDown, ChevronUp, GraduationCap, Mail, MessageSquare, Search, Send, Users } from 'lucide-react'
import { supervisors, students, projects, fieldName, byId, type Supervisor, type Student, type ThesisProject } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'
// @ts-ignore
import _universities from '@mock/universities.json'
const universities = _universities as { id: string; name: string; country: string }[]
const uniName = (id: string) => universities.find((u: { id: string; name: string }) => u.id === id)?.name ?? id

// Projects that have a supervisor assigned (agreed, in_progress, or completed)
const ACTIVE_STATES = new Set(['agreed', 'in_progress', 'completed'])

function getPastStudents(supervisorId: string): { student: Student; project: ThesisProject }[] {
  return projects
    .filter((p) => ACTIVE_STATES.has(p.state) && p.supervisorIds.includes(supervisorId))
    .map((p) => {
      const student = byId(students, p.studentId)
      return student ? { student, project: p } : null
    })
    .filter(Boolean) as { student: Student; project: ThesisProject }[]
}

const STATE_LABEL: Record<string, string> = {
  agreed: 'Starting soon',
  in_progress: 'In progress',
  completed: 'Completed',
}

interface SupervisorSearchProps {
  onOpenCoPilot: (prompt?: string) => void
}

// ── Bookmark icon ─────────────────────────────────────────────────────

function BookmarkIcon({ shortlisted }: { shortlisted: boolean }) {
  return shortlisted
    ? <Bookmark className="size-3.5 fill-current" />
    : <Bookmark className="size-3.5" />
}

// ── Past students panel ───────────────────────────────────────────────

function PastStudentsPanel({ supervisor }: { supervisor: Supervisor }) {
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const entries = getPastStudents(supervisor.id)

  if (entries.length === 0) return null

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-secondary/40"
      >
        <span className="ds-caption flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3" />
          {entries.length} student{entries.length > 1 ? 's' : ''} worked with this supervisor
        </span>
        {open
          ? <ChevronUp className="size-3.5 text-muted-foreground" />
          : <ChevronDown className="size-3.5 text-muted-foreground" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border border-t border-border">
              {entries.map(({ student, project }) => (
                <div key={student.id} className="flex items-start gap-3 bg-secondary/30 px-4 py-3">
                  {/* Avatar */}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground ds-badge font-semibold text-background">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="ds-label text-foreground">
                        {student.firstName} {student.lastName}
                      </p>
                      <span className="ds-badge rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                        {STATE_LABEL[project.state] ?? project.state}
                      </span>
                    </div>
                    <p className="ds-caption mt-0.5 text-muted-foreground line-clamp-1">
                      {project.title}
                    </p>
                    {student.about && (
                      <p className="ds-caption mt-1 text-muted-foreground/70 line-clamp-2 leading-snug">
                        {student.about}
                      </p>
                    )}
                  </div>

                  {/* Connect */}
                  <div className="shrink-0">
                    {connected.has(student.id) ? (
                      <span className="ds-caption flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="size-3" />
                        Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConnected((prev) => new Set([...prev, student.id]))}
                        className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background transition-colors hover:bg-foreground/80"
                      >
                        <Send className="size-3" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 px-4 pb-3">
              <p className="ds-caption text-muted-foreground/60">
                Connecting sends a direct message request. Their contact details are only shared if they accept.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Supervisor card ───────────────────────────────────────────────────

function SupervisorCard({
  supervisor, shortlisted, onToggleShortlist, onDraftEmail,
}: {
  supervisor: Supervisor
  shortlisted: boolean
  onToggleShortlist: () => void
  onDraftEmail: (s: Supervisor) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pastCount = getPastStudents(supervisor.id).length

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow duration-150 hover:shadow-md hover:border-foreground/20">
      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="ds-label text-foreground">
              {supervisor.title} {supervisor.firstName} {supervisor.lastName}
            </h3>
            <p className="ds-caption mt-0.5 flex items-center gap-1 text-muted-foreground">
              <GraduationCap className="size-3" />
              {uniName(supervisor.universityId)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pastCount > 0 && (
              <span className="ds-badge rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                {pastCount} student{pastCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleShortlist}
              title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className={`flex size-7 items-center justify-center rounded-full border transition-colors ${
                shortlisted
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              <BookmarkIcon shortlisted={shortlisted} />
            </button>
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
          className="ds-caption mt-1 flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Mail className="size-3" />
          Draft outreach email →
        </button>
      </div>

      {/* Past students panel */}
      <PastStudentsPanel supervisor={supervisor} />
    </div>
  )
}

export function SupervisorSearch({ onOpenCoPilot }: SupervisorSearchProps) {
  const { completeFeature } = useThesisStore()
  const [query, setQuery] = useState('')
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'all' | 'shortlisted'>('all')

  const toggleShortlist = (id: string) =>
    setShortlisted((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const pool = tab === 'shortlisted'
    ? supervisors.filter((s) => shortlisted.has(s.id))
    : supervisors

  const filtered = pool.filter((s) => {
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
    completeFeature('supervisor-search')
    const prompt = `Help me write a cold outreach email to Professor ${s.lastName} at ${uniName(s.universityId)}. Their research interests are: ${s.researchInterests.slice(0, 3).join(', ')}. I want to ask if they'd be willing to supervise my thesis. Keep it concise, professional, and personalised.`
    onOpenCoPilot(prompt)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Find Supervisors</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {supervisors.length} academic supervisors across Swiss universities. Shortlist the ones you like, then connect with students who have already worked with them.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-secondary p-1">
        {(['all', 'shortlisted'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 ds-label capitalize transition-colors ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'all' ? `All (${supervisors.length})` : `Shortlisted (${shortlisted.size})`}
          </button>
        ))}
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

      {/* Empty state */}
      {tab === 'shortlisted' && shortlisted.size === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No supervisors shortlisted yet.</p>
          <p className="ds-caption mt-1 text-muted-foreground/40">Bookmark supervisors from the All tab to shortlist them.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No supervisors match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.slice(0, 16).map((s) => (
            <SupervisorCard
              key={s.id}
              supervisor={s}
              shortlisted={shortlisted.has(s.id)}
              onToggleShortlist={() => toggleShortlist(s.id)}
              onDraftEmail={handleDraftEmail}
            />
          ))}
        </div>
      )}
    </div>
  )
}
