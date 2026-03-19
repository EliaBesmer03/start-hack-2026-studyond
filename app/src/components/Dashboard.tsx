import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useThesisStore } from '@/stores/thesis-store'
import { JourneyMapSidebar } from '@/components/JourneyMapSidebar'
import type { FeatureId } from '@/components/JourneyMapSidebar'
import { ThesisBoard } from '@/components/ThesisBoard'
import { CoPilotChat } from '@/components/CoPilotChat'
import { SmartMatch } from '@/components/features/SmartMatch'
import { InterviewPartners } from '@/components/features/InterviewPartners'
import { ThesisTwin } from '@/components/features/ThesisTwin'
import { DraftReader } from '@/components/features/DraftReader'

/* ── Feature pane ──────────────────────────────────────────────────── */

const FEATURE_LABELS: Record<FeatureId, string> = {
  'profile-setup':     'Thesis Profile',
  'topic-explore':     'Explore Topics',
  'topic-match':       'Topic Match',
  'supervisor-search': 'Find Supervisors',
  'copilot-planning':  'Planning Co-Pilot',
  'methodology':       'Methodology Guide',
  'copilot-execution': 'Execution Co-Pilot',
  'interview-partners':'Interview Partners',
  'copilot-writing':   'Writing Co-Pilot',
  'draft-reader':      'Draft Reader',
  'smart-match':       'Smart Match',
  'thesis-twin':       'Thesis Twin',
}

function FeaturePane({ featureId }: { featureId: FeatureId }) {
  // Fully-implemented features
  if (featureId === 'topic-match' || featureId === 'smart-match') return <SmartMatch />
  if (featureId === 'interview-partners') return <InterviewPartners />
  if (featureId === 'thesis-twin') return <ThesisTwin />
  if (featureId === 'draft-reader') return <DraftReader />

  // Placeholder for features not yet built
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <div className="rounded-full bg-secondary px-4 py-1.5">
        <span className="ds-label text-muted-foreground">Coming soon</span>
      </div>
      <h2 className="ds-title-md text-foreground">{FEATURE_LABELS[featureId]}</h2>
      <p className="ds-body max-w-sm text-center text-muted-foreground">
        This feature is planned for the next sprint. The navigation structure is already in place.
      </p>
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const { resetProfile } = useThesisStore()
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Sidebar (desktop) ── */}
      <div className="hidden md:flex">
        <JourneyMapSidebar
          activeFeature={activeFeature}
          onFeatureSelect={(id) => setActiveFeature(id)}
          onReset={resetProfile}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="absolute inset-0 z-50 flex md:hidden">
          <JourneyMapSidebar
            activeFeature={activeFeature}
            onFeatureSelect={(id) => { setActiveFeature(id); setMobileSidebarOpen(false) }}
            onReset={() => { resetProfile(); setMobileSidebarOpen(false) }}
          />
          <div
            className="flex-1 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar — mobile hamburger + shared Co-Pilot button */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          {/* Left: hamburger (mobile) or spacer */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="text-muted-foreground md:hidden"
            >
              {mobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <span className="ds-label text-foreground md:hidden">
              {activeFeature ? FEATURE_LABELS[activeFeature] : 'Board'}
            </span>
          </div>

          {/* Right: Co-Pilot toggle button */}
          <button
            type="button"
            onClick={() => setChatOpen((o) => !o)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 ds-caption font-medium transition-all duration-200 ${
              chatOpen
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            }`}
            aria-label="Toggle Co-Pilot"
          >
            <Sparkles className="size-3.5" />
            Co-Pilot
          </button>
        </header>

        {/* Content row: main + chat panel side by side */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scrollable main content */}
          <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
            {activeFeature === null ? (
              <ThesisBoard onFeatureOpen={(id) => setActiveFeature(id)} />
            ) : (
              <div className="flex min-h-full flex-col">
                <button
                  type="button"
                  onClick={() => setActiveFeature(null)}
                  className="ds-caption mb-6 flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Board
                </button>
                <FeaturePane featureId={activeFeature} />
              </div>
            )}
          </main>

          {/* Chat panel — slides in from right */}
          <AnimatePresence>
            {chatOpen && (
              <CoPilotChat onClose={() => setChatOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
