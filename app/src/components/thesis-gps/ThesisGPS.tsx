import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logo from '@/assets/studyond.svg'
import { useThesisStore } from '@/stores/thesis-store'
import type { ThesisStage } from '@/types/thesis'

/* ------------------------------------------------------------------ */
/*  Identity step                                                       */
/* ------------------------------------------------------------------ */

function IdentityStep({
  onSubmit,
}: {
  onSubmit: (name: string, email: string) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = name.trim().length > 1 && isValidEmail

  return (
    <motion.div
      key="identity"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -80, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col gap-8"
    >
      <div className="space-y-2">
        <h1 className="ds-title-lg text-foreground">One last thing — who are you?</h1>
        <p className="ds-body text-muted-foreground">
          Your name and university email will be shown on your profile and used when you connect with supervisors or peers.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="ds-label mb-1.5 block text-foreground">Full name</label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Anna Müller"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="ds-label mb-1.5 block text-foreground">University email</label>
          <input
            type="email"
            placeholder="e.g. anna.mueller@student.ethz.ch"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && onSubmit(name.trim(), email.trim())}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
          <p className="ds-caption mt-1.5 text-muted-foreground/60">Use your university address — it helps verify your student status.</p>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(name.trim(), email.trim())}
          className="mt-2 w-full rounded-full bg-foreground py-3 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
        >
          Get started →
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Question data                                                      */
/* ------------------------------------------------------------------ */

interface Option {
  label: string
  value: string
  /** Maps to a ThesisStage when this is Q1 */
  stage?: ThesisStage
}

interface Question {
  title: string
  subtitle: string
  options: Option[]
}

const QUESTIONS: Question[] = [
  {
    title: "Where are you in your thesis journey?",
    subtitle: "This helps us tailor everything to your situation.",
    options: [
      {
        label: "Just starting to explore",
        value: "exploring",
        stage: "orientation",
      },
      {
        label: "I have interests, but no confirmed topic",
        value: "interests",
        stage: "topic-discovery",
      },
      {
        label: "I have a topic, but need a supervisor",
        value: "topic-no-supervisor",
        stage: "topic-discovery",
      },
      {
        label: "I have a topic and a supervisor",
        value: "topic-and-supervisor",
        stage: "supervisor-search",
      },
      {
        label: "I'm already deep into writing",
        value: "writing",
        stage: "planning",
      },
      {
        label: "Not sure",
        value: "not-sure",
        stage: "orientation",
      },
    ],
  },
  {
    title: "What field are you working in?",
    subtitle: "We'll use this to surface relevant topics and supervisors.",
    options: [
      { label: "Business & Economics", value: "business" },
      { label: "Computer Science & Engineering", value: "cs" },
      { label: "Social Sciences & Humanities", value: "social" },
      { label: "Natural Sciences & Medicine", value: "science" },
      { label: "Not sure yet", value: "not-sure" },
    ],
  },
  {
    title: "What would help you most right now?",
    subtitle: "This shapes how your co-pilot assists you going forward.",
    options: [
      { label: "A clear overview of what's ahead", value: "overview" },
      { label: "Help finding the right topic", value: "topic-help" },
      { label: "Connecting with the right supervisor", value: "supervisor-help" },
      { label: "A structured plan to stay on track", value: "structure" },
      { label: "Not sure", value: "not-sure" },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ThesisGPS() {
  const { setStage, setConcern, addAnswer, setIdentity, completeOnboarding } =
    useThesisStore()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selected, setSelected] = useState<(string | null)[]>(
    Array(QUESTIONS.length).fill(null),
  )

  // Identity step is after all questions
  const IDENTITY_STEP = QUESTIONS.length
  const totalSteps = QUESTIONS.length + 1
  const progress = ((step + 1) / totalSteps) * 100
  const isIdentityStep = step === IDENTITY_STEP
  const question = !isIdentityStep ? QUESTIONS[step] : null

  function selectOption(value: string) {
    const next = [...selected]
    next[step] = value
    setSelected(next)

    addAnswer({ questionIndex: step, value })

    if (step === 0) {
      const option = QUESTIONS[0].options.find((o) => o.value === value)
      if (option?.stage) setStage(option.stage)
    }

    if (step === 2) {
      setConcern(value)
    }

    // Auto-advance after short delay
    setTimeout(() => {
      setDirection(1)
      setStep(step + 1)
    }, 300)
  }

  function handleIdentity(name: string, email: string) {
    setIdentity(name, email)
    completeOnboarding()
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <img src={logo} alt="Studyond" className="h-7 w-auto" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Compass className="size-4" />
            <span className="ds-badge">Thesis GPS</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>

        <p className="ds-caption mt-2 text-muted-foreground">
          Step {step + 1} of {totalSteps}
        </p>

        {/* Question / identity area */}
        <div className="relative mt-10 flex flex-1 flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {isIdentityStep ? (
              <IdentityStep key="identity" onSubmit={handleIdentity} />
            ) : (
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col gap-8"
              >
                <div className="space-y-2">
                  <h1 className="ds-title-lg text-foreground">
                    {question!.title}
                  </h1>
                  <p className="ds-body text-muted-foreground">
                    {question!.subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {question!.options.map((option) => {
                    const isSelected = selected[step] === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => selectOption(option.value)}
                        className={`
                          group flex w-full cursor-pointer items-center rounded-xl border px-5 py-4
                          text-left transition-all duration-200
                          ${
                            isSelected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent'
                          }
                        `}
                      >
                        <span className="ds-body flex-1">{option.label}</span>
                        <span
                          className={`
                            flex size-5 items-center justify-center rounded-full border-2 transition-all duration-200
                            ${
                              isSelected
                                ? 'border-background bg-background'
                                : 'border-muted-foreground/40 group-hover:border-foreground/50'
                            }
                          `}
                        >
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="size-2 rounded-full bg-foreground"
                            />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back button */}
        <div className="mt-8 pb-6">
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={goBack}
              className="gap-1 rounded-full px-4 text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
