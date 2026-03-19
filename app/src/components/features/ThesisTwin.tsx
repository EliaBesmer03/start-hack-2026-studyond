/**
 * Feature 2C — Thesis Twin
 *
 * 1:1 peer matching at similar stage + overlapping field.
 * Shared space: mutual deadlines, progress updates, milestone celebrations.
 * No group chats. Expires when both submit. Privacy-first.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Flag, MessageSquare, Plus, Sparkles,
  Target, Trophy, Users,
} from 'lucide-react'
import { students, fields, byId, type Student } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

interface Deadline {
  id: string
  label: string
  date: string
  setBy: 'me' | 'twin'
  done: boolean
}

interface Update {
  id: string
  author: 'me' | 'twin'
  text: string
  timestamp: string
}

interface Milestone {
  id: string
  label: string
  celebrated: boolean
}

// ── Curated twin from mock data ───────────────────────────────────────

// Pick a student who is at a similar stage with overlapping fields
const MY_TWIN: Student = students.find((s) => s.id === 'student-04')! // Elena Rossi, ETH, NLP/ML

// ── Mock shared-space state ───────────────────────────────────────────

const INITIAL_DEADLINES: Deadline[] = [
  { id: 'd1', label: 'Submit research proposal', date: '2026-04-10', setBy: 'twin', done: false },
  { id: 'd2', label: 'Complete literature review', date: '2026-05-01', setBy: 'me', done: false },
  { id: 'd3', label: 'First analysis draft', date: '2026-06-15', setBy: 'me', done: false },
]

const INITIAL_UPDATES: Update[] = [
  {
    id: 'u1', author: 'twin', text: 'Just finished my third interview — really good data coming out of it. Feeling more confident about the methodology.',
    timestamp: '2h ago',
  },
  {
    id: 'u2', author: 'me', text: 'Struggling with my literature review structure. Will try the thematic approach my supervisor suggested.',
    timestamp: '1d ago',
  },
  {
    id: 'u3', author: 'twin', text: 'Submitted the ethics committee form today. One less thing to worry about!',
    timestamp: '3d ago',
  },
]

const INITIAL_MILESTONES: Milestone[] = [
  { id: 'm1', label: 'Topic confirmed', celebrated: true },
  { id: 'm2', label: 'Supervisor agreed', celebrated: true },
  { id: 'm3', label: 'First interview done', celebrated: false },
  { id: 'm4', label: 'Analysis draft ready', celebrated: false },
  { id: 'm5', label: 'Thesis submitted', celebrated: false },
]

// ── Opt-in / not-yet screen ───────────────────────────────────────────

function OptInScreen({ onOptIn }: { onOptIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md text-center"
    >
      <div className="mb-6 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
          <Users className="size-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="ds-title-sm text-foreground">Find your Thesis Twin</h3>
      <p className="ds-body mt-3 text-muted-foreground">
        A Thesis Twin is one student — at a similar stage, in a related field — who you
        check in with throughout your journey. No group chats, no pressure. Just mutual
        accountability and someone who truly gets it.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: Target, label: 'Set mutual deadlines' },
          { icon: MessageSquare, label: 'Share progress privately' },
          { icon: Trophy, label: 'Celebrate milestones' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-xl border border-border bg-background p-3">
            <Icon className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="ds-caption text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <p className="ds-caption mt-5 text-muted-foreground">
        Your thesis content is never shared unless you choose to. The pair expires when both of you submit.
      </p>

      <button
        type="button"
        onClick={onOptIn}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 ds-label text-background transition-all hover:bg-foreground/80"
      >
        <Sparkles className="size-4" />
        Find my Thesis Twin
      </button>
    </motion.div>
  )
}

// ── Match proposal screen ─────────────────────────────────────────────

function MatchProposalScreen({
  twin,
  onAccept,
  onDecline,
}: {
  twin: Student
  onAccept: () => void
  onDecline: () => void
}) {
  const twinFields = twin.fieldIds.slice(0, 2).map((fid) => byId(fields, fid)?.name ?? fid)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-sm"
    >
      <p className="ds-label mb-4 text-center text-muted-foreground">We found your match</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-background hover:shadow-md transition-shadow duration-150">
        {/* Avatar area */}
        <div className="flex flex-col items-center bg-secondary/40 px-6 pb-5 pt-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-foreground text-background ds-title-sm">
            {twin.firstName[0]}{twin.lastName[0]}
          </div>
          <p className="ds-title-cards mt-3 text-foreground">
            {twin.firstName} {twin.lastName}
          </p>
          <p className="ds-small mt-0.5 text-muted-foreground">
            {twin.degree.toUpperCase()} student
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 px-5 py-4">
          <div>
            <p className="ds-caption text-muted-foreground mb-1">Research fields</p>
            <div className="flex flex-wrap gap-1.5">
              {twinFields.map((f) => (
                <span key={f} className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 text-foreground">{f}</span>
              ))}
            </div>
          </div>

          {twin.about && (
            <div>
              <p className="ds-caption text-muted-foreground mb-1">About</p>
              <p className="ds-small text-foreground line-clamp-3">{twin.about}</p>
            </div>
          )}

          <div>
            <p className="ds-caption text-muted-foreground mb-1">Why this match</p>
            <ul className="space-y-1">
              {[
                'Both in the Execution stage within 2 weeks of each other',
                'Overlapping fields: ML / NLP',
                'Similar check-in frequency preference',
              ].map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="ds-small text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-full border border-border py-2 ds-label text-muted-foreground transition-all hover:text-foreground"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-2 ds-label text-background transition-all hover:bg-foreground/80"
          >
            <Check className="size-4" />
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Shared space (active twin) ────────────────────────────────────────

function SharedSpace({ twin }: { twin: Student }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(INITIAL_DEADLINES)
  const [updates, setUpdates] = useState<Update[]>(INITIAL_UPDATES)
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES)
  const [newUpdate, setNewUpdate] = useState('')
  const [newDeadlineLabel, setNewDeadlineLabel] = useState('')
  const [newDeadlineDate, setNewDeadlineDate] = useState('')
  const [addingDeadline, setAddingDeadline] = useState(false)
  const [tab, setTab] = useState<'updates' | 'deadlines' | 'milestones'>('updates')

  const toggleDeadline = (id: string) =>
    setDeadlines((ds) => ds.map((d) => d.id === id ? { ...d, done: !d.done } : d))

  const addUpdate = () => {
    if (!newUpdate.trim()) return
    setUpdates((us) => [
      { id: `u${Date.now()}`, author: 'me', text: newUpdate, timestamp: 'just now' },
      ...us,
    ])
    setNewUpdate('')
  }

  const addDeadline = () => {
    if (!newDeadlineLabel.trim() || !newDeadlineDate) return
    setDeadlines((ds) => [
      ...ds,
      { id: `d${Date.now()}`, label: newDeadlineLabel, date: newDeadlineDate, setBy: 'me', done: false },
    ])
    setNewDeadlineLabel('')
    setNewDeadlineDate('')
    setAddingDeadline(false)
  }

  const celebrateMilestone = (id: string) =>
    setMilestones((ms) => ms.map((m) => m.id === id ? { ...m, celebrated: true } : m))

  return (
    <div className="mx-auto max-w-xl">
      {/* Twin header */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background ds-label">
          {twin.firstName[0]}{twin.lastName[0]}
        </div>
        <div>
          <p className="ds-label text-foreground">
            {twin.firstName} {twin.lastName}
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 ds-badge font-medium text-foreground">Active twin</span>
          </p>
          <p className="ds-caption text-muted-foreground">Execution stage · {twin.degree.toUpperCase()}</p>
        </div>
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 ds-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          Message
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-secondary p-1">
        {(['updates', 'deadlines', 'milestones'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 ds-label capitalize transition-all ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Updates tab */}
        {tab === 'updates' && (
          <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Compose */}
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-background">
              <textarea
                rows={2}
                placeholder="Share a quick progress update with your twin…"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                className="w-full resize-none px-4 pt-3 ds-small text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <div className="flex justify-end border-t border-border px-3 py-2">
                <button
                  type="button"
                  disabled={!newUpdate.trim()}
                  onClick={addUpdate}
                  className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 ds-caption text-background disabled:opacity-40 transition-all hover:bg-foreground/80"
                >
                  <Flag className="size-3" /> Post update
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {updates.map((u) => (
                <div
                  key={u.id}
                  className={`rounded-xl border p-4 ${
                    u.author === 'me'
                      ? 'border-foreground/20 bg-background'
                      : 'border-border bg-secondary/40'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="ds-label text-foreground">
                      {u.author === 'me' ? 'You' : twin.firstName}
                    </span>
                    <span className="ds-caption text-muted-foreground">{u.timestamp}</span>
                  </div>
                  <p className="ds-small text-foreground leading-relaxed">{u.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Deadlines tab */}
        {tab === 'deadlines' && (
          <motion.div key="deadlines" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-2">
              {deadlines.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    d.done ? 'border-border bg-secondary/40 opacity-60' : 'border-border bg-background'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDeadline(d.id)}
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      d.done ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40'
                    }`}
                  >
                    {d.done && <Check className="size-3" strokeWidth={2.5} />}
                  </button>
                  <div className="flex-1">
                    <p className={`ds-label ${d.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {d.label}
                    </p>
                    <p className="ds-caption text-muted-foreground">
                      {d.date} · set by {d.setBy === 'me' ? 'you' : twin.firstName}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add deadline */}
            {addingDeadline ? (
              <div className="mt-3 rounded-xl border border-border bg-background p-4 space-y-2">
                <input
                  type="text"
                  placeholder="Deadline label…"
                  value={newDeadlineLabel}
                  onChange={(e) => setNewDeadlineLabel(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 ds-small text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
                />
                <input
                  type="date"
                  value={newDeadlineDate}
                  onChange={(e) => setNewDeadlineDate(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 ds-small text-foreground focus:border-foreground/30 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAddingDeadline(false)} className="rounded-full border border-border px-3 py-1.5 ds-caption text-muted-foreground">Cancel</button>
                  <button type="button" onClick={addDeadline} className="rounded-full bg-foreground px-3 py-1.5 ds-caption text-background">Add</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingDeadline(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 ds-label text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="size-4" /> Add shared deadline
              </button>
            )}
          </motion.div>
        )}

        {/* Milestones tab */}
        {tab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  m.celebrated ? 'border-border bg-secondary/40' : 'border-border bg-background'
                }`}
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  m.celebrated ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                }`}>
                  {m.celebrated ? <Trophy className="size-4" /> : <Flag className="size-4" />}
                </span>
                <p className={`ds-label flex-1 ${m.celebrated ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {m.label}
                </p>
                {!m.celebrated && (
                  <button
                    type="button"
                    onClick={() => celebrateMilestone(m.id)}
                    className="ds-caption rounded-full border border-border px-3 py-1 text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
                  >
                    Celebrate 🎉
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

type TwinPhase = 'opt-in' | 'proposal' | 'active'

export function ThesisTwin() {
  const { completeFeature } = useThesisStore()
  const [phase, setPhase] = useState<TwinPhase>('opt-in')

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="ds-title-md text-foreground">Thesis Twin</h2>
        {phase === 'opt-in' && (
          <p className="ds-body mt-2 text-muted-foreground">
            One peer. Same stage. Mutual accountability — without the noise.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'opt-in' && (
          <motion.div key="opt-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OptInScreen onOptIn={() => setPhase('proposal')} />
          </motion.div>
        )}
        {phase === 'proposal' && (
          <motion.div key="proposal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MatchProposalScreen
              twin={MY_TWIN}
              onAccept={() => { completeFeature('thesis-twin'); setPhase('active') }}
              onDecline={() => setPhase('opt-in')}
            />
          </motion.div>
        )}
        {phase === 'active' && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SharedSpace twin={MY_TWIN} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
