import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThesisProfile, ThesisStage, WizardAnswer } from '@/types/thesis'

interface ThesisState {
  profile: ThesisProfile
  setStage: (stage: ThesisStage) => void
  setConcern: (concern: string) => void
  addAnswer: (answer: WizardAnswer) => void
  completeOnboarding: () => void
  resetProfile: () => void
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
      resetProfile: () => set({ profile: initialProfile }),
    }),
    { name: 'studyond-thesis' },
  ),
)
