/**
 * Feature: Supervisor Search
 * Browse available supervisors from mock data and draft outreach via Co-Pilot.
 * Clicking a card opens a full detail drawer.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, ChevronRight, GraduationCap, Mail, MessageSquare,
  Search, Send, Users, X,
} from 'lucide-react'
import {
  supervisors, students, projects, topics, fieldName, byId,
  type Supervisor, type Student, type ThesisProject,
} from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'
// @ts-ignore
import _universities from '@mock/universities.json'
const universities = _universities as { id: string; name: string; country: string }[]
const uniName = (id: string) => universities.find((u: { id: string }) => u.id === id)?.name ?? id

// ── Helpers ───────────────────────────────────────────────────────────

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

// ── Supervisor card (summary) ─────────────────────────────────────────

function SupervisorCard({
  supervisor, shortlisted, canShortlist, onToggleShortlist, onOpen,
}: {
  supervisor: Supervisor
  shortlisted: boolean
  canShortlist: boolean
  onToggleShortlist: () => void
  onOpen: (s: Supervisor) => void
}) {
  const pastCount = getPastStudents(supervisor.id).length

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-150 hover:border-foreground/20 hover:shadow-md"
      onClick={() => onOpen(supervisor)}
    >
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
              onClick={(e) => { e.stopPropagation(); onToggleShortlist() }}
              disabled={!shortlisted && !canShortlist}
              title={shortlisted ? 'Remove from shortlist' : canShortlist ? 'Add to shortlist (max 3)' : 'Max 3 supervisors shortlisted'}
              className={`flex size-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
                shortlisted
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              <Bookmark className={`size-3.5 ${shortlisted ? 'fill-current' : ''}`} />
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

        {/* About preview */}
        {supervisor.about && (
          <p className="ds-small text-muted-foreground leading-relaxed line-clamp-2">
            {supervisor.about}
          </p>
        )}

        {/* Open hint */}
        <p className="ds-caption flex items-center gap-1 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
          View details <ChevronRight className="size-3" />
        </p>
      </div>
    </div>
  )
}

// ── Supervisor detail drawer ──────────────────────────────────────────

function SupervisorDrawer({
  supervisor,
  shortlisted,
  canShortlist,
  onToggleShortlist,
  onDraftEmail,
  onClose,
}: {
  supervisor: Supervisor
  shortlisted: boolean
  canShortlist: boolean
  onToggleShortlist: () => void
  onDraftEmail: (s: Supervisor) => void
  onClose: () => void
}) {
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const pastStudents = getPastStudents(supervisor.id)
  const supervisorTopics = topics.filter((t) => t.supervisorIds.includes(supervisor.id))

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground ds-title-sm font-semibold text-background">
              {supervisor.firstName[0]}{supervisor.lastName[0]}
            </div>
            <div>
              <h2 className="ds-title-sm text-foreground">
                {supervisor.title} {supervisor.firstName} {supervisor.lastName}
              </h2>
              <p className="ds-body mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                <GraduationCap className="size-4" />
                {uniName(supervisor.universityId)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {supervisor.fieldIds.map((fid) => (
                  <span key={fid} className="ds-caption rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                    {fieldName(fid)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* About */}
          {supervisor.about && (
            <section className="px-6 py-5">
              <p className="ds-caption mb-2 uppercase tracking-[0.14em] text-muted-foreground">About</p>
              <p className="ds-body text-foreground leading-relaxed">{supervisor.about}</p>
            </section>
          )}

          {/* Research interests */}
          <section className="border-t border-border px-6 py-5">
            <p className="ds-caption mb-3 uppercase tracking-[0.14em] text-muted-foreground">Research interests</p>
            <div className="flex flex-wrap gap-2">
              {supervisor.researchInterests.map((r, i) => (
                <span key={i} className="ds-caption rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          </section>

          {/* Open topics */}
          {supervisorTopics.length > 0 && (
            <section className="border-t border-border px-6 py-5">
              <p className="ds-caption mb-3 uppercase tracking-[0.14em] text-muted-foreground">
                Open thesis topics
              </p>
              <div className="space-y-2">
                {supervisorTopics.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-background px-4 py-3">
                    <p className="ds-label text-foreground">{t.title}</p>
                    <p className="ds-small mt-1 text-muted-foreground line-clamp-2 leading-relaxed">{t.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.fieldIds.slice(0, 3).map((fid) => (
                        <span key={fid} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{fieldName(fid)}</span>
                      ))}
                      {t.degrees.map((d) => (
                        <span key={d} className="ds-caption rounded-full border border-border px-2 py-0.5 text-muted-foreground uppercase">{d}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past students */}
          {pastStudents.length > 0 && (
            <section className="border-t border-border px-6 py-5">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <Users className="size-3" />
                {pastStudents.length} student{pastStudents.length > 1 ? 's' : ''} supervised
              </p>
              <div className="space-y-2">
                {pastStudents.map(({ student, project }) => (
                  <div key={student.id} className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground ds-badge font-semibold text-background">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="ds-label text-foreground">{student.firstName} {student.lastName}</p>
                        <span className="ds-badge rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                          {STATE_LABEL[project.state] ?? project.state}
                        </span>
                      </div>
                      <p className="ds-caption mt-0.5 text-muted-foreground line-clamp-1">{project.title}</p>
                      {student.about && (
                        <p className="ds-caption mt-1 text-muted-foreground/70 line-clamp-2 leading-snug">{student.about}</p>
                      )}
                    </div>
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
              <p className="mt-2 ds-caption text-muted-foreground/50">
                Connecting sends a direct message request. Contact details shared only if they accept.
              </p>
            </section>
          )}

          {/* Contact */}
          <section className="border-t border-border px-6 py-5">
            <p className="ds-caption mb-2 uppercase tracking-[0.14em] text-muted-foreground">Contact</p>
            <a
              href={`mailto:${supervisor.email}`}
              className="ds-body flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4 shrink-0" />
              {supervisor.email}
            </a>
          </section>

          <div className="h-6" />
        </div>

        {/* Action bar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleShortlist() }}
            disabled={!shortlisted && !canShortlist}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 ds-label transition-colors disabled:opacity-40 ${
              shortlisted
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <Bookmark className={`size-4 ${shortlisted ? 'fill-current' : ''}`} />
            {shortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80"
          >
            <MessageSquare className="size-4" />
            Send inquiry message
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function SupervisorSearch({ onOpenCoPilot }: SupervisorSearchProps) {
  const { completeFeature, shortlistedSupervisorIds, toggleShortlistedSupervisor } = useThesisStore()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'shortlisted'>('all')
  const [openSupervisor, setOpenSupervisor] = useState<Supervisor | null>(null)

  const shortlisted = new Set(shortlistedSupervisorIds)

  const toggleShortlist = (id: string) => {
    toggleShortlistedSupervisor(id)
    // Complete feature when 3 supervisors are shortlisted
    const newSize = shortlisted.has(id) ? shortlisted.size - 1 : shortlisted.size + 1
    if (newSize === 3) completeFeature('supervisor-search')
  }

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
    setOpenSupervisor(null)
    onOpenCoPilot(prompt)
  }

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Find Supervisors</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {supervisors.length} academic supervisors across Swiss universities. Shortlist up to 3 — they carry forward into your Smart Match. Click any card for full details.
        </p>
        {shortlisted.size > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
            <Bookmark className="size-3.5 shrink-0 fill-current text-foreground" />
            <p className="ds-caption text-foreground">
              <span className="font-medium">{shortlisted.size}/3</span> supervisor{shortlisted.size !== 1 ? 's' : ''} shortlisted — carried forward to Smart Match
            </p>
          </div>
        )}
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

      {/* Grid */}
      {tab === 'shortlisted' && shortlisted.size === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No supervisors shortlisted yet.</p>
          <p className="ds-caption mt-1 text-muted-foreground/40">Bookmark supervisors from the All tab to shortlist them.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No supervisors match your search.</p>
        </div>
      ) : (
        <div className="grid-2-col">
          {filtered.slice(0, 16).map((s) => (
            <SupervisorCard
              key={s.id}
              supervisor={s}
              shortlisted={shortlisted.has(s.id)}
              canShortlist={shortlisted.size < 3}
              onToggleShortlist={() => toggleShortlist(s.id)}
              onOpen={setOpenSupervisor}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {openSupervisor && (
          <SupervisorDrawer
            supervisor={openSupervisor}
            shortlisted={shortlisted.has(openSupervisor.id)}
            canShortlist={shortlisted.size < 3}
            onToggleShortlist={() => toggleShortlist(openSupervisor.id)}
            onDraftEmail={handleDraftEmail}
            onClose={() => setOpenSupervisor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
