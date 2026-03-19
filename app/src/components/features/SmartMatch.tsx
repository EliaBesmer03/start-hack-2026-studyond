/**
 * Feature 2A — Smart Match Engine
 *
 * Bundled match cards (Topic + Supervisor + Company) with match score,
 * "Why this match?" explanation, and Accept / Skip / Save actions.
 * Pre-loaded with 4 real matches from mock data.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Building2, GraduationCap, Check, X, Bookmark,
  ChevronDown, ChevronUp, MapPin, Zap, BadgeCheck, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  topics, supervisors, companies, experts,
  fieldName, companyName,
  type Topic, type Supervisor, type Company,
} from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

interface MatchCard {
  id: string
  topic: Topic
  supervisor: Supervisor | null
  company: Company | null
  score: number          // 0–100
  reasons: string[]      // 3 bullet "Why this match?" explanations
}

type CardAction = 'accepted' | 'skipped' | 'saved'

// ── Curated match cards from real mock data ───────────────────────────

const MATCH_CARDS: MatchCard[] = [
  {
    id: 'm1',
    topic: topics.find((t) => t.id === 'topic-01')!,
    supervisor: supervisors.find((s) => s.id === 'supervisor-03')!,    // ETH ML supervisor
    company: companies.find((c) => c.id === 'company-01')!,            // Nestlé
    score: 91,
    reasons: [
      'Your Python & ML skills match the forecasting stack Nestlé uses.',
      'Supervisor Prof. Dr. Martin Vechev leads the ETH AI Centre — directly relevant.',
      'You listed "industry access" as a goal; this topic offers a working-student contract.',
    ],
  },
  {
    id: 'm2',
    topic: topics.find((t) => t.id === 'topic-05')!,
    supervisor: supervisors.find((s) => s.id === 'supervisor-01')!,
    company: companies.find((c) => c.id === 'company-03')!,            // ABB
    score: 84,
    reasons: [
      "Control systems and embedded work aligns with ABB's robotics R&D track.",
      "Supervisor's research in autonomous systems directly extends this topic.",
      'Hybrid workplace — keeps flexibility while giving real lab access.',
    ],
  },
  {
    id: 'm3',
    topic: topics.find((t) => t.id === 'topic-09')!,
    supervisor: supervisors.find((s) => s.id === 'supervisor-05')!,
    company: companies.find((c) => c.id === 'company-05')!,            // SBB
    score: 78,
    reasons: [
      "Your interest in sustainability and operations fits SBB's rail infrastructure focus.",
      'Supervisor brings mixed-methods expertise for a sociotechnical study.',
      'Graduate programme pathway included — strong career signal.',
    ],
  },
  {
    id: 'm4',
    topic: topics.find((t) => t.id === 'topic-13')!,
    supervisor: supervisors.find((s) => s.id === 'supervisor-07')!,
    company: companies.find((c) => c.id === 'company-07')!,            // Zurich Insurance
    score: 72,
    reasons: [
      'Risk modelling with ML is a growing demand at Swiss insurers.',
      "Supervisor's actuarial science background complements this applied topic.",
      'Remote-friendly setup suits your current situation.',
    ],
  },
]

// ── Score pill ────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 85 ? 'bg-foreground text-background border-foreground' :
    score >= 70 ? 'bg-foreground/10 text-foreground border-foreground/20' :
                  'bg-secondary text-muted-foreground border-border'
  return (
    <span className={`ds-label flex items-center gap-1 rounded-full border px-3 py-1 ${colour}`}>
      <Zap className="size-3.5" />
      {score}% match
    </span>
  )
}

// ── Employment badge ──────────────────────────────────────────────────

function EmploymentBadge({ topic }: { topic: Topic }) {
  if (topic.employment === 'no') return null
  const label =
    topic.employmentType === 'internship'      ? 'Internship' :
    topic.employmentType === 'working_student' ? 'Working student' :
    topic.employmentType === 'graduate_program'? 'Graduate programme' :
    topic.employmentType === 'direct_entry'    ? 'Direct entry' : 'Employment'
  return (
    <span className="ds-caption flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
      <BadgeCheck className="size-3" />
      {label}{topic.employment === 'open' ? ' (possible)' : ''}
    </span>
  )
}

// ── Individual match card ──────────────────────────────────────────────

function MatchCardView({
  card,
  onAction,
}: {
  card: MatchCard
  onAction: (id: string, action: CardAction) => void
}) {
  const [whyOpen, setWhyOpen] = useState(false)
  const { topic, supervisor, company, score, reasons } = card

  const expertId = topic.expertIds[0]
  const expert = expertId ? experts.find((e) => e.id === expertId) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border border-border bg-background hover:shadow-md transition-shadow duration-150"
    >
      {/* Score bar */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <ScoreBadge score={score} />
        <div className="flex gap-1.5">
          {topic.fieldIds.slice(0, 2).map((fid) => (
            <Badge key={fid} variant="secondary" className="rounded-full ds-caption">
              {fieldName(fid)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="px-5 pt-5 pb-4">
        <p className="ds-caption mb-1 flex items-center gap-1.5 uppercase tracking-[0.16em] text-muted-foreground">
          <GraduationCap className="size-3.5" />
          Topic
        </p>
        <h3 className="ds-title-sm text-foreground">{topic.title}</h3>
        <p className="ds-small mt-2 text-muted-foreground line-clamp-3">{topic.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EmploymentBadge topic={topic} />
          {topic.workplaceType && (
            <span className="ds-caption flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3" />
              {topic.workplaceType === 'on_site' ? 'On-site' : topic.workplaceType === 'hybrid' ? 'Hybrid' : 'Remote'}
            </span>
          )}
          <span className="ds-caption text-muted-foreground">
            {topic.degrees.map((d) => d.toUpperCase()).join(' / ')}
          </span>
        </div>
      </div>

      {/* Supervisor + Company row */}
      <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
        {/* Supervisor */}
        <div className="bg-background px-4 py-3">
          <p className="ds-caption mb-1.5 flex items-center gap-1 uppercase tracking-[0.14em] text-muted-foreground">
            <GraduationCap className="size-3" />
            Supervisor
          </p>
          {supervisor ? (
            <>
              <p className="ds-label text-foreground">
                {supervisor.title} {supervisor.firstName} {supervisor.lastName}
              </p>
              <p className="ds-caption mt-0.5 text-muted-foreground line-clamp-2">
                {supervisor.researchInterests.slice(0, 2).join(' · ')}
              </p>
            </>
          ) : (
            <p className="ds-small text-muted-foreground/60">TBD</p>
          )}
        </div>

        {/* Company */}
        <div className="bg-background px-4 py-3">
          <p className="ds-caption mb-1.5 flex items-center gap-1 uppercase tracking-[0.14em] text-muted-foreground">
            <Building2 className="size-3" />
            {company ? 'Company' : 'Academic'}
          </p>
          {company ? (
            <>
              <p className="ds-label text-foreground">{company.name}</p>
              <p className="ds-caption mt-0.5 text-muted-foreground line-clamp-2">
                {company.domains.slice(0, 2).join(' · ')}
              </p>
            </>
          ) : (
            <p className="ds-small text-muted-foreground/60">University topic</p>
          )}
        </div>
      </div>

      {/* Expert contact */}
      {expert && (
        <div className="border-t border-border bg-secondary/40 px-5 py-3">
          <p className="ds-caption flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="size-3" />
            <span className="font-medium text-foreground">{expert.firstName} {expert.lastName}</span>
            · {expert.title} at {companyName(expert.companyId)}
            {expert.offerInterviews && (
              <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 ds-badge font-medium text-foreground">
                Offers interviews
              </span>
            )}
          </p>
        </div>
      )}

      {/* Why this match */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-secondary/40"
        >
          <span className="ds-label text-muted-foreground">Why this match?</span>
          {whyOpen
            ? <ChevronUp className="size-4 text-muted-foreground" />
            : <ChevronDown className="size-4 text-muted-foreground" />
          }
        </button>
        <AnimatePresence>
          {whyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul className="space-y-2 px-5 pb-4">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <span className="ds-small text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={() => onAction(card.id, 'skipped')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          title="Skip"
        >
          <X className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onAction(card.id, 'saved')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          title="Save for later"
        >
          <Bookmark className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onAction(card.id, 'accepted')}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-all hover:bg-foreground/80"
        >
          <Check className="size-4" />
          Accept match
        </button>
      </div>
    </motion.div>
  )
}

// ── Toast for accepted match ──────────────────────────────────────────

function AcceptedToast({ topic, supervisor, company }: { topic: Topic; supervisor: Supervisor | null; company: Company | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-xl border border-border bg-secondary"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="ds-label text-foreground">Match accepted</p>
          <p className="ds-caption text-muted-foreground">
            We'll propose an intro meeting for "{topic.title}".
          </p>
        </div>
      </div>
      {(supervisor || company) && (
        <div className="border-t border-border bg-secondary/60 px-4 py-2.5">
          <p className="ds-caption text-muted-foreground">
            Next step: Both{' '}
            {supervisor && <span className="font-medium text-foreground">{supervisor.lastName}</span>}
            {supervisor && company && ' and '}
            {company && <span className="font-medium text-foreground">{company.name}</span>}
            {' '}will receive an intro request. A shared context summary will be sent to all parties.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Field mapping from GPS answers ───────────────────────────────────

const FIELD_LABEL: Record<string, string> = {
  business: 'Business & Economics',
  cs: 'Computer Science',
  social: 'Social Sciences',
  science: 'Natural Sciences',
}

// ── Main component ────────────────────────────────────────────────────

export function SmartMatch() {
  const { profile } = useThesisStore()
  const fieldAnswer = profile.answers.find((a) => a.questionIndex === 1)?.value
  const fieldLabel = fieldAnswer ? FIELD_LABEL[fieldAnswer] : null

  // Sort cards by profile relevance: CS/ML fields get higher-scored cards first
  const sortedCards = useMemo(() => {
    if (!fieldAnswer || fieldAnswer === 'not-sure') return MATCH_CARDS
    // CS → ML/AI topics first (m1, m2); Business → m3, m4 first
    if (fieldAnswer === 'cs') return [...MATCH_CARDS].sort((a, b) => b.score - a.score)
    if (fieldAnswer === 'business') return [...MATCH_CARDS].sort((a, b) => a.score - b.score)
    return MATCH_CARDS
  }, [fieldAnswer])

  const [cards] = useState(sortedCards)
  const [actions, setActions] = useState<Record<string, CardAction>>({})
  const [saved, setSaved] = useState<MatchCard[]>([])
  const [tab, setTab] = useState<'matches' | 'saved'>('matches')

  const handleAction = (id: string, action: CardAction) => {
    setActions((prev) => ({ ...prev, [id]: action }))
    if (action === 'saved') {
      const card = cards.find((c) => c.id === id)
      if (card) setSaved((prev) => [...prev, card])
    }
  }

  const activeCards = cards.filter((c) => !actions[c.id] || actions[c.id] === 'saved')
  const dismissed = cards.filter((c) => actions[c.id] === 'skipped' || actions[c.id] === 'accepted')

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <p className="ds-label uppercase tracking-[0.18em] text-muted-foreground">Feature 2A</p>
        <h2 className="ds-title-md mt-1 text-foreground">Smart Match</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Bundled matches — topic, supervisor, and company selected together based on your profile.
          Accept to trigger a three-way intro.
        </p>
        {fieldLabel && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
            <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="ds-caption text-muted-foreground">
              Matches ordered for your <span className="font-medium text-foreground">{fieldLabel}</span> profile
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-secondary p-1">
        {(['matches', 'saved'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 ds-label capitalize transition-all ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'matches' ? `Matches (${activeCards.length})` : `Saved (${saved.length})`}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeCards.map((card) => (
              <div key={card.id}>
                <MatchCardView card={card} onAction={handleAction} />
                {actions[card.id] === 'accepted' && <AcceptedToast topic={card.topic} supervisor={card.supervisor} company={card.company} />}
              </div>
            ))}
          </AnimatePresence>

          {activeCards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="ds-title-sm text-muted-foreground">All caught up</p>
              <p className="ds-small mt-1 text-muted-foreground/60">
                {dismissed.length} matches reviewed · check back tomorrow for new ones.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-4">
          {saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="ds-small text-muted-foreground/60">No saved matches yet.</p>
            </div>
          ) : (
            saved.map((card) => (
              <MatchCardView key={card.id} card={card} onAction={handleAction} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
