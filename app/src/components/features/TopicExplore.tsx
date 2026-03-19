/**
 * Feature: Topic Explore
 * Browse available thesis topics from mock data with field filtering.
 */

import { useState } from 'react'
import { Building2, GraduationCap, MapPin, BadgeCheck, Search } from 'lucide-react'
import { topics, companies, fields, companyName, fieldName, type Topic } from '@/data/mock'

interface TopicExploreProps {
  onOpenCoPilot: (prompt?: string) => void
}

function TopicCard({ topic, onAsk }: { topic: Topic; onAsk: (t: Topic) => void }) {
  const company = topic.companyId ? companies.find((c) => c.id === topic.companyId) : null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 hover:shadow-sm hover:border-foreground/20 transition-all duration-150">
      {/* Fields */}
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
        className="ds-caption mt-1 w-fit rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
      >
        Ask Co-Pilot about this topic →
      </button>
    </div>
  )
}

export function TopicExplore({ onOpenCoPilot }: TopicExploreProps) {
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
    const company = topic.companyId ? companyName(topic.companyId) : null
    const prompt = `Tell me more about the thesis topic "${topic.title}"${company ? ` at ${company}` : ''}. What skills does it require and is it a good fit for someone interested in ${topic.fieldIds.map((f) => fieldName(f)).join(' and ')}?`
    onOpenCoPilot(prompt)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="ds-label uppercase tracking-[0.18em] text-muted-foreground">Orientation</p>
        <h2 className="ds-title-md mt-1 text-foreground">Explore Topics</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Browse {topics.length} available thesis topics from partner companies and universities. Click "Ask Co-Pilot" on any topic to get personalised insights.
        </p>
      </div>

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
            className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-all ${
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
                className={`ds-caption rounded-full border px-3 py-1.5 font-medium transition-all ${
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
            <TopicCard key={t.id} topic={t} onAsk={handleAsk} />
          ))}
        </div>
      )}
    </div>
  )
}
