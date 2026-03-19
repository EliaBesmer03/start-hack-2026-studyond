export type ThesisStage =
  | 'orientation'
  | 'topic-discovery'
  | 'supervisor-search'
  | 'planning'
  | 'execution-writing'

export interface StageInfo {
  id: ThesisStage
  label: string
  description: string
}

export const STAGES: StageInfo[] = [
  {
    id: 'orientation',
    label: 'Orientation',
    description: 'Explore topics, understand your options',
  },
  {
    id: 'topic-discovery',
    label: 'Topic & Supervisor',
    description: 'Lock in your research question and professor',
  },
  {
    id: 'supervisor-search',
    label: 'Planning',
    description: 'Methodology, timeline, expectations',
  },
  {
    id: 'planning',
    label: 'Execution',
    description: 'Research, data, iterations',
  },
  {
    id: 'execution-writing',
    label: 'Writing & Finalization',
    description: 'Draft, feedback, submission',
  },
]

export interface WizardAnswer {
  questionIndex: number
  value: string
}

export interface ThesisProfile {
  stage: ThesisStage | null
  concern: string | null
  completedOnboarding: boolean
  answers: WizardAnswer[]
  name: string | null
  email: string | null
}
