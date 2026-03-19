import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import { STAGES } from '@/types/thesis'
import type { ThesisStage } from '@/types/thesis'
import logo from '@/assets/studyond.svg'

/* ── Feature entry points per stage ───────────────────────────────── */

export type FeatureId =
  | 'topic-explore'
  | 'profile-setup'
  | 'topic-match'
  | 'smart-match'
  | 'supervisor-search'
  | 'copilot-planning'
  | 'methodology'
  | 'copilot-execution'
  | 'interview-partners'
  | 'thesis-twin'
  | 'copilot-writing'
  | 'draft-reader'

export interface FeatureItem {
  id: FeatureId
  label: string
  description: string
}

const STAGE_FEATURES: Record<ThesisStage, FeatureItem[]> = {
  orientation: [
    { id: 'profile-setup',   label: 'Thesis Profile',   description: 'Set up your interests, field, and constraints' },
    { id: 'topic-explore',   label: 'Explore Topics',   description: 'Browse curated topics and company briefs' },
  ],
  'topic-discovery': [
    { id: 'topic-match',      label: 'Topic Match',       description: 'Get AI-matched topics based on your profile' },
    { id: 'smart-match',      label: 'Smart Match',       description: 'Bundled topic + supervisor + company matches' },
    { id: 'supervisor-search', label: 'Find Supervisors', description: 'Search and reach out to supervisors' },
  ],
  'supervisor-search': [
    { id: 'copilot-planning', label: 'Planning Co-Pilot', description: 'AI guidance on methodology and proposal' },
    { id: 'methodology',      label: 'Methodology Guide', description: 'Qualitative vs. quantitative decision support' },
  ],
  planning: [
    { id: 'copilot-execution',  label: 'Execution Co-Pilot',  description: 'AI help with research and data collection' },
    { id: 'interview-partners', label: 'Interview Partners',   description: 'Find and schedule expert interviews' },
    { id: 'thesis-twin',        label: 'Thesis Twin',         description: 'Peer accountability — one student, same stage' },
  ],
  'execution-writing': [
    { id: 'copilot-writing', label: 'Writing Co-Pilot', description: 'Draft support, feedback integration' },
    { id: 'draft-reader',    label: 'Draft Reader',     description: 'Request an expert to review your draft' },
  ],
}

const STAGE_TIME: Record<ThesisStage, string> = {
  orientation:         '1–2 weeks',
  'topic-discovery':   '2–4 weeks',
  'supervisor-search': '2–3 weeks',
  planning:            '8–16 weeks',
  'execution-writing': '4–8 weeks',
}

/* ── Props ─────────────────────────────────────────────────────────── */

interface JourneyMapSidebarProps {
  activeFeature: FeatureId | null
  onFeatureSelect: (id: FeatureId) => void
  onReset: () => void
}

/* ── Component ─────────────────────────────────────────────────────── */

export function JourneyMapSidebar({ activeFeature, onFeatureSelect, onReset }: JourneyMapSidebarProps) {
  const { profile } = useThesisStore()
  const currentStage = profile.stage ?? 'orientation'
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage)

  // Expanded state: current stage open by default
  const [expanded, setExpanded] = useState<Set<ThesisStage>>(new Set([currentStage]))

  const toggleExpand = (id: ThesisStage) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-background">
      {/* Logo + wordmark */}
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <img src={logo} alt="Studyond" className="h-5 w-auto" />
      </div>

      {/* Scrollable stage list */}
      <nav className="flex-1 overflow-y-auto py-3">
        {STAGES.map((stage, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isFuture = index > currentIndex
          const isOpen = expanded.has(stage.id)
          const features = STAGE_FEATURES[stage.id]

          return (
            <div key={stage.id}>
              {/* Stage row */}
              <button
                type="button"
                onClick={() => toggleExpand(stage.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary ${
                  isFuture ? 'opacity-50' : ''
                }`}
              >
                {/* Circle node */}
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : isCompleted
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="size-3" strokeWidth={2.5} /> : index + 1}
                </span>

                {/* Label */}
                <div className="min-w-0 flex-1">
                  <p className={`ds-label truncate leading-tight ${isFuture ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {stage.label}
                  </p>
                  {isActive && (
                    <p className="ds-caption text-muted-foreground">
                      <Clock className="mr-0.5 inline size-2.5" />
                      {STAGE_TIME[stage.id]}
                    </p>
                  )}
                </div>

                {/* Expand chevron */}
                {isOpen
                  ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                }
              </button>

              {/* Feature sub-items */}
              {isOpen && (
                <div className="pb-1">
                  {/* Vertical line container */}
                  <div className="ml-[28px] border-l border-border">
                    {features.map((feat) => {
                      const isFeatureActive = activeFeature === feat.id
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => !isFuture && onFeatureSelect(feat.id)}
                          disabled={isFuture}
                          className={`flex w-full flex-col items-start gap-0.5 py-2 pl-4 pr-3 text-left transition-colors ${
                            isFeatureActive
                              ? 'bg-secondary'
                              : isFuture
                              ? 'cursor-default'
                              : 'hover:bg-secondary/60'
                          }`}
                        >
                          <span
                            className={`ds-label leading-tight ${
                              isFeatureActive ? 'text-foreground' : 'text-foreground/80'
                            }`}
                          >
                            {feat.label}
                          </span>
                          <span className="ds-caption text-muted-foreground leading-tight">
                            {feat.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom: reset */}
      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={onReset}
          className="ds-caption flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-3 rotate-180" />
          Restart GPS
        </button>
      </div>
    </aside>
  )
}
