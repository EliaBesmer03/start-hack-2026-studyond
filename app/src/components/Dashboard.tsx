import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, X, Sparkles, BookOpen, RotateCcw, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useThesisStore } from '@/stores/thesis-store'
import type { ThesisStage } from '@/types/thesis'
import { JourneyMapSidebar } from '@/components/JourneyMapSidebar'
import type { FeatureId } from '@/components/JourneyMapSidebar'
import { ThesisBoard } from '@/components/ThesisBoard'
import { CoPilotChat } from '@/components/CoPilotChat'
import { SmartMatch } from '@/components/features/SmartMatch'
import { InterviewPartners } from '@/components/features/InterviewPartners'
import { ThesisTwin } from '@/components/features/ThesisTwin'
import { DraftReader } from '@/components/features/DraftReader'
import { ProfileSetup } from '@/components/features/ProfileSetup'
import { TopicExplore } from '@/components/features/TopicExplore'
import { SupervisorSearch } from '@/components/features/SupervisorSearch'
import { CoPilotFeature } from '@/components/features/CoPilotFeature'
import { ThesisAlumni } from '@/components/features/ThesisAlumni'
import { FinalDecision } from '@/components/features/FinalDecision'
import { CreateTimeline } from '@/components/features/CreateTimeline'
import { StartingTutorial } from '@/components/StartingTutorial'

/* ── Stage celebration overlay ─────────────────────────────────────── */

const STAGE_COMPLETE_COPY: Record<ThesisStage, { title: string; next: string; starterPrompt: string }> = {
  orientation: {
    title: 'Orientation complete',
    next: 'Topic & Supervisor',
    starterPrompt: 'I just finished orientation. Help me find the right topic for my thesis.',
  },
  'topic-discovery': {
    title: 'Topic & Supervisor locked in',
    next: 'Planning',
    starterPrompt: 'I have my topic and supervisor confirmed. Help me draft my thesis proposal.',
  },
  'supervisor-search': {
    title: 'Planning stage complete',
    next: 'Execution',
    starterPrompt: 'My planning is done. Help me structure my literature review and start the execution phase.',
  },
  planning: {
    title: 'Execution stage complete',
    next: 'Writing & Finalization',
    starterPrompt: 'My research and data collection are done. Help me structure my writing phase.',
  },
  'execution-writing': {
    title: 'Thesis submitted!',
    next: '',
    starterPrompt: '',
  },
}

function StageCelebration({
  stage,
  onDismiss,
  onOpenCoPilot,
}: {
  stage: ThesisStage
  onDismiss: () => void
  onOpenCoPilot: (prompt: string) => void
}) {
  const copy = STAGE_COMPLETE_COPY[stage]
  const isLast = stage === 'execution-writing'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative mx-4 max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground">
            <span className="text-2xl">{isLast ? '🎓' : '✓'}</span>
          </div>
        </div>
        <h2 className="ds-title-md text-foreground">{copy.title}</h2>
        {!isLast && (
          <p className="ds-body mt-2 text-muted-foreground">
            Moving to <span className="font-medium text-foreground">{copy.next}</span> — your board has updated.
          </p>
        )}
        {isLast && (
          <p className="ds-body mt-2 text-muted-foreground">
            Congratulations on completing your thesis journey with Studyond!
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {!isLast && (
            <button
              type="button"
              onClick={() => { onDismiss(); onOpenCoPilot(copy.starterPrompt) }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90"
            >
              <Sparkles className="size-4" />
              Open Co-Pilot for {copy.next}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl border border-border px-4 py-3 ds-label text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          >
            Continue to board
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── University guidelines drawer ──────────────────────────────────── */

function GuidelinesDrawer({ onClose }: { onClose: () => void }) {
  const { universityGuidelines, setUniversityGuidelines } = useThesisStore()
  const [draft, setDraft] = useState(universityGuidelines)

  const handleSave = () => {
    setUniversityGuidelines(draft)
    onClose()
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-background"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="size-3.5 text-foreground" />
          </div>
          <div>
            <p className="ds-label text-foreground leading-none">University Guidelines</p>
            <p className="ds-caption text-muted-foreground mt-0.5">Paste your thesis requirements</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <p className="ds-body text-muted-foreground">
          Paste your university's thesis formatting and submission guidelines below. The Co-Pilot will use them to answer questions like "What are the formatting requirements?" or "When is my submission deadline?".
        </p>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <p className="ds-caption text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Copy key sections from your faculty handbook — page limits, citation style, language requirements, and deadline rules work best.
          </p>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g.&#10;- Thesis must be 60–80 pages (excl. appendix)&#10;- Citation style: APA 7th edition&#10;- Submission deadline: 15 August 2025&#10;- Abstract max 250 words&#10;- Language: English or German&#10;..."
          rows={14}
          className="ds-body flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border p-4">
        <button
          type="button"
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 ds-label text-background transition-all hover:bg-foreground/80"
        >
          Save guidelines
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-4 py-2.5 ds-label text-muted-foreground transition-all hover:border-foreground/30"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}

/* ── Feature labels ─────────────────────────────────────────────────── */

const FEATURE_LABELS: Record<FeatureId, string> = {
  'profile-setup':     'Thesis Profile',
  'topic-explore':     'Explore Topics',
  'topic-match':       'Smart Match',
  'smart-match':       'Review Matches',
  'supervisor-search': 'Find Supervisors',
  'final-decision':    'Final Decision',
  'create-timeline':   'Create Timeline',
  'copilot-planning':  'Planning Co-Pilot',
  'methodology':       'Methodology Guide',
  'copilot-execution': 'Execution Co-Pilot',
  'interview-partners':'Interview Partners',
  'draft-reader':      'Draft Reader',
  'thesis-twin':       'Thesis Twin',
  'thesis-alumni':     'Alumni Profile',
}

/* ── Feature pane ──────────────────────────────────────────────────── */

function FeaturePane({
  featureId,
  onOpenCoPilot,
}: {
  featureId: FeatureId
  onOpenCoPilot: (prompt?: string) => void
}) {
  if (featureId === 'topic-match' || featureId === 'smart-match') return <SmartMatch />
  if (featureId === 'interview-partners') return <InterviewPartners />
  if (featureId === 'thesis-twin') return <ThesisTwin />
  if (featureId === 'draft-reader') return <DraftReader />
  if (featureId === 'thesis-alumni') return <ThesisAlumni />
  if (featureId === 'profile-setup') return <ProfileSetup />
  if (featureId === 'topic-explore') return <TopicExplore onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'supervisor-search') return <SupervisorSearch onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'final-decision') return <FinalDecision />
  if (featureId === 'create-timeline') return <CreateTimeline />

  // Co-Pilot feature stubs
  const coPilotFeatures: Partial<Record<FeatureId, { title: string; description: string; starters: string[] }>> = {
    'copilot-planning': {
      title: 'Planning Co-Pilot',
      description: 'AI guidance on methodology selection, thesis proposal structure, and milestone planning with your supervisor.',
      starters: [
        'What goes in a thesis proposal?',
        'Qualitative vs quantitative — which fits my topic?',
        'Help me draft milestones for the next 8 weeks',
      ],
    },
    methodology: {
      title: 'Methodology Guide',
      description: 'Decide between qualitative, quantitative, and mixed-methods approaches based on your research question.',
      starters: [
        'What research method fits a case study?',
        'How do I justify my methodology choice?',
        'What are the pros and cons of interviews vs surveys?',
      ],
    },
    'copilot-execution': {
      title: 'Execution Co-Pilot',
      description: 'Support for your literature review, data collection, interview prep, and first analysis draft.',
      starters: [
        'Help me structure my literature review',
        'Write interview questions for a supply chain expert',
        "I'm stuck on my data analysis — where do I start?",
      ],
    },
  }

  const meta = coPilotFeatures[featureId]
  if (meta) {
    return (
      <CoPilotFeature
        title={meta.title}
        description={meta.description}
        starters={meta.starters}
        featureId={featureId}
        onOpenCoPilot={onOpenCoPilot}
      />
    )
  }

  return null
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const { resetProfile, celebrateStage, clearCelebration, universityGuidelines } = useThesisStore()
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [chatStarterPrompt, setChatStarterPrompt] = useState<string | null>(null)

  // Track previous stage to detect advancement
  const prevCelebrateRef = useRef<ThesisStage | null>(null)

  // When Co-Pilot is closed, clear the starter prompt
  const handleCloseChat = useCallback(() => {
    setChatOpen(false)
    setChatStarterPrompt(null)
  }, [])

  const openCoPilot = useCallback((prompt?: string) => {
    setChatStarterPrompt(prompt ?? null)
    setChatOpen(true)
  }, [])

  // Keep track so the celebration doesn't re-trigger on re-render
  useEffect(() => {
    prevCelebrateRef.current = celebrateStage
  }, [celebrateStage])

  // Close guidelines drawer when opening chat
  useEffect(() => {
    if (chatOpen) setGuidelinesOpen(false)
  }, [chatOpen])

  const { profile } = useThesisStore()
  const currentStageId = profile.stage ?? 'orientation'

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">

      {/* Starting tutorial overlay */}
      <StartingTutorial
        onNavigateTimeline={() => setActiveFeature('create-timeline')}
        onGoBack={() => setActiveFeature(null)}
      />

      {/* Stage completion celebration overlay */}
      <AnimatePresence>
        {celebrateStage && (
          <StageCelebration
            stage={celebrateStage}
            onDismiss={clearCelebration}
            onOpenCoPilot={(prompt) => {
              clearCelebration()
              openCoPilot(prompt)
            }}
          />
        )}
      </AnimatePresence>

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

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          {/* Left: hamburger (mobile) */}
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

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {/* University guidelines button */}
            <button
              type="button"
              onClick={() => { setGuidelinesOpen((o) => !o); setChatOpen(false) }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ds-caption font-medium transition-all duration-200 ${
                guidelinesOpen || universityGuidelines
                  ? 'border-foreground/40 bg-secondary text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
              aria-label="University guidelines"
              title="Paste your university thesis guidelines"
            >
              <BookOpen className="size-3.5" />
              <span className="hidden sm:inline">Guidelines</span>
              {universityGuidelines && (
                <span className="flex size-1.5 rounded-full bg-foreground" />
              )}
            </button>

            {/* Demo reset button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset demo? This clears all progress and restarts the GPS.')) {
                  resetProfile()
                }
              }}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 ds-caption font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
              aria-label="Reset demo"
              title="Reset demo"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Co-Pilot toggle */}
            <button
              type="button"
              data-tutorial="copilot"
              onClick={() => { setChatOpen((o) => !o); if (!chatOpen) setChatStarterPrompt(null) }}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 ds-caption font-medium transition-all duration-200 ${
                chatOpen
                  ? 'border-ai bg-ai text-background'
                  : 'border-ai/40 bg-background text-ai-solid hover:border-ai hover:text-ai-solid'
              }`}
              aria-label="Toggle Co-Pilot"
            >
              <Sparkles className="size-3.5" />
              Co-Pilot
            </button>
          </div>
        </header>

        {/* Content row */}
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
                  <ChevronRight className="size-3 rotate-180" />
                  Board
                </button>
                <FeaturePane featureId={activeFeature} onOpenCoPilot={openCoPilot} />
              </div>
            )}
          </main>

          {/* Chat / Guidelines panel — slides in from right */}
          <AnimatePresence>
            {chatOpen && (
              <CoPilotChat
                key={`chat-${currentStageId}`}
                onClose={handleCloseChat}
                starterPrompt={chatStarterPrompt}
              />
            )}
            {guidelinesOpen && !chatOpen && (
              <GuidelinesDrawer key="guidelines" onClose={() => setGuidelinesOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
