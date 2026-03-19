/**
 * Feature 2E — Alumni Profile & Feedback
 *
 * End-of-journey screen. Two parts:
 * 1. Feedback on the thesis experience (supervisor, company, process).
 * 2. Opt-in to be discoverable by future students researching the same
 *    supervisor / company / topic area so they can reach out.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronRight, MessageSquare, Send,
  Shield, Star, Users,
} from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

type FeedbackStep = 'experience' | 'supervisor' | 'availability' | 'done'

interface ExperienceRatings {
  overall: number
  supervisorSupport: number
  companyCollaboration: number
  platformHelp: number
}

interface SupervisorFeedback {
  rating: number
  wouldRecommend: boolean | null
  comment: string
}

interface AvailabilityPrefs {
  openToOutreach: boolean
  topics: boolean
  supervisors: boolean
  companies: boolean
  anonymous: boolean
}

// ── Star rating input ─────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="ds-small text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`size-5 transition-colors ${
                n <= (hovered || value)
                  ? 'fill-foreground text-foreground'
                  : 'text-border'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 1: Overall experience ratings ───────────────────────────────

function ExperienceStep({
  ratings,
  onChange,
  onNext,
}: {
  ratings: ExperienceRatings
  onChange: (r: ExperienceRatings) => void
  onNext: () => void
}) {
  const allRated = Object.values(ratings).every((v) => v > 0)

  return (
    <motion.div
      key="experience"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-1 w-8 rounded-full ${i === 1 ? 'bg-foreground' : 'bg-border'}`} />
          ))}
        </div>
        <span className="ds-caption text-muted-foreground">1 / 3</span>
      </div>

      <h3 className="ds-title-sm mb-1 text-foreground">How was your thesis experience?</h3>
      <p className="ds-small mb-6 text-muted-foreground">
        Your feedback helps us improve Studyond and informs future students.
      </p>

      <div className="space-y-4 rounded-xl border border-border bg-background p-5">
        <StarRating
          label="Overall experience"
          value={ratings.overall}
          onChange={(v) => onChange({ ...ratings, overall: v })}
        />
        <div className="border-t border-border" />
        <StarRating
          label="Supervisor support"
          value={ratings.supervisorSupport}
          onChange={(v) => onChange({ ...ratings, supervisorSupport: v })}
        />
        <div className="border-t border-border" />
        <StarRating
          label="Company collaboration"
          value={ratings.companyCollaboration}
          onChange={(v) => onChange({ ...ratings, companyCollaboration: v })}
        />
        <div className="border-t border-border" />
        <StarRating
          label="Studyond platform"
          value={ratings.platformHelp}
          onChange={(v) => onChange({ ...ratings, platformHelp: v })}
        />
      </div>

      <button
        type="button"
        disabled={!allRated}
        onClick={onNext}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
      >
        Next <ChevronRight className="size-4" />
      </button>
    </motion.div>
  )
}

// ── Step 2: Supervisor feedback ───────────────────────────────────────

function SupervisorStep({
  feedback,
  onChange,
  onNext,
  onBack,
}: {
  feedback: SupervisorFeedback
  onChange: (f: SupervisorFeedback) => void
  onNext: () => void
  onBack: () => void
}) {
  const canAdvance = feedback.rating > 0 && feedback.wouldRecommend !== null

  return (
    <motion.div
      key="supervisor"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-1 w-8 rounded-full ${i <= 2 ? 'bg-foreground' : 'bg-border'}`} />
          ))}
        </div>
        <span className="ds-caption text-muted-foreground">2 / 3</span>
      </div>

      <h3 className="ds-title-sm mb-1 text-foreground">About your supervisor</h3>
      <p className="ds-small mb-6 text-muted-foreground">
        This helps future students evaluate supervisors before reaching out.
        Your name is not attached to this review.
      </p>

      <div className="space-y-5">
        {/* Star rating */}
        <div className="rounded-xl border border-border bg-background p-5">
          <StarRating
            label="Supervisor rating"
            value={feedback.rating}
            onChange={(v) => onChange({ ...feedback, rating: v })}
          />
        </div>

        {/* Would recommend */}
        <div>
          <p className="ds-label mb-2 text-foreground">Would you recommend this supervisor?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onChange({ ...feedback, wouldRecommend: val })}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 ds-label transition-colors ${
                  feedback.wouldRecommend === val
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:border-foreground/30'
                }`}
              >
                {feedback.wouldRecommend === val && <Check className="size-4" />}
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {/* Open comment */}
        <div>
          <label className="ds-label mb-1.5 block text-foreground">
            Any advice for future students? <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Very responsive and gave detailed feedback. Expects weekly check-ins so come prepared…"
            value={feedback.comment}
            onChange={(e) => onChange({ ...feedback, comment: e.target.value })}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border px-4 py-2.5 ds-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canAdvance}
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Step 3: Availability preferences ─────────────────────────────────

function AvailabilityStep({
  prefs,
  onChange,
  onSubmit,
  onBack,
}: {
  prefs: AvailabilityPrefs
  onChange: (p: AvailabilityPrefs) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const toggle = (key: keyof AvailabilityPrefs) =>
    onChange({ ...prefs, [key]: !prefs[key] })

  return (
    <motion.div
      key="availability"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className="h-1 w-8 rounded-full bg-foreground" />
          ))}
        </div>
        <span className="ds-caption text-muted-foreground">3 / 3</span>
      </div>

      <h3 className="ds-title-sm mb-1 text-foreground">Be there for the next student</h3>
      <p className="ds-small mb-6 text-muted-foreground">
        Future students may find you when researching the same supervisor, company, or topic.
        You can choose exactly when you want to be reachable.
      </p>

      {/* Master toggle */}
      <div
        className={`mb-4 flex items-center justify-between rounded-xl border p-4 transition-colors ${
          prefs.openToOutreach ? 'border-foreground bg-foreground/5' : 'border-border bg-background'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${prefs.openToOutreach ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
            <Users className="size-4" />
          </div>
          <div>
            <p className="ds-label text-foreground">Open to outreach</p>
            <p className="ds-caption text-muted-foreground">Let future students message you</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.openToOutreach}
          onClick={() => toggle('openToOutreach')}
          className={`relative h-6 w-11 rounded-full border-2 transition-colors ${
            prefs.openToOutreach ? 'border-foreground bg-foreground' : 'border-border bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full bg-background shadow transition-transform ${
              prefs.openToOutreach ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Visibility granularity */}
      {prefs.openToOutreach && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 overflow-hidden"
        >
          <p className="ds-caption mb-2 text-muted-foreground">Make me findable by students searching for…</p>
          <div className="space-y-2">
            {(
              [
                { key: 'supervisors' as const, label: 'My supervisor', desc: 'Students shortlisting the same professor' },
                { key: 'companies' as const,   label: 'My company',    desc: 'Students considering the same company partnership' },
                { key: 'topics' as const,      label: 'Similar topics', desc: 'Students researching a related research area' },
              ]
            ).map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  prefs[key]
                    ? 'border-foreground/30 bg-secondary/60'
                    : 'border-border bg-background hover:border-foreground/20'
                }`}
              >
                <div className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  prefs[key] ? 'border-foreground bg-foreground' : 'border-border'
                }`}>
                  {prefs[key] && <Check className="size-3 text-background" strokeWidth={2.5} />}
                </div>
                <div>
                  <p className="ds-label text-foreground">{label}</p>
                  <p className="ds-caption text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Anonymous option */}
          <button
            type="button"
            onClick={() => toggle('anonymous')}
            className={`mt-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              prefs.anonymous ? 'border-foreground/30 bg-secondary/60' : 'border-border bg-background hover:border-foreground/20'
            }`}
          >
            <div className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              prefs.anonymous ? 'border-foreground bg-foreground' : 'border-border'
            }`}>
              {prefs.anonymous && <Check className="size-3 text-background" strokeWidth={2.5} />}
            </div>
            <div>
              <p className="ds-label text-foreground">Show as anonymous alumnus</p>
              <p className="ds-caption text-muted-foreground">Your name is hidden until you accept a message request</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Privacy note */}
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
        <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <p className="ds-caption text-muted-foreground leading-snug">
          You can update or withdraw your availability at any time from your profile settings. Your email is never shared.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border px-4 py-2.5 ds-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-2.5 ds-label text-background transition-colors hover:bg-foreground/80"
        >
          <Send className="size-4" /> Submit & finish
        </button>
      </div>
    </motion.div>
  )
}

// ── Done screen ───────────────────────────────────────────────────────

function DoneScreen({ openToOutreach }: { openToOutreach: boolean }) {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-sm text-center"
    >
      <div className="mb-5 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-foreground">
          <span className="text-3xl">🎓</span>
        </div>
      </div>
      <h3 className="ds-title-sm text-foreground">Thank you, alumnus.</h3>
      <p className="ds-body mt-3 text-muted-foreground">
        Your feedback has been submitted. The next student to research your supervisor or topic will benefit from your experience.
      </p>

      {openToOutreach && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-left">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground">
            <MessageSquare className="size-4 text-background" />
          </div>
          <div>
            <p className="ds-label text-foreground">You're now discoverable</p>
            <p className="ds-caption text-muted-foreground">Future students can find and message you on Studyond.</p>
          </div>
        </div>
      )}

      <p className="ds-caption mt-6 text-muted-foreground/60">
        You can manage your alumni settings from your profile at any time.
      </p>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function ThesisAlumni() {
  const { profile, completeFeature } = useThesisStore()
  const supervisorName = (() => {
    const a = profile.answers.find((a) => a.questionIndex === 0)
    return a?.value ?? null
  })()

  const [step, setStep] = useState<FeedbackStep>('experience')
  const [ratings, setRatings] = useState<ExperienceRatings>({
    overall: 0, supervisorSupport: 0, companyCollaboration: 0, platformHelp: 0,
  })
  const [supervisorFeedback, setSupervisorFeedback] = useState<SupervisorFeedback>({
    rating: 0, wouldRecommend: null, comment: '',
  })
  const [prefs, setPrefs] = useState<AvailabilityPrefs>({
    openToOutreach: true, topics: true, supervisors: true, companies: true, anonymous: false,
  })

  const handleSubmit = () => {
    completeFeature('thesis-alumni')
    setStep('done')
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      {step !== 'done' && (
        <div className="mb-8">
          <h2 className="ds-title-md text-foreground">Alumni Profile</h2>
          <p className="ds-body mt-2 text-muted-foreground">
            You made it. Share your experience and help the next student find their way{supervisorName ? ` — just like someone helped you` : ''}.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'experience' && (
          <ExperienceStep
            ratings={ratings}
            onChange={setRatings}
            onNext={() => setStep('supervisor')}
          />
        )}
        {step === 'supervisor' && (
          <SupervisorStep
            feedback={supervisorFeedback}
            onChange={setSupervisorFeedback}
            onNext={() => setStep('availability')}
            onBack={() => setStep('experience')}
          />
        )}
        {step === 'availability' && (
          <AvailabilityStep
            prefs={prefs}
            onChange={setPrefs}
            onSubmit={handleSubmit}
            onBack={() => setStep('supervisor')}
          />
        )}
        {step === 'done' && <DoneScreen openToOutreach={prefs.openToOutreach} />}
      </AnimatePresence>
    </div>
  )
}
