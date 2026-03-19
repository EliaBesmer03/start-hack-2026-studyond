/**
 * CoPilotFeature — generic landing screen for Co-Pilot powered features.
 * Shows a description, starter prompts, and a CTA to open the Co-Pilot.
 * The user manually marks this step as complete — it does NOT auto-complete on first open.
 */

import { Sparkles, ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'

interface CoPilotFeatureProps {
  title: string
  description: string
  starters: string[]
  featureId: string
  onOpenCoPilot: (prompt?: string) => void
}

export function CoPilotFeature({ title, description, starters, featureId, onOpenCoPilot }: CoPilotFeatureProps) {
  const { completeFeature, uncompleteFeature, tasks } = useThesisStore()
  const isDone = tasks.find((t) => t.featureId === featureId)?.status === 'done'

  const handleMarkDone = () => completeFeature(featureId)
  const handleUndo = () => uncompleteFeature(featureId)

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-ai">
          <Sparkles className="size-5 text-background" />
        </div>
        <h2 className="ds-title-md text-foreground">{title}</h2>
        <p className="ds-body mt-2 text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Starter prompts */}
      <div className="mb-6">
        <p className="ds-label mb-3 text-muted-foreground">What do you need help with?</p>
        <div className="flex flex-col gap-2">
          {starters.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onOpenCoPilot(prompt)}
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
        onClick={() => onOpenCoPilot()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90"
      >
        <Sparkles className="size-4" />
        Open Co-Pilot
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
              onClick={handleUndo}
              className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMarkDone}
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
