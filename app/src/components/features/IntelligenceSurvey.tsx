import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, SkipForward, RotateCcw, Sparkles } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'

/* ── Axis types ─────────────────────────────────────────────────────── */

type PAxis =
  | 'Intrapersonal' | 'Interpersonal' | 'Verbal'    | 'Logical'
  | 'Teaching'      | 'Spiritual'      | 'Natural'   | 'Bodily'
  | 'Spatial'       | 'Musical'

type AAxis =
  | 'STEM'          | 'Humanities'     | 'Business'        | 'Social Sciences'
  | 'Law & Politics'| 'Environment'    | 'Arts & Design'   | 'Health & Medicine'

/* ── Question types ─────────────────────────────────────────────────── */

interface ABQuestion<A> {
  type: 'ab'
  id: string
  question: string
  optionA: { text: string; axis: A }
  optionB: { text: string; axis: A }
}

interface RatingQuestion<A> {
  type: 'rating'
  id: string
  question: string
  axis: A
}

type PQuestion = ABQuestion<PAxis> | RatingQuestion<PAxis>
type AQuestion = ABQuestion<AAxis>

/* ── Personality questions ────────────────────────────────────────────── */

const P_QUESTIONS: PQuestion[] = [
  {
    type: 'ab', id: 'p1',
    question: "When you're facing a big life decision, what do you do first?",
    optionA: { text: "Sit alone and reflect on how you truly feel", axis: 'Intrapersonal' },
    optionB: { text: "Ask yourself what feels meaningful beyond the practical outcome", axis: 'Spiritual' },
  },
  {
    type: 'ab', id: 'p2',
    question: "In a group setting, which role energizes you most?",
    optionA: { text: "Reading the room and making everyone feel included", axis: 'Interpersonal' },
    optionB: { text: "Explaining something complex until everyone gets it", axis: 'Teaching' },
  },
  {
    type: 'ab', id: 'p3',
    question: "How do you prefer to solve a hard problem?",
    optionA: { text: "Write or talk through it — articulating it helps you think", axis: 'Verbal' },
    optionB: { text: "Break it into steps, look for patterns or rules", axis: 'Logical' },
  },
  {
    type: 'ab', id: 'p4',
    question: "When you're doing creative work, which medium feels most natural?",
    optionA: { text: "Visual — drawing, designing, imagining how something will look", axis: 'Spatial' },
    optionB: { text: "Sound — humming, noticing rhythm, thinking in melodies", axis: 'Musical' },
  },
  {
    type: 'rating', id: 'p5',
    question: "How often do you think through your hands — building, moving, crafting, or performing physically?",
    axis: 'Bodily',
  },
  {
    type: 'rating', id: 'p6',
    question: "How drawn are you to understanding living systems — ecosystems, animals, weather, biology?",
    axis: 'Natural',
  },
  {
    type: 'ab', id: 'p7',
    question: "When you remember a great story, what sticks with you more?",
    optionA: { text: "The exact words, dialogue, or way it was phrased", axis: 'Verbal' },
    optionB: { text: "The images, scenes, and how things looked", axis: 'Spatial' },
  },
  {
    type: 'ab', id: 'p8',
    question: "After an intense social event, what do you need?",
    optionA: { text: "Alone time to process how you feel about it", axis: 'Intrapersonal' },
    optionB: { text: "More conversation — replaying it with someone energizes you", axis: 'Interpersonal' },
  },
]

/* ── Academic questions (each axis appears exactly twice) ─────────────── */

const A_QUESTIONS: AQuestion[] = [
  {
    type: 'ab', id: 'a1',
    question: "When you encounter a complex phenomenon, what pulls you in?",
    optionA: { text: "Finding data, building models, testing how it works", axis: 'STEM' },
    optionB: { text: "Tracing its history and what it means for human experience", axis: 'Humanities' },
  },
  {
    type: 'ab', id: 'a2',
    question: "When analyzing how societies function, what lens do you reach for?",
    optionA: { text: "Incentives, markets, and economic behavior", axis: 'Business' },
    optionB: { text: "Power, identity, and how communities shape each other", axis: 'Social Sciences' },
  },
  {
    type: 'ab', id: 'a3',
    question: "When you imagine building a better world, what do you focus on first?",
    optionA: { text: "Better institutions, laws, and governance systems", axis: 'Law & Politics' },
    optionB: { text: "Restoring ecosystems and building sustainable systems", axis: 'Environment' },
  },
  {
    type: 'ab', id: 'a4',
    question: "Which kind of contribution feels most meaningful to you?",
    optionA: { text: "Shaping how people feel through beauty or storytelling", axis: 'Arts & Design' },
    optionB: { text: "Directly improving how people's bodies and minds function", axis: 'Health & Medicine' },
  },
  {
    type: 'ab', id: 'a5',
    question: "When approaching a research problem, what feels more satisfying?",
    optionA: { text: "Designing an experiment or model to generate clean data", axis: 'STEM' },
    optionB: { text: "Listening to people's stories to understand why they behave as they do", axis: 'Social Sciences' },
  },
  {
    type: 'ab', id: 'a6',
    question: "When you learn about a major historical turning point, what draws you deeper?",
    optionA: { text: "Its cultural and philosophical meaning — how it changed human thought", axis: 'Humanities' },
    optionB: { text: "The economic forces and business decisions that shaped it", axis: 'Business' },
  },
  {
    type: 'ab', id: 'a7',
    question: "If you could spend a day doing meaningful work, which sounds more fulfilling?",
    optionA: { text: "Mapping biodiversity or analyzing climate data in the field", axis: 'Environment' },
    optionB: { text: "Designing a public space, exhibition, or visual identity for a cause", axis: 'Arts & Design' },
  },
  {
    type: 'ab', id: 'a8',
    question: "When a public health crisis unfolds, what do you naturally focus on?",
    optionA: { text: "The biology, treatment protocols, and medical logistics", axis: 'Health & Medicine' },
    optionB: { text: "The government response, policies, and legal frameworks tested", axis: 'Law & Politics' },
  },
]

const ALL_QUESTIONS: (PQuestion | AQuestion)[] = [...P_QUESTIONS, ...A_QUESTIONS]
const TOTAL = ALL_QUESTIONS.length

/* ── Scoring: personality raw ─────────────────────────────────────────── */

const P_MAX: Record<PAxis, number> = {
  Intrapersonal: 2, Interpersonal: 2, Verbal: 2,  Logical: 1,
  Teaching:      1, Spiritual:      1, Natural: 10, Bodily: 10,
  Spatial:       2, Musical:        1,
}

function computePScores(answers: Record<string, 'a' | 'b' | number>): Record<PAxis, number> {
  const raw: Record<string, number> = {}
  for (const q of P_QUESTIONS) {
    const ans = answers[q.id]
    if (ans === undefined) continue
    if (q.type === 'ab') {
      const axis = ans === 'a' ? q.optionA.axis : q.optionB.axis
      raw[axis] = (raw[axis] ?? 0) + 1
    } else {
      raw[q.axis] = ans as number
    }
  }
  const axes: PAxis[] = ['Intrapersonal','Interpersonal','Verbal','Logical','Teaching','Spiritual','Natural','Bodily','Spatial','Musical']
  const out = {} as Record<PAxis, number>
  for (const ax of axes) {
    out[ax] = Math.round(((raw[ax] ?? 0) / P_MAX[ax]) * 10)
  }
  return out
}

function computeABase(answers: Record<string, 'a' | 'b' | number>): Record<AAxis, number> {
  const raw: Record<string, number> = {}
  for (const q of A_QUESTIONS) {
    const ans = answers[q.id]
    if (!ans) continue
    if (q.type === 'ab') {
      const axis = (ans === 'a' ? q.optionA : q.optionB).axis
      raw[axis] = (raw[axis] ?? 0) + 1
    }
  }
  const axes: AAxis[] = ['STEM','Humanities','Business','Social Sciences','Law & Politics','Environment','Arts & Design','Health & Medicine']
  const out = {} as Record<AAxis, number>
  for (const ax of axes) {
    out[ax] = Math.round(((raw[ax] ?? 0) / 2) * 10)
  }
  return out
}

/* ── Combined scoring: personality adjusts academic ──────────────────── */

function computeCombinedScores(
  aBase: Record<AAxis, number>,
  p: Record<PAxis, number>
): Record<AAxis, number> {
  // Personality → academic influence weights (per-axis contributions, 0–1)
  const boost: Record<AAxis, number> = {
    'STEM':             p.Logical * 0.55 + p.Spatial * 0.15 + p.Natural * 0.15,
    'Humanities':       p.Verbal  * 0.40 + p.Intrapersonal * 0.25 + p.Spiritual * 0.20 + p.Musical * 0.10,
    'Business':         p.Logical * 0.20 + p.Interpersonal * 0.25 + p.Teaching  * 0.15,
    'Social Sciences':  p.Interpersonal * 0.35 + p.Verbal * 0.20 + p.Teaching * 0.25,
    'Law & Politics':   p.Logical * 0.30 + p.Verbal * 0.30 + p.Intrapersonal * 0.10,
    'Environment':      p.Natural * 0.55 + p.Spiritual * 0.20 + p.Bodily * 0.10,
    'Arts & Design':    p.Spatial * 0.50 + p.Musical * 0.30 + p.Bodily * 0.10 + p.Intrapersonal * 0.10,
    'Health & Medicine':p.Natural * 0.25 + p.Interpersonal * 0.20 + p.Bodily * 0.25 + p.Teaching * 0.15,
  }

  // Normalize boost to 0–10 (theoretical max varies per axis, cap at 10)
  for (const ax of Object.keys(boost) as AAxis[]) {
    boost[ax] = Math.min(10, boost[ax])
  }

  // Final = 70% academic interest + 30% personality fit
  const combined = {} as Record<AAxis, number>
  const axes: AAxis[] = ['STEM','Humanities','Business','Social Sciences','Law & Politics','Environment','Arts & Design','Health & Medicine']
  for (const ax of axes) {
    combined[ax] = Math.min(10, Math.round(aBase[ax] * 0.70 + boost[ax] * 0.30))
  }
  return combined
}

/* ── Summary generator ────────────────────────────────────────────────── */

const FIELD_META: Record<AAxis, { topics: string; adjective: string }> = {
  'STEM':             { adjective: 'analytical', topics: 'data science, machine learning, engineering systems, or computational modeling' },
  'Humanities':       { adjective: 'interpretive', topics: 'cultural studies, philosophy, media, language, or history of ideas' },
  'Business':         { adjective: 'strategic', topics: 'entrepreneurship, digital transformation, organizational behavior, or market dynamics' },
  'Social Sciences':  { adjective: 'people-oriented', topics: 'behavioral research, public policy, sociology, or social psychology' },
  'Law & Politics':   { adjective: 'argumentative', topics: 'governance, compliance, regulation, legal tech, or international relations' },
  'Environment':      { adjective: 'systems-thinking', topics: 'sustainability, climate strategy, green innovation, or ecological economics' },
  'Arts & Design':    { adjective: 'creative', topics: 'UX research, design thinking, creative industries, or visual communication' },
  'Health & Medicine':{ adjective: 'care-driven', topics: 'public health, health systems, medical innovation, or bioethics' },
}

const P_TRAIT_LABELS: Record<PAxis, string> = {
  Intrapersonal: 'reflective',
  Interpersonal: 'socially attuned',
  Verbal: 'verbally expressive',
  Logical: 'analytical',
  Teaching: 'explanatory',
  Spiritual: 'meaning-driven',
  Natural: 'nature-curious',
  Bodily: 'hands-on',
  Spatial: 'visually oriented',
  Musical: 'rhythmically sensitive',
}

function generateSummary(combined: Record<AAxis, number>, pScores: Record<PAxis, number>): string {
  const axes: AAxis[] = ['STEM','Humanities','Business','Social Sciences','Law & Politics','Environment','Arts & Design','Health & Medicine']
  const sorted = [...axes].sort((a, b) => combined[b] - combined[a])
  const top1 = sorted[0]
  const top2 = sorted[1]
  const top3 = sorted[2]

  const topPAxes = (['Intrapersonal','Interpersonal','Verbal','Logical','Teaching','Spiritual','Natural','Bodily','Spatial','Musical'] as PAxis[])
    .sort((a, b) => pScores[b] - pScores[a])
  const trait1 = P_TRAIT_LABELS[topPAxes[0]]
  const trait2 = P_TRAIT_LABELS[topPAxes[1]]

  const m1 = FIELD_META[top1]
  const m2 = FIELD_META[top2]
  const m3 = FIELD_META[top3]

  const hasStrong2 = combined[top2] >= 5
  const hasStrong3 = combined[top3] >= 4

  let text = `Your profile points most strongly toward **${top1}** — suggesting thesis topics in ${m1.topics} could be a natural fit.`

  if (hasStrong2) {
    text += ` There's also a meaningful pull toward **${top2}**, which opens up ${m2.adjective} angles around ${m2.topics}.`
  }

  if (hasStrong3 && hasStrong2) {
    text += ` **${top3}** rounds out your top three, hinting at potential interest in ${m3.topics}.`
  }

  text += `\n\nOn the personality side, your ${trait1} and ${trait2} character traits reinforce this direction — they shape not just what topics appeal to you, but also how you're likely to approach the research itself.`

  text += `\n\nTreat this as a compass, not a verdict. Browse the topics with these areas in mind and notice what sparks curiosity.`

  return text
}

/* ── Spider chart SVG ─────────────────────────────────────────────────── */

const A_AXES_ORDERED: AAxis[] = [
  'STEM', 'Humanities', 'Business', 'Social Sciences',
  'Law & Politics', 'Environment', 'Arts & Design', 'Health & Medicine',
]

function SpiderChart({ scores, size = 340 }: { scores: number[]; size?: number }) {
  const axes = A_AXES_ORDERED
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.27
  const labelR = size * 0.40
  const n = axes.length
  const step = (2 * Math.PI) / n
  const start = -Math.PI / 2

  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(start + i * step),
    y: cy + r * Math.sin(start + i * step),
  })

  const rings = [2, 4, 6, 8, 10]
  const tips = axes.map((_, i) => pt(i, maxR))
  const scorePts = scores.map((s, i) => pt(i, Math.max((s / 10) * maxR, 1.5)))
  const scoreD = scorePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const textProps = (i: number) => {
    const angle = start + i * step
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const { x, y } = pt(i, labelR)
    const anchor: 'start' | 'end' | 'middle' = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle'
    const baseline: 'auto' | 'hanging' | 'middle' = sin < -0.4 ? 'auto' : sin > 0.4 ? 'hanging' : 'middle'
    return { x, y, anchor, baseline }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" overflow="visible">
      {rings.map((v, ri) => {
        const d = axes.map((_, i) => {
          const p = pt(i, (v / 10) * maxR)
          return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
        }).join(' ') + ' Z'
        return <path key={ri} d={d} fill="none" stroke="var(--border)" strokeWidth={ri === 4 ? '0.8' : '0.4'} />
      })}

      {tips.map((tip, i) => (
        <line key={i} x1={cx} y1={cy} x2={tip.x.toFixed(1)} y2={tip.y.toFixed(1)}
          stroke="var(--border)" strokeWidth="0.4" />
      ))}

      <path d={scoreD} fill="var(--foreground)" fillOpacity="0.07"
        stroke="var(--foreground)" strokeWidth="1.5" strokeLinejoin="round" />

      {scorePts.map((p, i) => scores[i] > 0 && (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="var(--foreground)" />
      ))}

      {axes.map((label, i) => {
        const { x, y, anchor, baseline } = textProps(i)
        const words = label.split(' ')
        const fontSize = 8.5

        if (words.length === 1) {
          return (
            <text key={i} x={x.toFixed(1)} y={y.toFixed(1)}
              textAnchor={anchor} dominantBaseline={baseline}
              fontSize={fontSize} fill="var(--foreground)"
              fontFamily="inherit" fontWeight="600" letterSpacing="0.06em">
              {label.toUpperCase()}
            </text>
          )
        }
        const mid = Math.ceil(words.length / 2)
        const line1 = words.slice(0, mid).join(' ').toUpperCase()
        const line2 = words.slice(mid).join(' ').toUpperCase()
        return (
          <text key={i} x={x.toFixed(1)} y={y.toFixed(1)} textAnchor={anchor as 'start' | 'end' | 'middle'}
            fontSize={fontSize} fill="var(--foreground)"
            fontFamily="inherit" fontWeight="600" letterSpacing="0.06em">
            <tspan x={x.toFixed(1)} dy="-0.55em">{line1}</tspan>
            <tspan x={x.toFixed(1)} dy="1.2em">{line2}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

/* ── Question card ─────────────────────────────────────────────────────── */

function QuestionCard({
  q,
  answer,
  onAB,
  onRating,
}: {
  q: PQuestion | AQuestion
  answer: 'a' | 'b' | number | undefined
  onAB: (v: 'a' | 'b') => void
  onRating: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="ds-title-sm text-foreground">{q.question}</p>

      {q.type === 'ab' ? (
        <div className="flex flex-col gap-3">
          {(['a', 'b'] as const).map((opt) => {
            const option = opt === 'a' ? q.optionA : q.optionB
            const selected = answer === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onAB(opt)}
                className={`group relative flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
                  selected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background hover:border-foreground/40 hover:bg-secondary/60'
                }`}
              >
                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ds-caption font-semibold transition-colors ${
                  selected
                    ? 'border-background/50 bg-background/20 text-background'
                    : 'border-border text-muted-foreground group-hover:border-foreground/30'
                }`}>
                  {opt.toUpperCase()}
                </span>
                <span className={`ds-body leading-snug ${selected ? 'text-background' : 'text-foreground'}`}>
                  {option.text}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onRating(v)}
                className={`flex flex-1 items-center justify-center rounded-lg border py-3 ds-label transition-all duration-150 ${
                  answer === v
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between ds-caption text-muted-foreground">
            <span>Not at all</span>
            <span>Very much</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Summary with markdown-like bold support ──────────────────────────── */

function SummaryText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-4">
      {text.split('\n\n').map((para, pi) => {
        const parts = para.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={pi} className="ds-body text-foreground leading-relaxed">
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        )
      })}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────────── */

type Phase = 'intro' | 'survey' | 'result'

export function IntelligenceSurvey() {
  const { completeFeature, surveyAnswers, setSurveyAnswers, clearSurveyAnswers } = useThesisStore()

  const [phase, setPhase] = useState<Phase>(surveyAnswers ? 'result' : 'intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | number>>(surveyAnswers ?? {})
  const [direction, setDirection] = useState(1)

  const currentQ = ALL_QUESTIONS[step]

  const handleSkip = () => {
    completeFeature('intelligence-survey')
  }

  const advance = (newAnswers: Record<string, 'a' | 'b' | number>) => {
    if (step < TOTAL - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      // All done — persist and show result
      setSurveyAnswers(newAnswers)
      completeFeature('intelligence-survey')
      setPhase('result')
    }
  }

  const handleAB = (val: 'a' | 'b') => {
    const next = { ...answers, [currentQ.id]: val }
    setAnswers(next)
    setTimeout(() => advance(next), 180)
  }

  const handleRating = (val: number) => {
    const next = { ...answers, [currentQ.id]: val }
    setAnswers(next)
  }

  const handleRatingNext = () => {
    advance(answers)
  }

  const goBack = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  // Derived: combined result
  const pScores = computePScores(answers)
  const aBase = computeABase(answers)
  const combined = computeCombinedScores(aBase, pScores)
  const combinedScores = A_AXES_ORDERED.map((ax) => combined[ax])

  const variants = {
    enter: (d: number) => ({ x: d * 48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -48, opacity: 0 }),
  }

  /* ── Intro ── */
  if (phase === 'intro') {
    return (
      <div className="mx-auto w-full max-w-xl flex flex-col gap-8 py-4">
        <div>
          <p className="ds-caption font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Optional · under 5 minutes
          </p>
          <h1 className="ds-title-lg text-foreground mb-4">Discover Your Profile</h1>
          <p className="ds-body text-muted-foreground leading-relaxed">
            Not sure where to start with your thesis? Answer 16 short questions and we'll map your interests and personality onto an academic profile — giving you a personalised starting point for your topic search.
          </p>
          <p className="ds-body text-muted-foreground leading-relaxed mt-3">
            There are no right or wrong answers. Just go with what feels true.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setPhase('survey')}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 ds-label text-background transition-all hover:bg-foreground/80"
          >
            Let's go
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 py-3 ds-label text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
          >
            <SkipForward className="size-4" />
            Skip — I know my interests
          </button>
        </div>
      </div>
    )
  }

  /* ── Survey (all 16 questions) ── */
  if (phase === 'survey') {
    const currentAns = answers[currentQ.id]
    const isRating = currentQ.type === 'rating'
    const progress = ((step) / TOTAL) * 100

    return (
      <div className="mx-auto w-full max-w-xl flex flex-col py-4">
        {/* Progress */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between ds-caption text-muted-foreground">
            <span>{step + 1} / {TOTAL}</span>
            <button
              type="button"
              onClick={handleSkip}
              className="text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              Skip survey
            </button>
          </div>
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <QuestionCard
              q={currentQ}
              answer={currentAns}
              onAB={handleAB}
              onRating={handleRating}
            />
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="ds-caption text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
          >
            ← Back
          </button>

          {/* Only show explicit Next for rating questions */}
          {isRating && (
            <button
              type="button"
              disabled={currentAns === undefined}
              onClick={handleRatingNext}
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 ds-label text-background transition-all hover:bg-foreground/80 disabled:opacity-30"
            >
              {step === TOTAL - 1 ? 'See my profile' : 'Next'}
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── Result ── */
  if (phase === 'result') {
    const summary = generateSummary(combined, pScores)
    const sorted = [...A_AXES_ORDERED].sort((a, b) => combined[b] - combined[a])

    return (
      <div className="flex flex-col gap-10 py-4">
        <div>
          <p className="ds-caption font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Your profile
          </p>
          <h1 className="ds-title-lg text-foreground">Academic Identity Map</h1>
        </div>

        {/* Spider web + top domains side by side */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          {/* Chart — takes 60% */}
          <div className="w-full md:w-[40%] shrink-0">
            <SpiderChart scores={combinedScores} size={500} />
          </div>

          {/* Top domains ranking — takes remaining 40% */}
          <div className="flex-1 flex flex-col gap-3">
            <p className="ds-label text-muted-foreground mb-1">Domain fit</p>
            {sorted.map((ax, i) => (
              <div key={ax} className="flex items-center gap-2">
                <span className="ds-caption text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="ds-caption text-foreground w-32 shrink-0 truncate">{ax}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${combined[ax] * 10}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-secondary/30 p-6 flex flex-col gap-4">
          <p className="ds-label font-semibold text-foreground">What this means for your thesis</p>
          <SummaryText text={summary} />
        </div>

        {/* Co-Pilot CTA */}
        <div className="flex items-start gap-4 rounded-xl border border-border px-5 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground mt-0.5">
            <Sparkles className="size-4 text-background" />
          </div>
          <div className="flex-1">
            <p className="ds-label text-foreground mb-1">Want to dig deeper?</p>
            <p className="ds-body text-muted-foreground">
              The Co-Pilot has your full profile and is happy to help you interpret these results, challenge them, or explore what kinds of thesis topics might emerge from your specific combination.
            </p>
          </div>
        </div>

        {/* Retake */}
        <button
          type="button"
          onClick={() => { clearSurveyAnswers(); setPhase('intro'); setStep(0); setAnswers({}) }}
          className="self-start flex items-center gap-2 ds-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Retake survey
        </button>
      </div>
    )
  }

  return null
}
