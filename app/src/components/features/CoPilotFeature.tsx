/**
 * CoPilotFeature — generic landing screen for Co-Pilot powered features.
 * Shows a description, starter prompts, and a CTA to open the Co-Pilot.
 */

import { Sparkles, ArrowRight } from 'lucide-react'

interface CoPilotFeatureProps {
  title: string
  description: string
  starters: string[]
  onOpenCoPilot: (prompt?: string) => void
}

export function CoPilotFeature({ title, description, starters, onOpenCoPilot }: CoPilotFeatureProps) {
  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-foreground">
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 ds-label text-background transition-all hover:bg-foreground/80"
      >
        <Sparkles className="size-4" />
        Open Co-Pilot
      </button>
    </div>
  )
}
