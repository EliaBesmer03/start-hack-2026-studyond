/**
 * Feature: Topic Explore
 * Browse available thesis topics from mock data with field filtering.
 * Students can bookmark up to 3 favourite topics for use in SmartMatch.
 */

import { useState } from 'react'
import { Building2, GraduationCap, MapPin, BadgeCheck, Search, Bookmark } from 'lucide-react'
import { topics, companies, fields, companyName, fieldName, type Topic } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

interface TopicExploreProps {
  onOpenCoPilot: (prompt?: string) => void
}

function TopicCard({
  topic,
  onAsk,
  isFavourite,
  canFavourite,
  onToggleFavourite,
}: {
  topic: Topic
  onAsk: (t: Topic) => void
  isFavourite: boolean
  canFavourite: boolean
  onToggleFavourite: (id: string) => void
}) {
  const company = topic.companyId ? companies.find((c) => c.id === topic.companyId) : null

  return (
    <div className={`flex flex-col gap-3 rounded-xl border bg-background p-4 transition-all duration-150 hover:shadow-md ${isFavourite ? 'border-foreground/30' : 'border-border hover:border-foreground/20'}`}>
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
          onClick={() => onToggleFavourite(topic.id)}
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
        {company && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Building2 className="size-3" />
            {company.name}
          </span>
        )}
        {!company && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <GraduationCap className="size-3" />
            Academic
          </span>
        )}
        {topic.workplaceType && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3" />
            {topic.workplaceType === 'on_site' ? 'On-site' : topic.workplaceType === 'hybrid' ? 'Hybrid' : 'Remote'}
          </span>
        )}
        {topic.employment !== 'no' && (
          <span className="ds-caption flex items-center gap-1 text-foreground font-medium">
            <BadgeCheck className="size-3" />
            Employment{topic.employment === 'open' ? ' possible' : ''}
          </span>
        )}
      </div>

      {/* Ask Co-Pilot */}
      <button
        type="button"
        onClick={() => onAsk(topic)}
        className="ds-caption mt-1 w-fit rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        Ask Co-Pilot about this topic →
      </button>
    </div>
  )
}

export function TopicExplore({ onOpenCoPilot }: TopicExploreProps) {
  const { completeFeature, favouriteTopicIds, toggleFavouriteTopic } = useThesisStore()
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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
    onOpenCoPilot(prompt)
  }

  const canFavourite = favouriteTopicIds.length < 3

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Explore Topics</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {topics.length} available thesis topics from partner companies and universities. Bookmark up to 3 favourites — they carry forward into your Smart Match.
        </p>
      </div>

      {/* Favourites bar */}
      {favouriteTopicIds.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <Bookmark className="size-3.5 shrink-0 fill-current text-foreground" />
          <p className="ds-caption flex-1 text-foreground">
            <span className="font-medium">{favouriteTopicIds.length}/3</span> topic{favouriteTopicIds.length > 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {favouriteTopicIds.map((id) => {
              const t = topics.find((tp) => tp.id === id)
              return t ? (
                <span key={id} className="ds-caption rounded-full border border-border bg-background px-2 py-0.5 text-foreground">
                  {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                </span>
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
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="ds-small text-muted-foreground/60">No topics match your filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTopics.slice(0, 20).map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              onAsk={handleAsk}
              isFavourite={favouriteTopicIds.includes(t.id)}
              canFavourite={canFavourite}
              onToggleFavourite={toggleFavouriteTopic}
            />
          ))}
        </div>
      )}
    </div>
  )
}
