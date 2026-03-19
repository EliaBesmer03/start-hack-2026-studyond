/**
 * Feature: Topic Explore
 * Browse available thesis topics from mock data with field filtering.
 * Clicking a topic opens a detail drawer with full info (description, company,
 * expert, supervisor, employment). Students bookmark up to 3 for SmartMatch.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, GraduationCap, MapPin, BadgeCheck, Search, Bookmark,
  CheckCircle2, X, Briefcase, Mail, ExternalLink, ChevronRight,
} from 'lucide-react'
import {
  topics, companies, experts, supervisors, fields,
  companyName, fieldName,
  type Topic, type Company, type Expert, type Supervisor,
} from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'
// @ts-ignore
import _universities from '@mock/universities.json'
const universities = _universities as { id: string; name: string }[]
const uniName = (id: string) => universities.find((u: { id: string }) => u.id === id)?.name ?? id

interface TopicExploreProps {
  onOpenCoPilot: (prompt?: string) => void
}

// ── Employment helpers ────────────────────────────────────────────────

const EMPLOYMENT_LABEL: Record<string, string> = {
  internship: 'Internship',
  working_student: 'Working student',
  graduate_program: 'Graduate programme',
  direct_entry: 'Direct entry',
}

const WORKPLACE_LABEL: Record<string, string> = {
  on_site: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

// ── Topic card (summary) ──────────────────────────────────────────────

function TopicCard({
  topic,
  isFavourite,
  canFavourite,
  onToggleFavourite,
  onOpen,
}: {
  topic: Topic
  isFavourite: boolean
  canFavourite: boolean
  onToggleFavourite: (id: string) => void
  onOpen: (t: Topic) => void
}) {
  const company = topic.companyId ? companies.find((c) => c.id === topic.companyId) : null

  return (
    <div
      className={`group flex cursor-pointer flex-col gap-3 rounded-xl border bg-background p-4 transition-all duration-150 hover:shadow-md ${
        isFavourite ? 'border-foreground/30' : 'border-border hover:border-foreground/20'
      }`}
      onClick={() => onOpen(topic)}
    >
      {/* Fields + bookmark */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {topic.fieldIds.slice(0, 3).map((fid) => (
            <span key={fid} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
              {fieldName(fid)}
            </span>
          ))}
          {topic.degrees.map((d) => (
            <span key={d} className="ds-caption rounded-full border border-border px-2 py-0.5 text-muted-foreground uppercase">
              {d}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavourite(topic.id) }}
          disabled={!isFavourite && !canFavourite}
          title={isFavourite ? 'Remove from favourites' : canFavourite ? 'Add to favourites (max 3)' : 'Max 3 favourites selected'}
          className={`shrink-0 rounded-full border p-1.5 transition-colors disabled:opacity-30 ${
            isFavourite
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          }`}
        >
          <Bookmark className={`size-3 ${isFavourite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Title */}
      <h3 className="ds-label text-foreground leading-snug">{topic.title}</h3>
      <p className="ds-small text-muted-foreground line-clamp-3 leading-relaxed">{topic.description}</p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        {company ? (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Building2 className="size-3" />
            {company.name}
          </span>
        ) : (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <GraduationCap className="size-3" />
            Academic
          </span>
        )}
        {topic.workplaceType && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3" />
            {WORKPLACE_LABEL[topic.workplaceType]}
          </span>
        )}
        {topic.employment !== 'no' && (
          <span className="ds-caption flex items-center gap-1 font-medium text-foreground">
            <BadgeCheck className="size-3" />
            Employment{topic.employment === 'open' ? ' possible' : ''}
          </span>
        )}
      </div>

      {/* Open detail hint */}
      <p className="ds-caption mt-1 flex items-center gap-1 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
        View details
        <ChevronRight className="size-3" />
      </p>
    </div>
  )
}

// ── Topic detail drawer ───────────────────────────────────────────────

function TopicDrawer({
  topic,
  isFavourite,
  canFavourite,
  onToggleFavourite,
  onAsk,
  onClose,
}: {
  topic: Topic
  isFavourite: boolean
  canFavourite: boolean
  onToggleFavourite: (id: string) => void
  onAsk: (t: Topic) => void
  onClose: () => void
}) {
  const company: Company | null = topic.companyId ? companies.find((c) => c.id === topic.companyId) ?? null : null
  const topicExperts: Expert[] = topic.expertIds.map((eid) => experts.find((e) => e.id === eid)).filter(Boolean) as Expert[]
  const topicSupervisors: Supervisor[] = topic.supervisorIds.map((sid) => supervisors.find((s) => s.id === sid)).filter(Boolean) as Supervisor[]

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
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {topic.fieldIds.slice(0, 4).map((fid) => (
                <span key={fid} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                  {fieldName(fid)}
                </span>
              ))}
              {topic.degrees.map((d) => (
                <span key={d} className="ds-caption rounded-full border border-border px-2 py-0.5 text-muted-foreground uppercase">
                  {d}
                </span>
              ))}
            </div>
            <h2 className="ds-title-sm text-foreground leading-snug">{topic.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Employment + workplace badges */}
          {(topic.employment !== 'no' || topic.workplaceType) && (
            <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
              {topic.employment !== 'no' && topic.employmentType && (
                <span className="ds-caption flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 font-medium text-background">
                  <BadgeCheck className="size-3" />
                  {EMPLOYMENT_LABEL[topic.employmentType]}
                  {topic.employment === 'open' ? ' (possible)' : ''}
                </span>
              )}
              {topic.employment !== 'no' && !topic.employmentType && (
                <span className="ds-caption flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 font-medium text-background">
                  <BadgeCheck className="size-3" />
                  Employment possible
                </span>
              )}
              {topic.workplaceType && (
                <span className="ds-caption flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  <MapPin className="size-3" />
                  {WORKPLACE_LABEL[topic.workplaceType]}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <section className="px-5 py-5">
            <p className="ds-caption mb-2 uppercase tracking-[0.14em] text-muted-foreground">About this topic</p>
            <p className="ds-body text-foreground leading-relaxed">{topic.description}</p>
          </section>

          {/* Company section */}
          {company && (
            <section className="border-t border-border px-5 py-5">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <Building2 className="size-3" />
                Company partner
              </p>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="ds-label text-foreground">{company.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {company.domains.map((d) => (
                    <span key={d} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{d}</span>
                  ))}
                  {company.size && (
                    <span className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{company.size} employees</span>
                  )}
                </div>
                {company.description && (
                  <p className="ds-small mt-2.5 text-muted-foreground leading-relaxed">{company.description}</p>
                )}
                {company.about && (
                  <p className="ds-small mt-2 text-muted-foreground/80 leading-relaxed border-t border-border pt-2">{company.about}</p>
                )}
              </div>
            </section>
          )}

          {/* Expert contacts */}
          {topicExperts.length > 0 && (
            <section className="border-t border-border px-5 py-5">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <Briefcase className="size-3" />
                {topicExperts.length === 1 ? 'Contact person' : 'Contact persons'}
              </p>
              <div className="space-y-3">
                {topicExperts.map((expert) => {
                  const expertCompany = companies.find((c) => c.id === expert.companyId)
                  return (
                    <div key={expert.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground ds-badge font-semibold text-background">
                        {expert.firstName[0]}{expert.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
                        <p className="ds-caption text-muted-foreground">
                          {expert.title}{expertCompany ? ` · ${expertCompany.name}` : ''}
                        </p>
                        {expert.about && (
                          <p className="ds-caption mt-1.5 text-muted-foreground/80 leading-snug line-clamp-3">{expert.about}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {expert.offerInterviews && (
                            <span className="ds-caption rounded-full bg-secondary px-2 py-0.5 font-medium text-foreground">
                              Offers interviews
                            </span>
                          )}
                          <a
                            href={`mailto:${expert.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Mail className="size-3" />
                            {expert.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Supervisors */}
          {topicSupervisors.length > 0 && (
            <section className="border-t border-border px-5 py-5">
              <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <GraduationCap className="size-3" />
                {topicSupervisors.length === 1 ? 'Suggested supervisor' : 'Suggested supervisors'}
              </p>
              <div className="space-y-3">
                {topicSupervisors.map((sup) => (
                  <div key={sup.id} className="rounded-xl border border-border bg-background p-3">
                    <p className="ds-label text-foreground">{sup.title} {sup.firstName} {sup.lastName}</p>
                    <p className="ds-caption mt-0.5 text-muted-foreground">{uniName(sup.universityId)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sup.researchInterests.slice(0, 4).map((r, i) => (
                        <span key={i} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{r}</span>
                      ))}
                    </div>
                    {sup.about && (
                      <p className="ds-caption mt-2 text-muted-foreground/80 leading-snug line-clamp-3">{sup.about}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fields */}
          <section className="border-t border-border px-5 py-5">
            <p className="ds-caption mb-2 uppercase tracking-[0.14em] text-muted-foreground">Research fields</p>
            <div className="flex flex-wrap gap-1.5">
              {topic.fieldIds.map((fid) => (
                <span key={fid} className="ds-caption rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  {fieldName(fid)}
                </span>
              ))}
            </div>
          </section>

          {/* Bottom padding */}
          <div className="h-6" />
        </div>

        {/* Action bar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavourite(topic.id) }}
            disabled={!isFavourite && !canFavourite}
            title={isFavourite ? 'Remove from favourites' : canFavourite ? 'Bookmark for Smart Match' : 'Max 3 favourites'}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 ds-label transition-colors disabled:opacity-40 ${
              isFavourite
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            <Bookmark className={`size-4 ${isFavourite ? 'fill-current' : ''}`} />
            {isFavourite ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            type="button"
            onClick={() => onAsk(topic)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ai px-4 py-2.5 ds-label text-background transition-all hover:opacity-90"
          >
            Ask Co-Pilot about this →
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function TopicExplore({ onOpenCoPilot }: TopicExploreProps) {
  const { completeFeature, favouriteTopicIds, toggleFavouriteTopic, tasks } = useThesisStore()
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [openTopic, setOpenTopic] = useState<Topic | null>(null)

  const isDone = tasks.some((t) => t.featureId === 'topic-explore' && t.status === 'done')

  const filteredTopics = topics.filter((t) => {
    const matchesField = !selectedField || t.fieldIds.includes(selectedField)
    const matchesQuery =
      !query.trim() ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
    return matchesField && matchesQuery
  })

  const handleAsk = (topic: Topic) => {
    completeFeature('topic-explore')
    const company = topic.companyId ? companyName(topic.companyId) : null
    const prompt = `Tell me more about the thesis topic "${topic.title}"${company ? ` at ${company}` : ''}. What skills does it require and is it a good fit for someone interested in ${topic.fieldIds.map((f) => fieldName(f)).join(' and ')}?`
    setOpenTopic(null)
    onOpenCoPilot(prompt)
  }

  const canFavourite = favouriteTopicIds.length < 3

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Explore Topics</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {topics.length} available thesis topics from partner companies and universities. Click any topic for details. Bookmark up to 3 favourites — they carry forward into your Smart Match.
        </p>
      </div>

      {/* Mark as done */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <p className="ds-small text-muted-foreground">
          Explored enough topics? Mark this step as complete to move forward.
        </p>
        {isDone ? (
          <span className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background">
            <CheckCircle2 className="size-3.5" />
            Done
          </span>
        ) : (
          <button
            type="button"
            onClick={() => completeFeature('topic-explore')}
            className="ds-caption flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/30 px-3 py-1.5 text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <CheckCircle2 className="size-3.5" />
            Mark as done
          </button>
        )}
      </div>

      {/* Favourites bar */}
      {favouriteTopicIds.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <Bookmark className="size-3.5 shrink-0 fill-current text-foreground" />
          <p className="ds-caption flex-1 text-foreground">
            <span className="font-medium">{favouriteTopicIds.length}/3</span> topic{favouriteTopicIds.length > 1 ? 's' : ''} bookmarked
          </p>
          <div className="flex flex-wrap gap-1.5">
            {favouriteTopicIds.map((id) => {
              const t = topics.find((tp) => tp.id === id)
              return t ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOpenTopic(t)}
                  className="ds-caption rounded-full border border-border bg-background px-2 py-0.5 text-foreground transition-colors hover:border-foreground/30"
                >
                  {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                </button>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics…"
            className="ds-body w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedField(null)}
            className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-colors ${
              !selectedField
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/30'
            }`}
          >
            All ({topics.length})
          </button>
          {fields.slice(0, 8).map((f) => {
            const count = topics.filter((t) => t.fieldIds.includes(f.id)).length
            if (count === 0) return null
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedField(selectedField === f.id ? null : f.id)}
                className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-colors ${
                  selectedField === f.id
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30'
                }`}
              >
                {f.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Topic grid */}
      {filteredTopics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No topics match your filter.</p>
        </div>
      ) : (
        <div className="grid-2-col">
          {filteredTopics.slice(0, 20).map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              isFavourite={favouriteTopicIds.includes(t.id)}
              canFavourite={canFavourite}
              onToggleFavourite={toggleFavouriteTopic}
              onOpen={setOpenTopic}
            />
          ))}
        </div>
      )}

      {/* Topic detail drawer */}
      <AnimatePresence>
        {openTopic && (
          <TopicDrawer
            topic={openTopic}
            isFavourite={favouriteTopicIds.includes(openTopic.id)}
            canFavourite={canFavourite}
            onToggleFavourite={toggleFavouriteTopic}
            onAsk={handleAsk}
            onClose={() => setOpenTopic(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
