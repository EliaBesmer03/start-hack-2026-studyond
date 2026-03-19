import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'

const STORAGE_PREFIX = 'studyond-tutorial-v1'

function storageKey(email: string | null): string {
  return email ? `${STORAGE_PREFIX}-${email}` : STORAGE_PREFIX
}

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
  borderRadius?: number
}

interface StepDef {
  title: string
  description: string
  getHighlight: () => HighlightRect
  tooltipStyle: React.CSSProperties
  cta?: string
  /** Called when Next is clicked, before advancing to the next step */
  sideEffect?: () => void
}

function buildSteps(onNavigateTimeline: () => void): StepDef[] {
  const vh = window.innerHeight
  const vw = window.innerWidth
  const sidebarW = 240

  return [
    /* ── 1: Left sidebar ── */
    {
      title: 'Your Thesis Journey',
      description:
        'The left panel maps your entire thesis across 5 stages — from Orientation all the way to Writing & Finalization. Each stage has dedicated features to guide you. Your progress is tracked here as you advance.',
      getHighlight: () => ({ top: 0, left: 0, width: sidebarW, height: vh, borderRadius: 0 }),
      tooltipStyle: { top: '50%', left: sidebarW + 20, transform: 'translateY(-50%)' },
    },

    /* ── 2: Co-Pilot button ── */
    {
      title: 'Your AI Co-Pilot',
      description:
        'Your AI thesis companion lives in the top-right corner. It has three modes: Topic helps you find and refine your research direction, Planning covers methodology, proposals, milestones and registration, and Analysis guides data collection through to finished findings. Each mode is fully personalised to your profile, choices, and progress.',
      getHighlight: () => {
        const el = document.querySelector('[data-tutorial="copilot"]') as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          return { top: r.top - 6, left: r.left - 10, width: r.width + 20, height: r.height + 12, borderRadius: 20 }
        }
        return { top: 8, left: vw - 155, width: 145, height: 38, borderRadius: 20 }
      },
      tooltipStyle: { top: 72, right: 16 },
    },

    /* ── 3: Kanban board ── */
    {
      title: 'Your Task Board',
      description:
        'Studyond pre-fills your board with all the tasks you need at each thesis stage — so you always know exactly what to do next. Click any card to open the feature. Timeline entries you create also appear here automatically, showing whether each phase is upcoming, in progress, or done.',
      getHighlight: () => ({
        top: 56,
        left: sidebarW,
        width: vw - sidebarW,
        height: vh - 56,
        borderRadius: 0,
      }),
      tooltipStyle: {
        top: '50%',
        left: `calc(${sidebarW}px + (100vw - ${sidebarW}px) / 2)`,
        transform: 'translate(-50%, -50%)',
      },
    },

    /* ── 4: Open timeline ── */
    {
      title: 'Build Your Timeline',
      description:
        "The Timeline is your personal thesis schedule. Click and drag across any week to create an entry, then click it to edit the label, add notes, or remove it. You can rename columns, add new ones, and set a hand-in date. All entries sync to your Kanban board automatically. We'll open it now.",
      getHighlight: () => ({ top: 0, left: 0, width: sidebarW, height: vh, borderRadius: 0 }),
      tooltipStyle: { top: '50%', left: sidebarW + 20, transform: 'translateY(-50%)' },
      cta: 'Open Timeline',
      sideEffect: onNavigateTimeline,
    },

    /* ── 5: Timeline grid ── */
    {
      title: 'Draw to Create',
      description:
        'Click and drag across any row to draw a new timeline block. Click an existing block to open its edit popup — change the label, add a note, or delete it. Double-click any column header to rename it, and use the + button to add a new column. Set your hand-in date in the top bar to anchor the whole schedule.',
      getHighlight: () => {
        const el = document.querySelector('[data-tutorial="timeline-grid"]') as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          return { top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16, borderRadius: 12 }
        }
        return { top: 160, left: sidebarW + 16, width: vw - sidebarW - 32, height: vh - 220, borderRadius: 12 }
      },
      tooltipStyle: (() => {
        const el = document.querySelector('[data-tutorial="timeline-grid"]') as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          const spaceBelow = vh - r.bottom
          return spaceBelow > 280
            ? { top: r.bottom + 16, left: Math.min(r.left + 16, vw - 340) }
            : { top: r.top + 16, left: Math.min(r.right + 16, vw - 340) }
        }
        return { top: '40%', left: `calc(${sidebarW}px + 32px)`, transform: 'translateY(-50%)' }
      })(),
      cta: "Got it, let's go!",
    },
  ]
}

export function StartingTutorial({
  onNavigateTimeline,
  onGoBack,
}: {
  onNavigateTimeline: () => void
  onGoBack: () => void
}) {
  const { profile } = useThesisStore()
  const key = storageKey(profile.email)

  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(key))
  const [highlight, setHighlight] = useState<HighlightRect | null>(null)
  const [steps, setSteps] = useState<StepDef[]>([])

  // Build steps on mount — needs window dimensions and stable callback
  useEffect(() => {
    setSteps(buildSteps(onNavigateTimeline))
  }, [onNavigateTimeline])

  const currentStep = steps[step]

  const refreshHighlight = useCallback(() => {
    if (!currentStep) return
    setHighlight(currentStep.getHighlight())
  }, [currentStep])

  useEffect(() => {
    if (dismissed) return
    refreshHighlight()
    window.addEventListener('resize', refreshHighlight)
    return () => window.removeEventListener('resize', refreshHighlight)
  }, [dismissed, refreshHighlight])

  const dismiss = useCallback(() => {
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }, [key])

  const next = useCallback(() => {
    if (!steps.length) return
    if (step === steps.length - 1) {
      // Last step: dismiss tutorial and auto-return to board
      dismiss()
      onGoBack()
    } else {
      // Fire any navigation side effect, then advance
      steps[step].sideEffect?.()
      setStep((s) => s + 1)
    }
  }, [step, steps, dismiss, onGoBack])

  if (dismissed || !currentStep || !highlight) return null

  const maskId = `spotlight-${step}`

  return (
    <AnimatePresence>
      {/* ── Spotlight overlay ── */}
      <motion.div
        key={`overlay-${step}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none' }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={highlight.left}
                y={highlight.top}
                width={highlight.width}
                height={highlight.height}
                rx={highlight.borderRadius ?? 12}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.58)" mask={`url(#${maskId})`} />
        </svg>

        {/* Highlight ring */}
        <div
          style={{
            position: 'absolute',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            borderRadius: highlight.borderRadius ?? 12,
            border: '2px solid rgba(255,255,255,0.35)',
            boxSizing: 'border-box',
          }}
        />
      </motion.div>

      {/* Click-outside to skip */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 48, cursor: 'pointer' }}
        onClick={dismiss}
        aria-hidden
      />

      {/* ── Tooltip card ── */}
      <motion.div
        key={`tooltip-${step}`}
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          zIndex: 50,
          width: 308,
          ...currentStep.tooltipStyle,
        }}
        className="rounded-xl border border-border bg-background p-5 shadow-2xl"
      >
        {/* Step dots + close */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  backgroundColor:
                    i === step
                      ? 'var(--foreground)'
                      : 'color-mix(in srgb, var(--muted-foreground) 25%, transparent)',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Skip tutorial"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="ds-caption mb-1 text-muted-foreground">
          Step {step + 1} of {steps.length}
        </p>
        <h3 className="ds-title-sm mb-2 text-foreground">{currentStep.title}</h3>
        <p className="ds-body leading-relaxed text-muted-foreground">{currentStep.description}</p>

        <div className="mt-4">
          <button
            type="button"
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 ds-label text-background transition-all hover:bg-foreground/80"
          >
            {currentStep.cta ?? (step === steps.length - 1 ? 'Finish' : 'Next')}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
