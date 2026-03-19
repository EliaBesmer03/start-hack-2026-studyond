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
  ChevronDown, ChevronUp, MapPin, Zap, BadgeCheck, Sparkles, Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  topics, supervisors, companies, experts, fields,
  fieldName, companyName,
  type Topic, type Supervisor, type Company,
} from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'
// @ts-ignore
import _universities from '@mock/universities.json'
const _unis = _universities as { id: string; name: string }[]
const uniLogoSrc = (universityId: string) =>
  new URL(`../../../../mock-data/images/${universityId}.svg`, import.meta.url).href
const companyLogoSrc = (companyId: string) =>
  new URL(`../../../../mock-data/images/${companyId}.svg`, import.meta.url).href

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

// ── Field-to-fieldId mapping (onboarding values → mock field IDs) ─────

const FIELD_MATCH_IDS: Record<string, string[]> = {
  business: ['field-04', 'field-05', 'field-06', 'field-07', 'field-13'],
  cs:       ['field-01', 'field-02', 'field-03'],
  social:   ['field-08', 'field-15', 'field-16', 'field-17'],
  science:  ['field-09', 'field-10', 'field-11', 'field-12'],
}

// ── Base match seed data ──────────────────────────────────────────────

interface MatchSeed {
  id: string
  topicId: string
  supervisorId: string
  companyId: string
}

const MATCH_SEEDS: MatchSeed[] = [
  { id: 'm1', topicId: 'topic-01', supervisorId: 'supervisor-03', companyId: 'company-01' },
  { id: 'm2', topicId: 'topic-05', supervisorId: 'supervisor-01', companyId: 'company-03' },
  { id: 'm3', topicId: 'topic-09', supervisorId: 'supervisor-05', companyId: 'company-05' },
  { id: 'm4', topicId: 'topic-13', supervisorId: 'supervisor-07', companyId: 'company-07' },
  { id: 'm5', topicId: 'topic-03', supervisorId: 'supervisor-02', companyId: 'company-02' },
  { id: 'm6', topicId: 'topic-07', supervisorId: 'supervisor-04', companyId: 'company-04' },
  { id: 'm7', topicId: 'topic-11', supervisorId: 'supervisor-06', companyId: 'company-06' },
  { id: 'm8', topicId: 'topic-15', supervisorId: 'supervisor-08', companyId: 'company-08' },
]

/** Compute a match score + personalised reasons based on user profile */
function scoreMatch(
  topic: Topic,
  supervisor: Supervisor | null,
  company: Company | null,
  userFieldIds: string[],
  thesisNotes: string[],
): { score: number; reasons: string[] } {
  let score = 60 // base
  const reasons: string[] = []
  const notesText = thesisNotes.join(' ').toLowerCase()

  // Field overlap: +15 per matching field (max +30)
  const fieldOverlap = topic.fieldIds.filter((f) => userFieldIds.includes(f))
  if (fieldOverlap.length > 0) {
    score += Math.min(fieldOverlap.length * 15, 30)
    const fieldNames = fieldOverlap.map((f) => fieldName(f)).join(' & ')
    reasons.push(`Topic aligns with your ${fieldNames} background.`)
  } else {
    reasons.push(`Cross-disciplinary topic — broadens your research perspective.`)
  }

  // Supervisor research interest overlap with topic fields
  if (supervisor) {
    const supInterests = supervisor.researchInterests.slice(0, 3).join(', ')
    const supFieldOverlap = supervisor.fieldIds?.filter((f) => topic.fieldIds.includes(f)) ?? []
    if (supFieldOverlap.length > 0) {
      score += 8
      reasons.push(`${supervisor.title} ${supervisor.lastName} researches ${supInterests} — directly relevant.`)
    } else {
      reasons.push(`${supervisor.title} ${supervisor.lastName} brings expertise in ${supInterests}.`)
    }
  }

  // Company + employment bonus
  if (company && topic.employment !== 'no') {
    score += 5
    const empLabel = topic.employmentType === 'working_student' ? 'working-student contract'
      : topic.employmentType === 'internship' ? 'internship opportunity'
      : topic.employmentType === 'graduate_program' ? 'graduate programme pathway'
      : 'employment opportunity'
    reasons.push(`${company.name} offers a ${empLabel} alongside this thesis.`)
  } else if (company) {
    reasons.push(`Industry partnership with ${company.name} gives real-world data access.`)
  } else {
    reasons.push(`Academic topic — ideal for research-focused or PhD pathways.`)
  }

  // Notes keyword bonuses
  if (notesText.includes('remote') && topic.workplaceType === 'remote') { score += 4 }
  if (notesText.includes('sustainability') && topic.fieldIds.includes('field-08')) { score += 4 }
  if (notesText.includes('industry') && topic.employment !== 'no') { score += 4 }
  if (notesText.includes('zurich') && topic.workplaceType !== 'remote') { score += 2 }

  // Cap at 97 (never a perfect 100)
  score = Math.min(score, 97)

  return { score, reasons: reasons.slice(0, 3) }
}

/** Build scored match cards from seeds, sorted by relevance to the user */
function buildBaseMatchCards(userFieldAnswer: string | undefined, thesisNotes: string[]): MatchCard[] {
  const userFieldIds = userFieldAnswer ? (FIELD_MATCH_IDS[userFieldAnswer] ?? []) : []

  return MATCH_SEEDS
    .map((seed) => {
      const topic = topics.find((t) => t.id === seed.topicId)
      if (!topic) return null
      const supervisor = supervisors.find((s) => s.id === seed.supervisorId) ?? null
      const company = companies.find((c) => c.id === seed.companyId) ?? null
      const { score, reasons } = scoreMatch(topic, supervisor, company, userFieldIds, thesisNotes)
      return { id: seed.id, topic, supervisor, company, score, reasons, isAiRec: true } as MatchCard
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 4) as MatchCard[]
}

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

  const topicExperts = topic.expertIds
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean) as typeof experts
  const shownExperts = topicExperts.slice(0, 2)
  const remainingCount = topicExperts.length - shownExperts.length

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
              <div className="mb-1.5 flex items-center gap-2">
                <img
                  src={uniLogoSrc(supervisor.universityId)}
                  alt=""
                  className="h-4 w-auto max-w-[64px] object-contain object-left"
                />
              </div>
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
              <div className="mb-1.5 flex items-center gap-2">
                <img
                  src={companyLogoSrc(company.id)}
                  alt=""
                  className="h-4 w-auto max-w-[64px] object-contain object-left"
                />
              </div>
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

      {/* Expert contacts */}
      {shownExperts.length > 0 && (
        <div className="border-t border-border bg-secondary/40 px-5 py-3">
          <p className="ds-caption mb-2 flex items-center gap-1.5 uppercase tracking-[0.12em] text-muted-foreground">
            <Users className="size-3" />
            {topicExperts.length} interview expert{topicExperts.length !== 1 ? 's' : ''} available
          </p>
          <div className="flex flex-col gap-1.5">
            {shownExperts.map((expert) => (
              <p key={expert.id} className="ds-caption flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">{expert.firstName} {expert.lastName}</span>
                · {expert.title} at {companyName(expert.companyId)}
                {expert.offerInterviews && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 ds-badge font-medium text-foreground">
                    Interviews
                  </span>
                )}
              </p>
            ))}
            {remainingCount > 0 && (
              <p className="ds-caption text-muted-foreground/60">
                +{remainingCount} more expert{remainingCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
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
        {isSaved ? (
          <>
            <button
              type="button"
              onClick={() => onRemoveSaved?.(card.id)}
              className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-red-300 hover:text-red-500"
              title="Remove from shortlist"
            >
              <X className="size-4" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-foreground/20 bg-secondary px-5 py-2.5 ds-label text-foreground">
              <Bookmark className="size-4 fill-current" />
              Shortlisted for Final Decision
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAction(card.id, 'skipped')}
              className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              title="Not interested"
            >
              <X className="size-4" />
            </button>
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
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function SmartMatch() {
  const {
    profile, addAcceptedExpert, favouriteTopicIds, thesisNotes,
    shortlistedSupervisorIds, toggleSavedMatch, savedMatchIds, completeFeature, tasks,
  } = useThesisStore()

  const isDone = tasks.some((t) => t.featureId === 'topic-match' && t.status === 'done')
  const userFieldAnswer = profile.answers.find((a) => a.questionIndex === 1)?.value
  const userFieldIds = userFieldAnswer ? (FIELD_MATCH_IDS[userFieldAnswer] ?? []) : []

  // Build match cards: favourite topics × shortlisted supervisors first, then AI recs
  const cards = useMemo<MatchCard[]>(() => {
    const baseCards = buildBaseMatchCards(userFieldAnswer, thesisNotes)

    // 1) Favourite topic + shortlisted supervisor combos
    const combos: MatchCard[] = []
    for (const topicId of favouriteTopicIds) {
      const topic = topics.find((t) => t.id === topicId)
      if (!topic) continue
      if (shortlistedSupervisorIds.length > 0) {
        for (const supId of shortlistedSupervisorIds) {
          const sup = supervisors.find((s) => s.id === supId) ?? null
          const company = topic.companyId ? companies.find((c) => c.id === topic.companyId) ?? null : null
          const { score, reasons } = scoreMatch(topic, sup, company, userFieldIds, thesisNotes)
          // Boost score for user-curated combos
          combos.push({
            id: `combo-${topicId}-${supId}`,
            topic, supervisor: sup, company,
            score: Math.min(score + 5, 97),
            fromFavourite: true,
            reasons: [
              'You bookmarked this topic and shortlisted this supervisor.',
              ...reasons.slice(0, 2),
            ],
          })
        }
      } else {
        // Favourite topic, no supervisors shortlisted yet
        const base = baseCards.find((c) => c.topic.id === topicId)
        const supervisor = base?.supervisor ?? (topic.supervisorIds[0] ? supervisors.find((s) => s.id === topic.supervisorIds[0]) ?? null : null)
        const company = base?.company ?? (topic.companyId ? companies.find((c) => c.id === topic.companyId) ?? null : null)
        const { score, reasons } = scoreMatch(topic, supervisor, company, userFieldIds, thesisNotes)
        combos.push({
          id: `fav-${topicId}`,
          topic, supervisor, company,
          score: Math.min(score + 3, 97),
          fromFavourite: true,
          reasons: [
            'You bookmarked this topic in your exploration phase.',
            ...reasons.slice(0, 2),
          ],
        })
      }
    }

    // 2) AI-generated recs (base cards not already covered by favourites)
    const coveredTopicIds = new Set(favouriteTopicIds)
    const aiRecs = baseCards
      .filter((c) => !coveredTopicIds.has(c.topic.id))
      .sort((a, b) => b.score - a.score)

    return [...combos.sort((a, b) => b.score - a.score), ...aiRecs]
  }, [favouriteTopicIds, shortlistedSupervisorIds, userFieldAnswer, thesisNotes, userFieldIds])

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

      {/* Mark as done */}
      <div className="mt-4">
        {isDone ? (
          <span className="ds-caption inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background">
            <Check className="size-3.5" strokeWidth={2.5} />
            Marked as done
          </span>
        ) : (
          <button
            type="button"
            onClick={() => completeFeature('topic-match')}
            className="ds-caption rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Mark as done
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 mt-5 flex gap-1 rounded-xl bg-secondary p-1">
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
