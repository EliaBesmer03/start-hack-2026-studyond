import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThesisProfile, ThesisStage, WizardAnswer } from '@/types/thesis'

export type TaskStatus = 'ready' | 'in-progress' | 'done'

export interface Task {
  id: string
  stageId: ThesisStage
  title: string
  description: string
  featureId: string          // links to a sidebar feature entry point
  status: TaskStatus
}

const DEFAULT_TASKS: Task[] = [
  // Orientation
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
    title: 'Explore Topic Areas',
    description: 'Browse curated company briefs and academic directions that match your profile.',
    featureId: 'topic-explore',
    status: 'ready',
  },
  // Topic & Supervisor
  {
    id: 't1',
    stageId: 'topic-discovery',
    title: 'Find Your Topic Match',
    description: 'AI-matched topics ranked by fit with your background and interests.',
    featureId: 'topic-match',
    status: 'ready',
  },
  {
    id: 't2',
    stageId: 'topic-discovery',
    title: 'Search for Supervisors',
    description: 'Identify professors aligned with your research direction and send outreach.',
    featureId: 'supervisor-search',
    status: 'ready',
  },
  // Planning
  {
    id: 'p1',
    stageId: 'supervisor-search',
    title: 'Draft Your Proposal with Co-Pilot',
    description: 'AI-guided walkthrough: research question, methodology, and timeline.',
    featureId: 'copilot-planning',
    status: 'ready',
  },
  {
    id: 'p2',
    stageId: 'supervisor-search',
    title: 'Choose Your Methodology',
    description: 'Qualitative vs. quantitative decision support grounded in your topic.',
    featureId: 'methodology',
    status: 'ready',
  },
  // Execution
  {
    id: 'e1',
    stageId: 'planning',
    title: 'Research with Co-Pilot',
    description: 'AI assistance with literature review, data questions, and progress check-ins.',
    featureId: 'copilot-execution',
    status: 'ready',
  },
  {
    id: 'e2',
    stageId: 'planning',
    title: 'Find Interview Partners',
    description: 'Match with domain experts for primary research interviews.',
    featureId: 'interview-partners',
    status: 'ready',
  },
  // Writing & Finalization
  {
    id: 'w1',
    stageId: 'execution-writing',
    title: 'Write with Co-Pilot',
    description: 'Draft support, supervisor feedback integration, and submission prep.',
    featureId: 'copilot-writing',
    status: 'ready',
  },
  {
    id: 'w2',
    stageId: 'execution-writing',
    title: 'Request a Draft Reader',
    description: 'Get matched with an expert or alumni who reviews your draft.',
    featureId: 'draft-reader',
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
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        })),
    }),
    { name: 'studyond-thesis' },
  ),
)
