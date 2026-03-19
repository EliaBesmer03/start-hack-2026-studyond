import { Sparkles, ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { CoPilotMode } from '@/components/CoPilotChat'

const STARTERS = [
  'What goes in a thesis proposal?',
  'Qualitative vs. quantitative — which fits me?',
  'Help me draft milestones for the next 8 weeks',
  'What do I need to register my thesis?',
  'How do I justify my methodology choice?',
  'Write my registration abstract',
  'What are the pros and cons of interviews vs. surveys?',
  'How often should I schedule check-ins with my supervisor?',
  'Review the structure of my proposal draft',
  'What should I align with my supervisor before starting?',
  'Help me draft a timeline for my proposal',
  'What are typical thesis registration deadlines?',
]

interface PlanningCoPilotProps {
  onOpenCoPilot: (prompt?: string, mode?: CoPilotMode) => void
}

export function PlanningCoPilot({ onOpenCoPilot }: PlanningCoPilotProps) {
  const open = (prompt?: string) => onOpenCoPilot(prompt, 'planning')
  const { completeFeature, uncompleteFeature, tasks } = useThesisStore()
  const isDone = tasks.find((t) => t.featureId === 'planning-copilot')?.status === 'done'

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-ai">
          <Sparkles className="size-5 text-background" />
        </div>
        <h2 className="ds-title-md text-foreground">Planning Co-Pilot</h2>
        <p className="ds-body mt-2 text-muted-foreground leading-relaxed">
          Everything from methodology to thesis registration — proposal structure, supervisor milestones, and official sign-off — guided by AI.
        </p>
      </div>

      {/* Starter prompts */}
      <div className="mb-6">
        <p className="ds-label mb-3 text-muted-foreground">What do you need help with?</p>
        <div className="flex flex-col gap-2">
          {STARTERS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => open(prompt)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-foreground/30 hover:shadow-sm"
            >
              <span className="ds-body text-foreground">{prompt}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Open Co-Pilot CTA */}
      <button
        type="button"
        onClick={() => open()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90"
      >
        <Sparkles className="size-4" />
        Open Planning Co-Pilot
      </button>

      {/* Manual mark-as-done */}
      <div className="mt-6 border-t border-border pt-5">
        {isDone ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="size-3" strokeWidth={2.5} />
              </span>
              <p className="ds-label text-foreground">Marked as complete</p>
            </div>
            <button
              type="button"
              onClick={() => uncompleteFeature('planning-copilot')}
              className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => completeFeature('planning-copilot')}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-3 ds-label text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          >
            <Check className="size-4" />
            Mark this step as done
          </button>
        )}
      </div>
    </div>
  )
}
