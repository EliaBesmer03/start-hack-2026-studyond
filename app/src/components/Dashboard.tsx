import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, X, Sparkles, BookOpen, ChevronRight, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useThesisStore } from '@/stores/thesis-store'
import type { ThesisStage } from '@/types/thesis'
import { JourneyMapSidebar, ORDERED_FEATURES } from '@/components/JourneyMapSidebar'
import type { FeatureId } from '@/components/JourneyMapSidebar'
import { ThesisBoard } from '@/components/ThesisBoard'
import { CoPilotChat } from '@/components/CoPilotChat'
import type { CoPilotMode } from '@/components/CoPilotChat'
import { SmartMatch } from '@/components/features/SmartMatch'
import { InterviewPartners } from '@/components/features/InterviewPartners'
import { ThesisTwin } from '@/components/features/ThesisTwin'
import { DraftReader } from '@/components/features/DraftReader'
import { ProfileSetup } from '@/components/features/ProfileSetup'
import { IntelligenceSurvey } from '@/components/features/IntelligenceSurvey'
import { TopicExplore } from '@/components/features/TopicExplore'
import { SupervisorSearch } from '@/components/features/SupervisorSearch'
import { PlanningCoPilot } from '@/components/features/PlanningCoPilot'
import { AnalysisCoPilot } from '@/components/features/AnalysisCoPilot'
import { ThesisAlumni } from '@/components/features/ThesisAlumni'
import { FinalDecision } from '@/components/features/FinalDecision'
import { CreateTimeline } from '@/components/features/CreateTimeline'
import { LiteratureSearch } from '@/components/features/LiteratureSearch'
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

function FinalCongratulations({ onDismiss }: { onDismiss: () => void }) {
  const { profile, tasks } = useThesisStore()
  const firstName = profile.name?.split(' ')[0] ?? null
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12"
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-[600px] rounded-full bg-ai opacity-[0.06] blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="relative mx-auto w-full max-w-lg text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex size-24 items-center justify-center rounded-full bg-foreground shadow-2xl">
            <span className="text-5xl">🎓</span>
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="ds-title-xl text-foreground">
          {firstName ? `Congratulations, ${firstName}!` : 'Congratulations!'}
        </h1>
        <p className="ds-body mt-3 text-muted-foreground leading-relaxed">
          You've completed your entire thesis journey with Studyond —
          from your first profile setup to the final writing stage.
          That's no small feat.
        </p>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background px-5 py-4">
            <p className="ds-title-md text-foreground">{doneTasks}</p>
            <p className="ds-caption mt-0.5 text-muted-foreground">tasks completed</p>
          </div>
          <div className="rounded-xl border border-border bg-background px-5 py-4">
            <p className="ds-title-md text-foreground">5</p>
            <p className="ds-caption mt-0.5 text-muted-foreground">stages unlocked</p>
          </div>
        </div>

        {/* Message */}
        <div className="mt-6 rounded-xl border border-border bg-secondary/40 px-5 py-4 text-left">
          <p className="ds-label text-foreground">What's next?</p>
          <p className="ds-body mt-1 text-muted-foreground leading-relaxed">
            Complete your alumni profile to help future students who research the same topic or supervisor.
            Your experience is valuable — pay it forward.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 ds-label text-background transition-all hover:bg-foreground/80"
          >
            <Check className="size-4" />
            Back to board
          </button>
          <p className="ds-caption text-muted-foreground">
            Your progress is saved. You can always revisit any feature from the board.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
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
        className="relative mx-4 max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground">
            <Check className="size-7 text-background" strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="ds-title-md text-foreground">{copy.title}</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Moving to <span className="font-medium text-foreground">{copy.next}</span> — your board has updated.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => { onDismiss(); onOpenCoPilot(copy.starterPrompt) }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90"
          >
            <Sparkles className="size-4" />
            Open Co-Pilot for {copy.next}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-full border border-border px-4 py-3 ds-label text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
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
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 ds-label text-background transition-all hover:bg-foreground/80"
        >
          Save guidelines
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border px-4 py-2.5 ds-label text-muted-foreground transition-all hover:border-foreground/30"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}

/* ── Feature labels ─────────────────────────────────────────────────── */

const FEATURE_LABELS: Record<FeatureId, string> = {
  'profile-setup':       'Thesis Profile',
  'intelligence-survey': 'Learning Profile',
  'topic-explore':       'Explore Topics',
  'topic-match':         'Smart Match',
  'supervisor-search':   'Find Supervisors',
  'final-decision':      'Final Decision',
  'create-timeline':     'Create Timeline',
  'planning-copilot':    'Planning Co-Pilot',
  'copilot-literature':  'Literature Review',
  'analysis-copilot':    'Analysis Co-Pilot',
  'interview-partners':  'Interview Partners',
  'draft-reader':        'Draft Reader',
  'thesis-twin':         'Thesis Twin',
  'thesis-alumni':       'Alumni Profile',
}

/* ── Feature pane ──────────────────────────────────────────────────── */

function FeaturePane({
  featureId,
  onOpenCoPilot,
}: {
  featureId: FeatureId
  onOpenCoPilot: (prompt?: string, mode?: CoPilotMode) => void
}) {
  if (featureId === 'topic-match') return <SmartMatch />
  if (featureId === 'interview-partners') return <InterviewPartners />
  if (featureId === 'thesis-twin') return <ThesisTwin />
  if (featureId === 'draft-reader') return <DraftReader />
  if (featureId === 'thesis-alumni') return <ThesisAlumni />
  if (featureId === 'profile-setup') return <ProfileSetup />
  if (featureId === 'intelligence-survey') return <IntelligenceSurvey />
  if (featureId === 'topic-explore') return <TopicExplore onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'supervisor-search') return <SupervisorSearch onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'final-decision') return <FinalDecision />
  if (featureId === 'create-timeline') return <CreateTimeline />
  if (featureId === 'copilot-literature') return <LiteratureSearch onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'planning-copilot') return <PlanningCoPilot onOpenCoPilot={onOpenCoPilot} />
  if (featureId === 'analysis-copilot') return <AnalysisCoPilot onOpenCoPilot={onOpenCoPilot} />

  return null
}

/* ── Dashboard ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const { resetProfile, celebrateStage, clearCelebration } = useThesisStore()
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [chatStarterPrompt, setChatStarterPrompt] = useState<string | null>(null)
  const [chatInitialMode, setChatInitialMode] = useState<CoPilotMode | undefined>(undefined)

  // Track previous stage to detect advancement
  const prevCelebrateRef = useRef<ThesisStage | null>(null)

  // When Co-Pilot is closed, clear the starter prompt and mode
  const handleCloseChat = useCallback(() => {
    setChatOpen(false)
    setChatStarterPrompt(null)
    setChatInitialMode(undefined)
  }, [])

  const openCoPilot = useCallback((prompt?: string, mode?: CoPilotMode) => {
    setChatStarterPrompt(prompt ?? null)
    setChatInitialMode(mode)
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

  const { profile, tasks } = useThesisStore()
  const currentStageId = profile.stage ?? 'orientation'

  // Check if the active feature's task is done
  const isActiveFeatureDone = activeFeature
    ? tasks.some((t) => t.featureId === activeFeature && t.status === 'done')
    : false

  // Next feature in the ordered list
  const nextFeatureId = activeFeature
    ? (() => {
        const idx = ORDERED_FEATURES.indexOf(activeFeature)
        return idx >= 0 && idx < ORDERED_FEATURES.length - 1 ? ORDERED_FEATURES[idx + 1] : null
      })()
    : null

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">

      {/* Starting tutorial overlay */}
      <StartingTutorial
        onNavigateTimeline={() => setActiveFeature('create-timeline')}
        onGoBack={() => setActiveFeature(null)}
      />

      {/* Stage completion celebration overlay */}
      <AnimatePresence>
        {celebrateStage === 'execution-writing' && (
          <FinalCongratulations
            onDismiss={() => { clearCelebration(); setActiveFeature(null) }}
          />
        )}
        {celebrateStage && celebrateStage !== 'execution-writing' && (
          <StageCelebration
            stage={celebrateStage}
            onDismiss={() => { clearCelebration(); setActiveFeature(null) }}
            onOpenCoPilot={(prompt) => {
              clearCelebration()
              setActiveFeature(null)
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
          onShowBoard={() => setActiveFeature(null)}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="absolute inset-0 z-50 flex md:hidden">
          <JourneyMapSidebar
            activeFeature={activeFeature}
            onFeatureSelect={(id) => { setActiveFeature(id); setMobileSidebarOpen(false) }}
            onReset={() => { resetProfile(); setMobileSidebarOpen(false) }}
            onShowBoard={() => { setActiveFeature(null); setMobileSidebarOpen(false) }}
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
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
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

                {/* Post-completion navigation */}
                {isActiveFeatureDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-5 py-4"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground">
                      <Check className="size-3.5 text-background" strokeWidth={2.5} />
                    </span>
                    <p className="ds-label flex-1 text-foreground">Step complete</p>
                    <button
                      type="button"
                      onClick={() => setActiveFeature(null)}
                      className="ds-caption rounded-full border border-border px-4 py-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      Go back to board
                    </button>
                    {nextFeatureId && (
                      <button
                        type="button"
                        onClick={() => setActiveFeature(nextFeatureId)}
                        className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-foreground/80"
                      >
                        Go to next step
                        <ChevronRight className="size-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
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
                initialMode={chatInitialMode}
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
