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
    id: 'o2',
    stageId: 'orientation',
    title: 'Browse 3+ Topic Areas',
    description: 'Explore curated company briefs and academic directions that match your profile.',
    featureId: 'topic-explore',
    status: 'ready',
  },
  {
    id: 'o3',
    stageId: 'orientation',
    title: 'Read 2 Company Topic Briefs',
    description: 'Understand what companies are looking for and how collaboration works.',
    featureId: 'topic-explore',
    status: 'ready',
  },

  // ── Topic & Supervisor ───────────────────────────────────────────
  {
    id: 't1',
    stageId: 'topic-discovery',
    title: 'Shortlist 3 Topics',
    description: 'Use the AI matcher to narrow down to your top 3 and understand why they fit.',
    featureId: 'topic-match',
    status: 'ready',
  },
  {
    id: 't2',
    stageId: 'topic-discovery',
    title: 'Review Your Smart Matches',
    description: 'Accept, skip, or save bundled topic + supervisor + company matches curated for you.',
    featureId: 'smart-match',
    status: 'ready',
  },
  {
    id: 't3',
    stageId: 'topic-discovery',
    title: 'Identify 3 Potential Supervisors',
    description: 'Search professors aligned with your research direction.',
    featureId: 'supervisor-search',
    status: 'ready',
  },
  {
    id: 't4',
    stageId: 'topic-discovery',
    title: 'Send First Supervisor Outreach',
    description: 'Draft and send a personalised email — Co-Pilot can help you write it.',
    featureId: 'supervisor-search',
    status: 'ready',
    nudge: 'Outreach sent over 2 weeks ago with no reply — want Co-Pilot to help you follow up?',
  },

  // ── Planning ─────────────────────────────────────────────────────
  {
    id: 'p1',
    stageId: 'supervisor-search',
    title: 'Confirm Research Methodology',
    description: 'Qualitative vs quantitative — Co-Pilot will help you decide based on your topic.',
    featureId: 'methodology',
    status: 'ready',
  },
  {
    id: 'p2',
    stageId: 'supervisor-search',
    title: 'Draft Thesis Proposal',
    description: 'AI-guided walkthrough: research question, methodology, and timeline.',
    featureId: 'copilot-planning',
    status: 'ready',
  },
  {
    id: 'p3',
    stageId: 'supervisor-search',
    title: 'Agree Milestones with Supervisor',
    description: 'Align on key deadlines — submission dates, check-ins, draft reviews.',
    featureId: 'copilot-planning',
    status: 'ready',
    nudge: 'Your planning deadline passed 3 days ago — want Co-Pilot to help you catch up?',
  },
  {
    id: 'p4',
    stageId: 'supervisor-search',
    title: 'Register Thesis at University',
    description: 'Complete the official registration before your university deadline.',
    featureId: 'copilot-planning',
    status: 'ready',
  },

  // ── Execution ─────────────────────────────────────────────────────
  {
    id: 'e1',
    stageId: 'planning',
    title: 'Conduct Literature Review',
    description: 'Co-Pilot helps you structure sources and identify gaps in existing research.',
    featureId: 'copilot-execution',
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
    featureId: 'copilot-execution',
    status: 'ready',
  },
  {
    id: 'e4',
    stageId: 'planning',
    title: 'Complete First Draft of Analysis',
    description: 'Turn your data into findings — Co-Pilot can review structure and logic.',
    featureId: 'copilot-execution',
    status: 'ready',
  },

  // ── Writing & Finalization ────────────────────────────────────────
  {
    id: 'w1',
    stageId: 'execution-writing',
    title: 'Write Introduction and Conclusion',
    description: 'Frame your thesis with clarity — Co-Pilot reviews scope and argument.',
    featureId: 'copilot-writing',
    status: 'ready',
  },
  {
    id: 'w2',
    stageId: 'execution-writing',
    title: 'Incorporate Supervisor Feedback',
    description: 'Systematically address all comments before your next check-in.',
    featureId: 'copilot-writing',
    status: 'ready',
  },
  {
    id: 'w3',
    stageId: 'execution-writing',
    title: 'Request a Draft Reader',
    description: 'Get matched with an expert or alumni who reviews a chapter and gives feedback.',
    featureId: 'draft-reader',
    status: 'ready',
  },
  {
    id: 'w4',
    stageId: 'execution-writing',
    title: 'Submit Final Thesis',
    description: 'Check formatting requirements and submit before your official deadline.',
    featureId: 'copilot-writing',
    status: 'ready',
  },
]

interface ThesisState {
  profile: ThesisProfile
  tasks: Task[]
  setStage: (stage: ThesisStage) => void
  setConcern: (concern: string) => void
  addAnswer: (answer: WizardAnswer) => void
  completeOnboarding: () => void
  resetProfile: () => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  dismissNudge: (taskId: string) => void
}

const initialProfile: ThesisProfile = {
  stage: null,
  concern: null,
  completedOnboarding: false,
  answers: [],
}

export const useThesisStore = create<ThesisState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      tasks: DEFAULT_TASKS,
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
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, completedOnboarding: true } })),
      resetProfile: () => set({ profile: initialProfile, tasks: DEFAULT_TASKS }),
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
          }
        }),
      dismissNudge: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, nudge: undefined } : t)),
        })),
    }),
    { name: 'studyond-thesis-v2' },
  ),
)
