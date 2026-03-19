import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Clock, LogOut } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import { STAGES } from '@/types/thesis'
import type { ThesisStage } from '@/types/thesis'
import logo from '@/assets/studyond.svg'

/* ── Feature entry points per stage ───────────────────────────────── */

export type FeatureId =
  | 'topic-explore'
  | 'profile-setup'
  | 'intelligence-survey'
  | 'topic-match'
  | 'supervisor-search'
  | 'final-decision'
  | 'create-timeline'
  | 'copilot-proposal'
  | 'copilot-milestones'
  | 'copilot-registration'
  | 'methodology'
  | 'copilot-literature'
  | 'copilot-data'
  | 'copilot-analysis'
  | 'interview-partners'
  | 'thesis-twin'
  | 'draft-reader'
  | 'thesis-alumni'

export interface FeatureItem {
  id: FeatureId
  label: string
  description: string
}

const STAGE_FEATURES: Record<ThesisStage, FeatureItem[]> = {
  orientation: [
    { id: 'profile-setup',      label: 'Thesis Profile',        description: 'Set up your interests, field, and constraints' },
    { id: 'intelligence-survey', label: 'Learning Profile',      description: 'Optional: discover your personality & academic strengths' },
    { id: 'topic-explore',      label: 'Explore Topics',        description: 'Browse curated topics and company briefs' },
  ],
  'topic-discovery': [
    { id: 'topic-explore',     label: 'Explore Topics',    description: 'Browse and bookmark up to 3 favourite topics' },
    { id: 'topic-match',       label: 'Smart Match',       description: 'AI-matched topic + supervisor + company combos' },
    { id: 'supervisor-search', label: 'Find Supervisors',  description: 'Shortlist up to 3 supervisors for Smart Match' },
    { id: 'final-decision',    label: 'Final Decision',    description: 'Commit to your final topic/supervisor/company combo' },
  ],
  'supervisor-search': [
    { id: 'create-timeline',      label: 'Create Timeline',      description: 'Plan your thesis timeline with drag & drop' },
    { id: 'methodology',          label: 'Methodology Guide',    description: 'Qualitative vs. quantitative decision support' },
    { id: 'copilot-proposal',     label: 'Thesis Proposal',      description: 'AI-guided proposal: research question, method, timeline' },
    { id: 'copilot-milestones',   label: 'Supervisor Milestones', description: 'Align on key deadlines and check-ins' },
    { id: 'copilot-registration', label: 'Thesis Registration',  description: 'Complete official registration at your university' },
  ],
  planning: [
    { id: 'copilot-literature',   label: 'Literature Review',    description: 'Structure sources and identify research gaps' },
    { id: 'interview-partners',   label: 'Interviews',           description: 'Find and schedule expert interviews' },
    { id: 'thesis-twin',          label: 'Thesis Twin',          description: 'Peer accountability — one student, same stage' },
    { id: 'copilot-data',         label: 'Data Collection',      description: 'Log and track your primary data gathering' },
    { id: 'copilot-analysis',     label: 'Analysis Draft',       description: 'Turn your data into findings with AI review' },
  ],
  'execution-writing': [
    { id: 'draft-reader',  label: 'Draft Reader',  description: 'Request an expert to review your draft' },
    { id: 'thesis-alumni', label: 'Alumni Profile', description: 'Leave feedback and be there for the next student' },
  ],
}

/** Flat ordered list of all feature IDs across stages */
export const ORDERED_FEATURES: FeatureId[] = (
  Object.values(STAGE_FEATURES) as FeatureItem[][]
).flat().map((f) => f.id)

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
  const { profile, tasks } = useThesisStore()

  const isFeatureDone = (featureId: FeatureId) =>
    tasks.some((t) => t.featureId === featureId && t.status === 'done')
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
      <div className="flex h-14 shrink-0 items-center px-4">
        <img src={logo} alt="Studyond" className="h-7 w-auto" />
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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary"
              >
                {/* Circle node */}
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ds-badge font-semibold transition-all ${
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
                      const done = isFeatureDone(feat.id)
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => onFeatureSelect(feat.id)}
                          className={`flex w-full items-start gap-2 py-2 pl-4 pr-3 text-left transition-colors ${
                            isFeatureActive ? 'bg-secondary' : 'hover:bg-secondary/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className={`ds-label block leading-tight ${
                                done ? 'text-foreground' : isFeatureActive ? 'text-foreground' : 'text-foreground/80'
                              }`}
                            >
                              {feat.label}
                            </span>
                            <span className="ds-caption text-muted-foreground leading-tight">
                              {feat.description}
                            </span>
                          </div>
                          {done && (
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground">
                              <Check className="size-2.5 text-background" strokeWidth={2.5} />
                            </span>
                          )}
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

      {/* Bottom: user identity card */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-secondary px-3 py-2.5">
          {/* Avatar */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground ds-badge font-semibold text-background">
            {profile.name
              ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
              : '?'}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="ds-label truncate text-foreground leading-tight">
              {profile.name ?? 'Anonymous'}
            </p>
            <p className="ds-caption truncate text-muted-foreground leading-tight">
              {profile.email ?? '—'}
            </p>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            title="Restart GPS"
            className="shrink-0 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
