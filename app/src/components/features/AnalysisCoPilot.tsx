import { Sparkles, ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { CoPilotMode } from '@/components/CoPilotChat'

const STARTERS = [
  'Help me plan my data collection timeline',
  'Write interview questions for my research topic',
  'How many survey responses do I need for significance?',
  'How do I structure my findings chapter?',
  'Help me interpret these interview themes',
  "I'm stuck on my analysis — where do I start?",
  'How do I code qualitative interview data?',
  'What statistical tests fit my research design?',
  'Help me turn my data into a clear narrative',
  'What should the analysis chapter include?',
  'How do I present mixed-methods findings?',
  'Review the logic of my findings section',
]

interface AnalysisCoPilotProps {
  onOpenCoPilot: (prompt?: string, mode?: CoPilotMode) => void
}

export function AnalysisCoPilot({ onOpenCoPilot }: AnalysisCoPilotProps) {
  const open = (prompt?: string) => onOpenCoPilot(prompt, 'analysis')
  const { completeFeature, uncompleteFeature, tasks } = useThesisStore()
  const isDone = tasks.find((t) => t.featureId === 'analysis-copilot')?.status === 'done'

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-ai">
          <Sparkles className="size-5 text-background" />
        </div>
        <h2 className="ds-title-md text-foreground">Analysis Co-Pilot</h2>
        <p className="ds-body mt-2 text-muted-foreground leading-relaxed">
          From data collection to polished findings — Co-Pilot helps you gather, interpret, and present your research with clarity.
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
        Open Analysis Co-Pilot
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
              onClick={() => uncompleteFeature('analysis-copilot')}
              className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => completeFeature('analysis-copilot')}
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
