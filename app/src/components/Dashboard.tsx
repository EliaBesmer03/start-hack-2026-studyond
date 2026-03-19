import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import { JourneyMapSidebar } from '@/components/JourneyMapSidebar'
import type { FeatureId } from '@/components/JourneyMapSidebar'
import { ThesisBoard } from '@/components/ThesisBoard'

/* ── Feature pane placeholders ─────────────────────────────────────── */

const FEATURE_LABELS: Record<FeatureId, string> = {
  'profile-setup':    'Thesis Profile',
  'topic-explore':    'Explore Topics',
  'topic-match':      'Topic Match',
  'supervisor-search':'Find Supervisors',
  'copilot-planning': 'Planning Co-Pilot',
  'methodology':      'Methodology Guide',
  'copilot-execution':'Execution Co-Pilot',
  'interview-partners':'Interview Partners',
  'copilot-writing':  'Writing Co-Pilot',
  'draft-reader':     'Draft Reader',
}

function FeaturePane({ featureId }: { featureId: FeatureId }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
      <div className="rounded-full bg-secondary px-4 py-1.5">
        <span className="ds-label text-muted-foreground">Coming soon</span>
      </div>
      <h2 className="ds-title-md text-foreground">{FEATURE_LABELS[featureId]}</h2>
      <p className="ds-body max-w-sm text-center text-muted-foreground">
        This feature will be fully interactive. For now it's a placeholder to show the navigation structure.
      </p>
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const { resetProfile } = useThesisStore()
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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

        {/* Top bar (mobile only) */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="text-muted-foreground"
          >
            {mobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="ds-label text-foreground">
            {activeFeature ? FEATURE_LABELS[activeFeature] : 'Board'}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          {activeFeature === null ? (
            <ThesisBoard onFeatureOpen={(id) => setActiveFeature(id)} />
          ) : (
            <div className="flex min-h-full flex-col">
              {/* Breadcrumb back to board */}
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
      </div>
    </div>
  )
}
