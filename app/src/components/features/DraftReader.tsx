/**
 * Feature 2D — Draft Feedback Network
 *
 * Student side: specify feedback type, chapter, deadline → get matched with readers.
 * Reader side: experts/alumni toggle availability, fields, max pages, format.
 * Matched via Direct Messaging. Co-Pilot prep tips before sending.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Check, ChevronLeft, ChevronRight,
  FileText, Send, Sparkles, Star,
} from 'lucide-react'
import { experts, companies, fields, byId, type Expert } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

type FeedbackType = 'structure' | 'argumentation' | 'industry_relevance' | 'language'
interface RequestForm {
  chapter: string
  pages: string
  feedbackTypes: FeedbackType[]
  deadline: string
  note: string
}

// ── Feedback type labels ──────────────────────────────────────────────

const FEEDBACK_LABELS: Record<FeedbackType, { label: string; desc: string }> = {
  structure:          { label: 'Structure & flow',       desc: 'Is the argument well-organised and logical?' },
  argumentation:      { label: 'Argumentation',          desc: 'Are claims well-supported and conclusions sound?' },
  industry_relevance: { label: 'Industry relevance',     desc: 'Does it reflect real-world practice accurately?' },
  language:           { label: 'Language & clarity',     desc: 'Is it clearly written and well-phrased?' },
}

// ── Expert reader scoring ─────────────────────────────────────────────

function scorereader(expert: Expert, form: RequestForm): number {
  let score = 30
  const chapterWords = form.chapter.toLowerCase().split(/\s+/)
  const bag = [
    ...(expert.about ?? '').toLowerCase().split(/\s+/),
    ...expert.fieldIds,
    expert.title.toLowerCase(),
  ]
  chapterWords.forEach((w) => { if (w.length > 4 && bag.some((b) => b.includes(w))) score += 12 })
  if (form.feedbackTypes.includes('industry_relevance')) score += 15
  if (expert.offerInterviews) score += 10
  return Math.min(score, 98)
}

// ── Co-Pilot prep tips ────────────────────────────────────────────────

const COPILOT_TIPS = [
  "State your core argument in 2–3 sentences so the reader knows what you're trying to prove.",
  "Mention any specific sections you're unsure about — readers appreciate knowing where to focus.",
  'Ask a concrete question at the end: "Does the transition between section 3 and 4 feel abrupt to you?"',
  "Share your supervisor's last feedback if relevant — it helps the reader avoid conflicting advice.",
]

// ── Request form ──────────────────────────────────────────────────────

function RequestForm({
  form,
  onChange,
  onSubmit,
}: {
  form: RequestForm
  onChange: (f: RequestForm) => void
  onSubmit: () => void
}) {
  const toggleFeedback = (type: FeedbackType) => {
    const has = form.feedbackTypes.includes(type)
    onChange({
      ...form,
      feedbackTypes: has
        ? form.feedbackTypes.filter((t) => t !== type)
        : [...form.feedbackTypes, type],
    })
  }

  const canSubmit = form.chapter.trim().length > 4 && form.pages.trim() && form.deadline && form.feedbackTypes.length > 0

  return (
    <div className="space-y-5">
      {/* Chapter / section */}
      <div>
        <label className="ds-label mb-1.5 block text-foreground">Chapter or section</label>
        <input
          type="text"
          placeholder="e.g. Chapter 3 — Methodology, or the full introduction"
          value={form.chapter}
          onChange={(e) => onChange({ ...form, chapter: e.target.value })}
          className="w-full rounded-xl border border-border px-4 py-2.5 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      {/* Pages */}
      <div>
        <label className="ds-label mb-1.5 block text-foreground">Length (approx. pages)</label>
        <input
          type="number"
          min={1}
          max={100}
          placeholder="e.g. 18"
          value={form.pages}
          onChange={(e) => onChange({ ...form, pages: e.target.value })}
          className="w-full rounded-xl border border-border px-4 py-2.5 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      {/* Feedback types */}
      <div>
        <label className="ds-label mb-2 block text-foreground">What kind of feedback? <span className="text-muted-foreground font-normal">(select all that apply)</span></label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FEEDBACK_LABELS) as FeedbackType[]).map((type) => {
            const { label, desc } = FEEDBACK_LABELS[type]
            const selected = form.feedbackTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFeedback(type)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/30'
                }`}
              >
                <span className="ds-label">{label}</span>
                <span className={`ds-caption leading-snug ${selected ? 'text-background/70' : 'text-muted-foreground'}`}>{desc}</span>
                {selected && <Check className="mt-1 size-3.5 self-end" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="ds-label mb-1.5 block text-foreground">Feedback needed by</label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => onChange({ ...form, deadline: e.target.value })}
          className="w-full rounded-xl border border-border px-4 py-2.5 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
        />
      </div>

      {/* Optional note */}
      <div>
        <label className="ds-label mb-1.5 block text-foreground">
          Note for readers <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="e.g. My supervisor flagged the methodology section — would especially appreciate focus there."
          value={form.note}
          onChange={(e) => onChange({ ...form, note: e.target.value })}
          className="w-full resize-none rounded-xl border border-border px-4 py-2.5 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 ds-label text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
      >
        Find readers <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

// ── Co-Pilot tips panel ───────────────────────────────────────────────

function CoPilotPrep({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-background overflow-hidden"
    >
      <div className="bg-ai px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-white" />
          <span className="ds-label text-white">Co-Pilot: before you send</span>
        </div>
        <p className="ds-small mt-1 text-white/80">
          A few things to include in your draft request — readers find these genuinely helpful.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {COPILOT_TIPS.map((tip, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary ds-caption font-medium text-muted-foreground">
              {i + 1}
            </span>
            <span className="ds-small text-foreground leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-2.5 ds-label text-background transition-all hover:bg-foreground/80"
        >
          Got it — show me readers <ChevronRight className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Reader card ───────────────────────────────────────────────────────

function ReaderCard({
  expert, score, onRequest,
}: {
  expert: Expert; score: number; onRequest: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const company = byId(companies, expert.companyId)
  const expertFields = expert.fieldIds.slice(0, 2).map((fid) => byId(fields, fid)?.name ?? fid)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
              <div className="flex items-center gap-0.5">
                {[...Array(Math.round(score / 20))].map((_, i) => (
                  <Star key={i} className="size-3 fill-foreground text-foreground" />
                ))}
              </div>
            </div>
            <p className="ds-small mt-0.5 text-muted-foreground">{expert.title}</p>
            <p className="ds-caption flex items-center gap-1 mt-1 text-muted-foreground">
              <Building2 className="size-3" />{company?.name}
            </p>
          </div>
          <span className="ds-badge shrink-0 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
            {score}% fit
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {expertFields.map((f) => (
            <span key={f} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{f}</span>
          ))}
        </div>

        {expert.about && (
          <p className={`ds-small mt-3 text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>
            {expert.about}
          </p>
        )}
        {expert.about && expert.about.length > 120 && (
          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
            className="ds-caption mt-1 text-muted-foreground/60 hover:text-muted-foreground"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <div className="flex items-center gap-1.5 ds-caption text-muted-foreground">
          <FileText className="size-3" />
          Prefers {expert.offerInterviews ? 'comments or call' : 'written comments'}
        </div>
        <button
          type="button"
          onClick={() => onRequest(expert.id)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 ds-label text-background transition-all hover:bg-foreground/80"
        >
          <Send className="size-3.5" /> Request review
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

type Phase = 'form' | 'copilot' | 'results'

export function DraftReader() {
  const { completeFeature } = useThesisStore()
  const [phase, setPhase] = useState<Phase>('form')
  const [form, setForm] = useState<RequestForm>({
    chapter: '',
    pages: '',
    feedbackTypes: [],
    deadline: '',
    note: '',
  })
  const [results, setResults] = useState<{ expert: Expert; score: number }[]>([])
  const [requested, setRequested] = useState<Set<string>>(new Set())

  const handleFormSubmit = () => {
    const scored = experts
      .map((e) => ({ expert: e, score: scorereader(e, form) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    setResults(scored)
    setPhase('copilot')
  }

  const handleRequest = (id: string) => {
    completeFeature('draft-reader')
    setRequested((prev) => new Set([...prev, id]))
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="ds-title-md text-foreground">Draft Reader</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Get structured feedback on a chapter from an expert or alumni who has read hundreds
          of theses in your field.
        </p>
      </div>

      {/* Back nav for later phases */}
      {phase !== 'form' && (
        <button
          type="button"
          onClick={() => setPhase(phase === 'results' ? 'copilot' : 'form')}
          className="mb-5 flex items-center gap-1.5 ds-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {phase === 'results' ? 'Back to tips' : 'Edit request'}
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RequestForm form={form} onChange={setForm} onSubmit={handleFormSubmit} />
          </motion.div>
        )}

        {phase === 'copilot' && (
          <motion.div key="copilot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CoPilotPrep onContinue={() => setPhase('results')} />
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="ds-label text-foreground">{results.length} readers matched</p>
              <p className="ds-caption text-muted-foreground">for "{form.chapter}"</p>
            </div>

            {results.map(({ expert, score }) =>
              requested.has(expert.id) ? (
                <div
                  key={expert.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
                    <p className="ds-caption text-muted-foreground">Review request sent via Direct Messaging</p>
                  </div>
                </div>
              ) : (
                <ReaderCard
                  key={expert.id}
                  expert={expert}
                  score={score}
                  onRequest={handleRequest}
                />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
