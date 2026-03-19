import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STAGES } from '@/types/thesis'
import type { ThesisProfile, ThesisStage, WizardAnswer } from '@/types/thesis'

const STAGE_ORDER = STAGES.map((s) => s.id) as ThesisStage[]

function nextStage(current: ThesisStage): ThesisStage | null {
  const i = STAGE_ORDER.indexOf(current)
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null
}

export type TaskStatus = 'ready' | 'in-progress' | 'done'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type KnowledgeCategory = 'interest' | 'decision' | 'constraint' | 'progress' | 'feedback'

export interface KnowledgeFact {
  id: string
  content: string
  sourceStage: ThesisStage
  category: KnowledgeCategory
  createdAt: number
}

type ChatHistories = Record<ThesisStage, Message[]>

export interface Task {
  id: string
  stageId: ThesisStage
  title: string
  description: string
  featureId: string          // links to a sidebar feature entry point
  status: TaskStatus
  nudge?: string             // optional overdue / attention nudge message
}

const DEFAULT_TASKS: Task[] = [
  // ── Orientation ──────────────────────────────────────────────────
  {
    id: 'o1',
    stageId: 'orientation',
    title: 'Set up your Thesis Profile',
    description: 'Tell us about your field, interests, and constraints so we can tailor everything.',
    featureId: 'profile-setup',
    status: 'ready',
  },
  {
    id: 'os',
    stageId: 'orientation',
    title: 'Discover Your Learning Profile',
    description: 'Optional: map your personality and academic strengths with a quick spider-web survey.',
    featureId: 'intelligence-survey',
    status: 'ready',
  },
  {
    id: 'o2',
    stageId: 'orientation',
    title: 'Browse 3+ Topic Areas',
    description: 'Explore curated company briefs and academic directions that match your profile.',
    featureId: 'topic-explore',
    status: 'ready',
  },

  // ── Topic & Supervisor ───────────────────────────────────────────
  {
    id: 't1',
    stageId: 'topic-discovery',
    title: 'Shortlist 3 Topics',
    description: 'Bookmark up to 3 favourite topics — they carry forward into your Smart Match.',
    featureId: 'topic-explore',
    status: 'ready',
  },
  {
    id: 't2',
    stageId: 'topic-discovery',
    title: 'Identify 3 Potential Supervisors',
    description: 'Search professors aligned with your research direction and shortlist up to 3.',
    featureId: 'supervisor-search',
    status: 'ready',
  },
  {
    id: 't3',
    stageId: 'topic-discovery',
    title: 'Send First Supervisor Outreach',
    description: 'Draft and send a personalised email — Co-Pilot can help you write it.',
    featureId: 'supervisor-search',
    status: 'ready',
    nudge: 'Outreach sent over 2 weeks ago with no reply — want Co-Pilot to help you follow up?',
  },
  {
    id: 't4',
    stageId: 'topic-discovery',
    title: 'Review Your Smart Matches',
    description: 'Shortlist bundled topic + supervisor + company matches curated for you.',
    featureId: 'topic-match',
    status: 'ready',
  },
  {
    id: 't5',
    stageId: 'topic-discovery',
    title: 'Select Your Final Combination',
    description: 'Commit to your final topic, supervisor, and company combination to move forward.',
    featureId: 'final-decision',
    status: 'ready',
  },

  // ── Planning ─────────────────────────────────────────────────────
  {
    id: 'p1',
    stageId: 'supervisor-search',
    title: 'Create Your Thesis Timeline',
    description: 'Drag and drop key milestones, writing phases, and outreach onto your calendar.',
    featureId: 'create-timeline',
    status: 'ready',
  },
  {
    id: 'p2',
    stageId: 'supervisor-search',
    title: 'Confirm Research Methodology',
    description: 'Qualitative vs quantitative — Co-Pilot will help you decide based on your topic.',
    featureId: 'methodology',
    status: 'ready',
  },
  {
    id: 'p3',
    stageId: 'supervisor-search',
    title: 'Draft Thesis Proposal',
    description: 'AI-guided walkthrough: research question, methodology, and timeline.',
    featureId: 'copilot-proposal',
    status: 'ready',
  },
  {
    id: 'p4',
    stageId: 'supervisor-search',
    title: 'Agree Milestones with Supervisor',
    description: 'Align on key deadlines — submission dates, check-ins, draft reviews.',
    featureId: 'copilot-milestones',
    status: 'ready',
    nudge: 'Your planning deadline passed 3 days ago — want Co-Pilot to help you catch up?',
  },
  {
    id: 'p5',
    stageId: 'supervisor-search',
    title: 'Register Thesis at University',
    description: 'Complete the official registration before your university deadline.',
    featureId: 'copilot-registration',
    status: 'ready',
  },

  // ── Execution ─────────────────────────────────────────────────────
  {
    id: 'e1',
    stageId: 'planning',
    title: 'Conduct Literature Review',
    description: 'Co-Pilot helps you structure sources and identify gaps in existing research.',
    featureId: 'copilot-literature',
    status: 'ready',
  },
  {
    id: 'e2',
    stageId: 'planning',
    title: 'Find and Schedule Interview Partners',
    description: 'Match with domain experts for primary research interviews.',
    featureId: 'interview-partners',
    status: 'ready',
  },
  {
    id: 'e2b',
    stageId: 'planning',
    title: 'Find Your Thesis Twin',
    description: 'Get paired with one peer at the same stage for mutual accountability and check-ins.',
    featureId: 'thesis-twin',
    status: 'ready',
  },
  {
    id: 'e3',
    stageId: 'planning',
    title: 'Gather Primary Data',
    description: 'Conduct your surveys, experiments, or interviews — log progress here.',
    featureId: 'copilot-data',
    status: 'ready',
  },
  {
    id: 'e4',
    stageId: 'planning',
    title: 'Complete First Draft of Analysis',
    description: 'Turn your data into findings — Co-Pilot can review structure and logic.',
    featureId: 'copilot-analysis',
    status: 'ready',
  },

  // ── Writing & Finalization ────────────────────────────────────────
  {
    id: 'w3',
    stageId: 'execution-writing',
    title: 'Request a Draft Reader',
    description: 'Get matched with an expert or alumni who reviews a chapter and gives feedback.',
    featureId: 'draft-reader',
    status: 'ready',
  },
  {
    id: 'w5',
    stageId: 'execution-writing',
    title: 'Complete Your Alumni Profile',
    description: 'Leave feedback on your experience and opt in to help future students researching the same supervisor or topic.',
    featureId: 'thesis-alumni',
    status: 'ready',
  },
]

export interface FinalDecision {
  topicId: string
  supervisorId: string
  companyId: string | null
}

export interface TimelineEntry {
  id: string
  label: string
  category: 'milestone' | 'outreach' | 'writing' | 'research' | 'admin'
  week: number        // 1-based week offset from thesis start
  duration: number    // number of weeks
}

export interface SavedLiterature {
  id: string
  title: string
  authors: string[]
  year: string
  publisher: string
  isbn: string
  language: string
  subjects: string[]
  abstract: string
}

const EMPTY_CHAT_HISTORIES: ChatHistories = {
  'orientation': [],
  'topic-discovery': [],
  'supervisor-search': [],
  'planning': [],
  'execution-writing': [],
}

interface ThesisState {
  profile: ThesisProfile
  tasks: Task[]
  chatHistory: Message[]              // legacy — kept for migration
  chatHistories: ChatHistories        // per-stage chat histories
  knowledgeFacts: KnowledgeFact[]     // shared knowledge base across all stages
  thesisNotes: string[]
  universityGuidelines: string
  celebrateStage: ThesisStage | null
  favouriteTopicIds: string[]
  acceptedExpertIds: string[]
  shortlistedSupervisorIds: string[]
  savedMatchIds: string[]
  finalDecision: FinalDecision | null
  timeline: TimelineEntry[]
  savedLiterature: SavedLiterature[]
  surveyAnswers: Record<string, 'a' | 'b' | number> | null

  setStage: (stage: ThesisStage) => void
  setConcern: (concern: string) => void
  addAnswer: (answer: WizardAnswer) => void
  setIdentity: (name: string, email: string) => void
  completeOnboarding: () => void
  resetProfile: () => void
  completeFeature: (featureId: string) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  dismissNudge: (taskId: string) => void
  saveChatMessages: (msgs: Message[]) => void
  saveStageChatMessages: (stage: ThesisStage, msgs: Message[]) => void
  addKnowledgeFact: (fact: KnowledgeFact) => void
  addKnowledgeFacts: (facts: KnowledgeFact[]) => void
  removeKnowledgeFact: (id: string) => void
  addThesisNote: (note: string) => void
  removeThesisNote: (index: number) => void
  setUniversityGuidelines: (text: string) => void
  clearCelebration: () => void
  toggleFavouriteTopic: (topicId: string) => void
  addAcceptedExpert: (expertId: string) => void
  toggleShortlistedSupervisor: (supervisorId: string) => void
  toggleSavedMatch: (matchId: string) => void
  setFinalDecision: (decision: FinalDecision) => void
  setTimeline: (entries: TimelineEntry[]) => void
  addLiterature: (record: SavedLiterature) => void
  removeLiterature: (id: string) => void
  setSurveyAnswers: (answers: Record<string, 'a' | 'b' | number>) => void
  clearSurveyAnswers: () => void
}

const initialProfile: ThesisProfile = {
  stage: null,
  concern: null,
  completedOnboarding: false,
  answers: [],
  name: null,
  email: null,
}

export const useThesisStore = create<ThesisState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      tasks: DEFAULT_TASKS,
      chatHistory: [],
      chatHistories: { ...EMPTY_CHAT_HISTORIES },
      knowledgeFacts: [],
      thesisNotes: [],
      universityGuidelines: '',
      celebrateStage: null,
      favouriteTopicIds: [],
      acceptedExpertIds: [],
      shortlistedSupervisorIds: [],
      savedMatchIds: [],
      finalDecision: null,
      timeline: [],
      savedLiterature: [],
      surveyAnswers: null,

      setStage: (stage) =>
        set((s) => ({ profile: { ...s.profile, stage } })),
      setConcern: (concern) =>
        set((s) => ({ profile: { ...s.profile, concern } })),
      addAnswer: (answer) =>
        set((s) => ({
          profile: {
            ...s.profile,
            answers: [
              ...s.profile.answers.filter(
                (a) => a.questionIndex !== answer.questionIndex,
              ),
              answer,
            ],
          },
        })),
      setIdentity: (name, email) =>
        set((s) => ({ profile: { ...s.profile, name, email } })),
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, completedOnboarding: true } })),
      resetProfile: () =>
        set({
          profile: initialProfile,
          tasks: DEFAULT_TASKS,
          chatHistory: [],
          chatHistories: { ...EMPTY_CHAT_HISTORIES },
          knowledgeFacts: [],
          thesisNotes: [],
          universityGuidelines: '',
          celebrateStage: null,
          favouriteTopicIds: [],
          acceptedExpertIds: [],
          shortlistedSupervisorIds: [],
          savedMatchIds: [],
          finalDecision: null,
          timeline: [],
          savedLiterature: [],
          savedLiterature: [],
        }),
      completeFeature: (featureId) =>
        set((s) => {
          const updatedTasks = s.tasks.map((t) =>
            t.featureId === featureId && t.status !== 'done' ? { ...t, status: 'done' as TaskStatus } : t,
          )
          const currentStage = s.profile.stage ?? 'orientation'

          // Gate features: completing these force-advances the stage
          // (other tasks in the stage become optional)
          const GATE_FEATURES: Partial<Record<string, string>> = {
            'final-decision': 'topic-discovery',  // Final Decision gates stage 2
          }
          const isGate = GATE_FEATURES[featureId] === currentStage

          const stageTasks = updatedTasks.filter((t) => t.stageId === currentStage)
          const allDone = stageTasks.length > 0 && stageTasks.every((t) => t.status === 'done')
          const shouldAdvance = isGate || allDone
          const next = shouldAdvance ? nextStage(currentStage) : null
          return {
            tasks: updatedTasks,
            profile: next ? { ...s.profile, stage: next } : s.profile,
            celebrateStage: next ? currentStage : s.celebrateStage,
          }
        }),
      updateTaskStatus: (taskId, status) =>
        set((s) => {
          const updatedTasks = s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
          const currentStage = s.profile.stage ?? 'orientation'
          const stageTasks = updatedTasks.filter((t) => t.stageId === currentStage)
          const allDone = stageTasks.length > 0 && stageTasks.every((t) => t.status === 'done')
          const next = allDone ? nextStage(currentStage) : null
          return {
            tasks: updatedTasks,
            profile: next ? { ...s.profile, stage: next } : s.profile,
            celebrateStage: next ? currentStage : s.celebrateStage,
          }
        }),
      dismissNudge: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, nudge: undefined } : t)),
        })),
      saveChatMessages: (msgs) =>
        set({ chatHistory: msgs.slice(-60) }),
      saveStageChatMessages: (stage, msgs) =>
        set((s) => ({
          chatHistories: {
            ...s.chatHistories,
            [stage]: msgs.slice(-60),
          },
        })),
      addKnowledgeFact: (fact) =>
        set((s) => ({
          knowledgeFacts: [...s.knowledgeFacts, fact],
        })),
      addKnowledgeFacts: (facts) =>
        set((s) => {
          const existingContents = new Set(s.knowledgeFacts.map((f) => f.content.toLowerCase()))
          const newFacts = facts.filter((f) => !existingContents.has(f.content.toLowerCase()))
          if (newFacts.length === 0) return s
          return { knowledgeFacts: [...s.knowledgeFacts, ...newFacts] }
        }),
      removeKnowledgeFact: (id) =>
        set((s) => ({
          knowledgeFacts: s.knowledgeFacts.filter((f) => f.id !== id),
        })),
      addThesisNote: (note) =>
        set((s) => ({ thesisNotes: [...s.thesisNotes, note] })),
      removeThesisNote: (index) =>
        set((s) => ({ thesisNotes: s.thesisNotes.filter((_, i) => i !== index) })),
      setUniversityGuidelines: (text) =>
        set({ universityGuidelines: text }),
      clearCelebration: () =>
        set({ celebrateStage: null }),
      toggleFavouriteTopic: (topicId) =>
        set((s) => {
          const favs = s.favouriteTopicIds
          if (favs.includes(topicId)) {
            return { favouriteTopicIds: favs.filter((id) => id !== topicId) }
          }
          if (favs.length >= 3) return s
          return { favouriteTopicIds: [...favs, topicId] }
        }),
      addAcceptedExpert: (expertId) =>
        set((s) => ({
          acceptedExpertIds: s.acceptedExpertIds.includes(expertId)
            ? s.acceptedExpertIds
            : [...s.acceptedExpertIds, expertId],
        })),
      toggleShortlistedSupervisor: (supervisorId) =>
        set((s) => {
          const ids = s.shortlistedSupervisorIds
          if (ids.includes(supervisorId)) {
            return { shortlistedSupervisorIds: ids.filter((id) => id !== supervisorId) }
          }
          if (ids.length >= 3) return s
          return { shortlistedSupervisorIds: [...ids, supervisorId] }
        }),
      toggleSavedMatch: (matchId) =>
        set((s) => ({
          savedMatchIds: s.savedMatchIds.includes(matchId)
            ? s.savedMatchIds.filter((id) => id !== matchId)
            : [...s.savedMatchIds, matchId],
        })),
      setFinalDecision: (decision) =>
        set({ finalDecision: decision }),
      setTimeline: (entries) =>
        set({ timeline: entries }),
      addLiterature: (record) =>
        set((s) => ({
          savedLiterature: s.savedLiterature.some((r) => r.id === record.id)
            ? s.savedLiterature
            : [...s.savedLiterature, record],
        })),
      removeLiterature: (id) =>
        set((s) => ({
          savedLiterature: s.savedLiterature.filter((r) => r.id !== id),
        })),
      setSurveyAnswers: (answers) =>
        set({ surveyAnswers: answers }),
      clearSurveyAnswers: () =>
        set({ surveyAnswers: null }),
    }),
    { name: 'studyond-thesis-v4' },
  ),
)
