/**
 * Feature: Interview Partners
 * Experts matched in SmartMatch appear pre-populated at the top.
 * Additional experts can be found via the 3-step guided flow.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Building2, Check, Send,
  Video, Mic, FileText, ChevronLeft, Sparkles,
} from 'lucide-react'
import { experts, companies, fields, byId, type Expert } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

type InterviewFormat = 'remote' | 'in-person' | 'async'

interface Answers {
  topic: string
  expertise: string
  format: InterviewFormat | null
}

// ── Expert match scoring ──────────────────────────────────────────────

function scoreExpert(expert: Expert, answers: Answers): number {
  let score = 0
  const topicWords = answers.topic.toLowerCase().split(/\s+/)
  const expertWords = [
    ...(expert.about ?? '').toLowerCase().split(/\s+/),
    ...expert.fieldIds,
    expert.title.toLowerCase(),
  ]
  topicWords.forEach((w) => { if (w.length > 3 && expertWords.some((e) => e.includes(w))) score += 15 })

  const expertiseWords = answers.expertise.toLowerCase().split(/\s+/)
  expertiseWords.forEach((w) => { if (w.length > 3 && expertWords.some((e) => e.includes(w))) score += 12 })

  if (expert.offerInterviews) score += 25
  if (answers.format === 'async' || answers.format === 'remote') score += 10

  return Math.min(score, 99)
}

// ── Pre-written outreach message ──────────────────────────────────────

function buildOutreach(expert: Expert, answers: Answers): string {
  const company = byId(companies, expert.companyId)
  return `Hi ${expert.firstName},

I'm a thesis student researching "${answers.topic}". I'm looking for practitioners with expertise in ${answers.expertise} to speak with for my primary research.

I came across your profile through Studyond — your work at ${company?.name ?? 'your company'} on ${expert.title.toLowerCase()} seems directly relevant to what I'm investigating.

Would you be open to a ${answers.format === 'async' ? 'short async Q&A (written)' : answers.format === 'remote' ? '30-minute video call' : 'brief in-person conversation'}? I'd be happy to share my research brief beforehand.

Best regards`
}

// ── Question step component ───────────────────────────────────────────

function QuestionStep({
  step, total, title, children,
}: {
  step: number; total: number; title: string; children: React.ReactNode
}) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i < step ? 'w-8 bg-foreground' : i === step - 1 ? 'w-8 bg-foreground' : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>
        <span className="ds-caption text-muted-foreground">{step} / {total}</span>
      </div>

      <h3 className="ds-title-sm mb-4 text-foreground">{title}</h3>
      {children}
    </motion.div>
  )
}

// ── Expert card ───────────────────────────────────────────────────────

function ExpertCard({
  expert, score, answers, onConnect, sent, preMatched,
}: {
  expert: Expert
  score: number
  answers: Answers
  onConnect: (id: string) => void
  sent: boolean
  preMatched?: boolean
}) {
  const [showMessage, setShowMessage] = useState(false)
  const company = byId(companies, expert.companyId)
  const message = buildOutreach(expert, answers)
  const expertFields = expert.fieldIds.slice(0, 2).map((fid) => byId(fields, fid)?.name ?? fid)

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
          <p className="ds-caption text-muted-foreground">Request sent via Direct Messaging</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-background"
    >
      <div className="flex items-start justify-between px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="ds-label text-foreground">
              {expert.firstName} {expert.lastName}
            </p>
            {expert.offerInterviews && (
              <span className="rounded-full bg-secondary px-2 py-0.5 ds-badge font-medium text-foreground">
                Open to interviews
              </span>
            )}
            {preMatched && (
              <span className="rounded-full bg-secondary px-2 py-0.5 ds-badge font-medium text-foreground flex items-center gap-1">
                <Sparkles className="size-2.5" />
                Matched
              </span>
            )}
          </div>
          <p className="ds-small mt-0.5 text-muted-foreground">{expert.title}</p>
          <p className="ds-caption mt-1 flex items-center gap-1 text-muted-foreground">
            <Building2 className="size-3" />
            {company?.name}
          </p>
        </div>
        <span className="ds-badge rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
          {score}% fit
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {expertFields.map((f) => (
          <span key={f} className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">
            {f}
          </span>
        ))}
      </div>

      {expert.about && (
        <p className="ds-small border-t border-border px-4 py-3 text-muted-foreground line-clamp-2">
          {expert.about}
        </p>
      )}

      {showMessage && (
        <div className="border-t border-border bg-secondary/30 px-4 py-3">
          <p className="ds-caption mb-2 font-medium text-muted-foreground">Suggested outreach message</p>
          <pre className="ds-small whitespace-pre-wrap font-sans text-foreground leading-relaxed">
            {message}
          </pre>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setShowMessage((o) => !o)}
          className="ds-caption flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <FileText className="size-3" />
          {showMessage ? 'Hide message' : 'See message'}
        </button>
        <button
          type="button"
          onClick={() => onConnect(expert.id)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 ds-label text-background transition-colors hover:bg-foreground/80"
        >
          <Send className="size-3.5" />
          Send request
        </button>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function InterviewPartners() {
  const { completeFeature, acceptedExpertIds } = useThesisStore()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Answers>({ topic: '', expertise: '', format: null })
  const [results, setResults] = useState<{ expert: Expert; score: number }[] | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  // Experts pre-matched from SmartMatch
  const preMatchedExperts = acceptedExpertIds
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean) as Expert[]

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1)
    } else {
      const scored = experts
        .filter((e) => !acceptedExpertIds.includes(e.id)) // exclude pre-matched
        .filter((e) => e.offerInterviews || Math.random() > 0.3)
        .map((e) => ({ expert: e, score: scoreExpert(e, answers) }))
        .filter((r) => r.score > 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      setResults(scored)
      setStep(4)
    }
  }

  const canAdvance =
    step === 1 ? answers.topic.trim().length > 8 :
    step === 2 ? answers.expertise.trim().length > 4 :
    step === 3 ? answers.format !== null : false

  const handleConnect = (id: string) => {
    completeFeature('interview-partners')
    setSent((prev) => new Set([...prev, id]))
  }

  const defaultAnswers: Answers = { topic: 'thesis research', expertise: 'industry expertise', format: 'remote' }

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="ds-title-md text-foreground">Interview Partners</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Connect with industry experts for primary research interviews.
          {preMatchedExperts.length > 0 && ' Experts from your Smart Match are ready to contact.'}
        </p>
      </div>

      {/* Pre-matched experts from SmartMatch */}
      {preMatchedExperts.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-3.5 text-muted-foreground" />
            <p className="ds-label text-foreground">From your Smart Match</p>
          </div>
          <div className="space-y-3">
            {preMatchedExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                score={90}
                answers={defaultAnswers}
                onConnect={handleConnect}
                sent={sent.has(expert.id)}
                preMatched
              />
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <p className="ds-label mb-1 text-foreground">Find additional experts</p>
            <p className="ds-small text-muted-foreground">Describe your research to get matched with more interview partners.</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <QuestionStep key="q1" step={1} total={3} title="What is your thesis research about?">
            <textarea
              rows={3}
              placeholder="e.g. AI-driven demand forecasting for perishable goods in retail supply chains…"
              value={answers.topic}
              onChange={(e) => setAnswers((a) => ({ ...a, topic: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
            <button
              type="button"
              disabled={!canAdvance}
              onClick={handleNext}
              className="mt-4 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
            >
              Next <ArrowRight className="size-4" />
            </button>
          </QuestionStep>
        )}

        {step === 2 && (
          <QuestionStep key="q2" step={2} total={3} title="What type of expertise are you looking for?">
            <textarea
              rows={2}
              placeholder="e.g. supply chain operations, machine learning applications in logistics…"
              value={answers.expertise}
              onChange={(e) => setAnswers((a) => ({ ...a, expertise: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 rounded-full border border-border px-4 py-2 ds-label text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                disabled={!canAdvance}
                onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
              >
                Next <ArrowRight className="size-4" />
              </button>
            </div>
          </QuestionStep>
        )}

        {step === 3 && (
          <QuestionStep key="q3" step={3} total={3} title="Preferred interview format?">
            <div className="flex flex-col gap-3">
              {(
                [
                  { id: 'remote' as InterviewFormat, label: 'Video call (remote)', icon: Video, desc: '30–45 min, Zoom or Teams' },
                  { id: 'in-person' as InterviewFormat, label: 'In-person', icon: Mic, desc: 'At their office or a neutral location' },
                  { id: 'async' as InterviewFormat, label: 'Async (written Q&A)', icon: FileText, desc: 'Send questions, they respond in writing' },
                ] as const
              ).map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, format: id }))}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
                    answers.format === id
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-foreground/30'
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  <div>
                    <p className="ds-label">{label}</p>
                    <p className={`ds-caption ${answers.format === id ? 'text-background/70' : 'text-muted-foreground'}`}>{desc}</p>
                  </div>
                  {answers.format === id && <Check className="ml-auto size-4 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 rounded-full border border-border px-4 py-2 ds-label text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                disabled={!canAdvance}
                onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
              >
                Find partners <ArrowRight className="size-4" />
              </button>
            </div>
          </QuestionStep>
        )}

        {step === 4 && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="ds-label text-foreground">{results.length} additional experts matched</p>
              <button
                type="button"
                onClick={() => { setStep(1); setResults(null); setAnswers({ topic: '', expertise: '', format: null }) }}
                className="ds-caption text-muted-foreground transition-colors hover:text-foreground"
              >
                Start over
              </button>
            </div>

            <div className="space-y-3">
              {results.map(({ expert, score }) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  score={score}
                  answers={answers}
                  onConnect={handleConnect}
                  sent={sent.has(expert.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
