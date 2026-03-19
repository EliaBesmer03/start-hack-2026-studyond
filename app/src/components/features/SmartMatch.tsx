/**
 * Smart Match — combined Topic Explore bookmarks + Supervisor shortlist + AI recommendations.
 * Bookmarked topics and shortlisted supervisors appear as combinable matches.
 * AI-generated recommendation cards are shown below.
 *
 * Actions:
 *   X         → Skip (not interested)
 *   Shortlist → Save to Shortlisted tab to revisit before Final Decision
 *
 * Request Intro happens only after the user confirms in the Final Decision step.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Building2, GraduationCap, Check, X, Bookmark,
  ChevronDown, ChevronUp, MapPin, Zap, BadgeCheck, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  topics, supervisors, companies, experts, fields,
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
  score: number
  reasons: string[]
  fromFavourite?: boolean
  isAiRec?: boolean
}

type CardAction = 'skipped' | 'shortlisted'

// ── Base curated match cards ──────────────────────────────────────────

const BASE_MATCH_CARDS: MatchCard[] = [
  {
    id: 'm1',
    topic: topics.find((t) => t.id === 'topic-01')!,
    supervisor: supervisors.find((s) => s.id === 'supervisor-03')!,
    company: companies.find((c) => c.id === 'company-01')!,
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
    company: companies.find((c) => c.id === 'company-03')!,
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
    company: companies.find((c) => c.id === 'company-05')!,
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
    company: companies.find((c) => c.id === 'company-07')!,
    score: 72,
    reasons: [
      'Risk modelling with ML is a growing demand at Swiss insurers.',
      "Supervisor's actuarial science background complements this applied topic.",
      'Remote-friendly setup suits your current situation.',
    ],
  },
]

// ── Score badge ───────────────────────────────────────────────────────

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
    topic.employmentType === 'internship'       ? 'Internship' :
    topic.employmentType === 'working_student'  ? 'Working student' :
    topic.employmentType === 'graduate_program' ? 'Graduate programme' :
    topic.employmentType === 'direct_entry'     ? 'Direct entry' : 'Employment'
  return (
    <span className="ds-caption flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
      <BadgeCheck className="size-3" />
      {label}{topic.employment === 'open' ? ' (possible)' : ''}
    </span>
  )
}

// ── Individual match card ─────────────────────────────────────────────

function MatchCardView({
  card,
  onAction,
  isSaved,
  onRemoveSaved,
}: {
  card: MatchCard
  onAction: (id: string, action: CardAction) => void
  isSaved?: boolean
  onRemoveSaved?: (id: string) => void
}) {
  const [whyOpen, setWhyOpen] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const { topic, supervisor, company, score, reasons } = card

  const expertId = topic.expertIds[0]
  const expert = expertId ? experts.find((e) => e.id === expertId) : null

  const handleShortlist = () => {
    onAction(card.id, 'shortlisted')
    setSaveFlash(true)
  }

  useEffect(() => {
    if (saveFlash) {
      const t = setTimeout(() => setSaveFlash(false), 1200)
      return () => clearTimeout(t)
    }
  }, [saveFlash])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden rounded-xl border border-border bg-background transition-shadow duration-150 hover:shadow-md"
    >
      {/* Score bar */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <ScoreBadge score={score} />
          {card.fromFavourite && (
            <span className="ds-caption flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
              <Bookmark className="size-3 fill-current" />
              Your pick
            </span>
          )}
          {card.isAiRec && (
            <span className="ds-caption flex items-center gap-1 rounded-full border-ai bg-ai px-2 py-0.5 text-white">
              <Sparkles className="size-3" />
              AI rec
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {topic.fieldIds.slice(0, 2).map((fid) => (
            <Badge key={fid} variant="secondary" className="rounded-full ds-caption">
              {fieldName(fid)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="px-5 pb-4 pt-5">
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
        {isSaved && onRemoveSaved ? (
          <button
            type="button"
            onClick={() => onRemoveSaved(card.id)}
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-red-300 hover:text-red-500"
            title="Remove from shortlist"
          >
            <X className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction(card.id, 'skipped')}
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            title="Not interested"
          >
            <X className="size-4" />
          </button>
        )}
        {!isSaved && (
          <button
            type="button"
            onClick={handleShortlist}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full transition-all duration-300 px-5 py-2.5 ds-label ${
              saveFlash
                ? 'bg-foreground text-background scale-105'
                : 'bg-foreground text-background hover:bg-foreground/80'
            }`}
            title="Shortlist for Final Decision"
          >
            <Bookmark className={`size-4 transition-all ${saveFlash ? 'fill-current' : ''}`} />
            {saveFlash ? 'Shortlisted!' : 'Shortlist'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function SmartMatch() {
  const {
    profile, addAcceptedExpert, favouriteTopicIds,
    shortlistedSupervisorIds, toggleSavedMatch, savedMatchIds,
  } = useThesisStore()

  // Build match cards: favourite topics × shortlisted supervisors first, then AI recs
  const cards = useMemo<MatchCard[]>(() => {
    // 1) Favourite topic + shortlisted supervisor combos
    const combos: MatchCard[] = []
    for (const topicId of favouriteTopicIds) {
      const topic = topics.find((t) => t.id === topicId)
      if (!topic) continue
      if (shortlistedSupervisorIds.length > 0) {
        for (const supId of shortlistedSupervisorIds) {
          const sup = supervisors.find((s) => s.id === supId) ?? null
          const company = topic.companyId ? companies.find((c) => c.id === topic.companyId) ?? null : null
          combos.push({
            id: `combo-${topicId}-${supId}`,
            topic,
            supervisor: sup,
            company,
            score: 90,
            fromFavourite: true,
            reasons: [
              'You bookmarked this topic and shortlisted this supervisor.',
              sup ? `${sup.title} ${sup.lastName} researches directly aligned topics.` : 'Supervisor TBD.',
              company ? `${company.name} is looking for thesis students in this area.` : 'Academic topic — strong for PhD pathways.',
            ],
          })
        }
      } else {
        // Favourite topic, no supervisors shortlisted yet
        const base = BASE_MATCH_CARDS.find((c) => c.topic.id === topicId)
        const supervisor = base?.supervisor ?? (topic.supervisorIds[0] ? supervisors.find((s) => s.id === topic.supervisorIds[0]) ?? null : null)
        const company = base?.company ?? (topic.companyId ? companies.find((c) => c.id === topic.companyId) ?? null : null)
        combos.push({
          id: `fav-${topicId}`,
          topic,
          supervisor,
          company,
          score: 88,
          fromFavourite: true,
          reasons: base?.reasons ?? [
            'You bookmarked this topic in your exploration phase.',
            supervisor ? `${supervisor.title} ${supervisor.lastName} researches directly aligned topics.` : 'Supervisor TBD.',
            company ? `${company.name} is looking for thesis students in this area.` : 'Academic topic.',
          ],
        })
      }
    }

    // 2) AI-generated recs (base cards not already covered)
    const coveredTopicIds = new Set(favouriteTopicIds)
    const aiRecs = BASE_MATCH_CARDS
      .filter((c) => !coveredTopicIds.has(c.topic.id))
      .map((c) => ({ ...c, isAiRec: true }))
      .sort((a, b) => b.score - a.score)

    return [...combos.sort((a, b) => b.score - a.score), ...aiRecs]
  }, [favouriteTopicIds, shortlistedSupervisorIds])

  const [actions, setActions] = useState<Record<string, CardAction>>({})
  const [tab, setTab] = useState<'matches' | 'shortlisted'>('matches')

  const shortlistedCards = cards.filter((c) => savedMatchIds.includes(c.id))

  const handleAction = (id: string, action: CardAction) => {
    setActions((prev) => ({ ...prev, [id]: action }))
    if (action === 'shortlisted') {
      toggleSavedMatch(id)
      // Propagate expert IDs to Interview Partners
      const card = cards.find((c) => c.id === id)
      if (card) {
        card.topic.expertIds.forEach((eid) => addAcceptedExpert(eid))
      }
    }
  }

  const handleRemoveShortlisted = (id: string) => {
    toggleSavedMatch(id)
  }

  const activeCards = cards.filter((c) => !actions[c.id] || actions[c.id] === 'shortlisted')
  const dismissed = cards.filter((c) => actions[c.id] === 'skipped')

  const fieldAnswer = profile.answers.find((a) => a.questionIndex === 1)?.value
  const FIELD_LABEL: Record<string, string> = {
    business: 'Business & Economics',
    cs: 'Computer Science',
    social: 'Social Sciences',
    science: 'Natural Sciences',
  }
  const fieldLabel = fieldAnswer ? FIELD_LABEL[fieldAnswer] : null

  const hasFavourites = favouriteTopicIds.length > 0
  const hasSupervisors = shortlistedSupervisorIds.length > 0

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Smart Match</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Bundled matches combining your bookmarked topics, shortlisted supervisors, and AI recommendations.
          <strong className="text-foreground"> Shortlist</strong> to save combinations for your Final Decision step.
          Intro requests are sent automatically once you confirm your final choice.
        </p>
        {fieldLabel && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-ai bg-secondary px-3 py-2">
            <Sparkles className="size-3.5 shrink-0 text-ai-solid" />
            <p className="ds-caption text-muted-foreground">
              Personalised for your <span className="font-medium text-foreground">{fieldLabel}</span> profile
            </p>
          </div>
        )}

        {/* Inputs summary */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`ds-caption flex items-center gap-1 rounded-full border px-2.5 py-1 ${hasFavourites ? 'border-foreground/30 text-foreground' : 'border-border text-muted-foreground/50'}`}>
            <Bookmark className={`size-3 ${hasFavourites ? 'fill-current' : ''}`} />
            {favouriteTopicIds.length} topic{favouriteTopicIds.length !== 1 ? 's' : ''} bookmarked
          </span>
          <span className={`ds-caption flex items-center gap-1 rounded-full border px-2.5 py-1 ${hasSupervisors ? 'border-foreground/30 text-foreground' : 'border-border text-muted-foreground/50'}`}>
            <GraduationCap className="size-3" />
            {shortlistedSupervisorIds.length} supervisor{shortlistedSupervisorIds.length !== 1 ? 's' : ''} shortlisted
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-secondary p-1">
        {(['matches', 'shortlisted'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 ds-label capitalize transition-colors ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'matches' ? `Matches (${activeCards.length})` : `Shortlisted (${shortlistedCards.length})`}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="space-y-4">
          {/* Section: Your combos */}
          {cards.filter((c) => c.fromFavourite).length > 0 && (
            <div className="mb-1">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <Bookmark className="size-3 fill-current" />
                Your combinations
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {activeCards.filter((c) => c.fromFavourite).map((card) => (
              <div key={card.id}>
                <MatchCardView card={card} onAction={handleAction} isSaved={savedMatchIds.includes(card.id)} />
              </div>
            ))}
          </AnimatePresence>

          {/* Section: AI recommendations */}
          {activeCards.filter((c) => c.isAiRec).length > 0 && (
            <div className="mt-6">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-ai-solid">
                <Sparkles className="size-3" />
                AI recommendations
              </p>
              <AnimatePresence mode="popLayout">
                {activeCards.filter((c) => c.isAiRec).map((card) => (
                  <div key={card.id} className="mb-4">
                    <MatchCardView card={card} onAction={handleAction} isSaved={savedMatchIds.includes(card.id)} />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {activeCards.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="ds-title-sm text-muted-foreground">All caught up</p>
              <p className="ds-small mt-1 text-muted-foreground/60">
                {dismissed.length} matches reviewed · check back tomorrow for new ones.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'shortlisted' && (
        <div className="space-y-4">
          {shortlistedCards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="ds-small text-muted-foreground/60">No matches shortlisted yet.</p>
              <p className="ds-caption mt-1 text-muted-foreground/40">
                Click "Shortlist" on a match to save it here for Final Decision.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="ds-caption text-muted-foreground">
                  These are saved for your <span className="font-medium text-foreground">Final Decision</span> step.
                  Remove any you've changed your mind about.
                </p>
              </div>
              {shortlistedCards.map((card) => (
                <MatchCardView
                  key={card.id}
                  card={card}
                  onAction={handleAction}
                  isSaved
                  onRemoveSaved={handleRemoveShortlisted}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
