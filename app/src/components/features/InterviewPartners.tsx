/**
 * Feature: Interviews
 * Part 1 — Find & contact interview partners (experts from SmartMatch + guided search).
 * Part 2 — Upload a voice recording for transcription with timestamps and speaker labels.
 */

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Building2, Check, Send,
  Video, Mic, FileText, ChevronLeft, Sparkles, X, Mail,
  Upload, Loader2, Languages, Users2, ChevronDown, Trash2,
} from 'lucide-react'
import { experts, companies, fields, byId, type Expert } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'

// ── Types ─────────────────────────────────────────────────────────────

type InterviewFormat = 'remote' | 'in-person' | 'async'

interface Answers {
  topic: string
  expertise: string
  format: InterviewFormat | null
}

interface TranscriptSegment {
  speaker: string
  start: string
  end: string
  text: string
}

interface TranscriptionJob {
  file: File
  language: string
  speakers: number
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  segments: TranscriptSegment[]
  errorMsg?: string
}


// ── Gladia language codes ──────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'ru', label: 'Russian' },
]

// ── Helpers ────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function scoreExpert(expert: Expert, answers: Answers): number {
  let score = 0
  const topicWords = answers.topic.toLowerCase().split(/\s+/)
  const expertWords = [
    ...(expert.about ?? '').toLowerCase().split(/\s+/),
    ...expert.fieldIds,
    expert.title.toLowerCase(),
  ]
  topicWords.forEach((w) => { if (w.length > 3 && expertWords.some((e) => e.includes(w))) score += 15 })
  const expertiseWords = answers.expertise.toLowerCase().split(/\s+/)
  expertiseWords.forEach((w) => { if (w.length > 3 && expertWords.some((e) => e.includes(w))) score += 12 })
  if (expert.offerInterviews) score += 25
  if (answers.format === 'async' || answers.format === 'remote') score += 10
  return Math.min(score, 99)
}

function buildOutreach(expert: Expert, answers: Answers): string {
  const company = byId(companies, expert.companyId)
  return `Hi ${expert.firstName},

I'm a thesis student researching "${answers.topic}". I'm looking for practitioners with expertise in ${answers.expertise} to speak with for my primary research.

I came across your profile through Studyond — your work at ${company?.name ?? 'your company'} on ${expert.title.toLowerCase()} seems directly relevant to what I'm investigating.

Would you be open to a ${answers.format === 'async' ? 'short async Q&A (written)' : answers.format === 'remote' ? '30-minute video call' : 'brief in-person conversation'}? I'd be happy to share my research brief beforehand.

Best regards`
}

const GLADIA_API_KEY = 'd1c6f204-476a-4342-99b4-0c533b044c67'

async function runTranscription(job: TranscriptionJob): Promise<TranscriptSegment[]> {
  // 1. Upload the file
  const formData = new FormData()
  formData.append('audio', job.file)
  const uploadRes = await fetch('https://api.gladia.io/v2/upload', {
    method: 'POST',
    headers: { 'x-gladia-key': GLADIA_API_KEY },
    body: formData,
  })
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => uploadRes.statusText)
    throw new Error(`Upload failed (${uploadRes.status}): ${errText}`)
  }
  const { audio_url } = await uploadRes.json() as { audio_url: string }

  // 2. Start transcription with speaker diarization
  const transcriptRes = await fetch('https://api.gladia.io/v2/pre-recorded', {
    method: 'POST',
    headers: { 'x-gladia-key': GLADIA_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url,
      diarization: true,
      diarization_config: { number_of_speakers: job.speakers },
    }),
  })
  if (!transcriptRes.ok) {
    const errText = await transcriptRes.text().catch(() => transcriptRes.statusText)
    throw new Error(`Transcription request failed (${transcriptRes.status}): ${errText}`)
  }
  const { result_url } = await transcriptRes.json() as { id: string; result_url: string }

  // 3. Poll until done
  while (true) {
    await new Promise((r) => setTimeout(r, 2000))
    const pollRes = await fetch(result_url, {
      headers: { 'x-gladia-key': GLADIA_API_KEY },
    })
    if (!pollRes.ok) throw new Error(`Poll failed (${pollRes.status}): ${pollRes.statusText}`)
    const data = await pollRes.json() as {
      status: 'queued' | 'processing' | 'done' | 'error'
      error_code?: number
      result?: {
        transcription: {
          utterances: { speaker: number; start: number; end: number; text: string }[]
        }
      }
    }
    if (data.status === 'error') throw new Error(`Transcription error (code: ${data.error_code})`)
    if (data.status === 'done') {
      return (data.result?.transcription.utterances ?? []).map((u) => ({
        speaker: `Speaker ${u.speaker + 1}`,
        start: formatTime(u.start),
        end: formatTime(u.end),
        text: u.text,
      }))
    }
  }
}

// ── Expert detail drawer ──────────────────────────────────────────────

function ExpertDrawer({ expert, answers, onConnect, sent, onClose }: {
  expert: Expert; answers: Answers; onConnect: (id: string) => void; sent: boolean; onClose: () => void
}) {
  const [showMessage, setShowMessage] = useState(false)
  const company = byId(companies, expert.companyId)
  const expertFields = expert.fieldIds.map((fid) => byId(fields, fid)?.name ?? fid)
  const message = buildOutreach(expert, answers)

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground text-background ds-title-sm">
              {expert.firstName[0]}{expert.lastName[0]}
            </div>
            <div>
              <h2 className="ds-title-sm text-foreground">{expert.firstName} {expert.lastName}</h2>
              <p className="ds-small mt-0.5 text-muted-foreground">{expert.title}</p>
              {company && (
                <p className="ds-caption mt-1 flex items-center gap-1 text-muted-foreground">
                  <Building2 className="size-3" />{company.name}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {expert.offerInterviews && (
                  <span className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">Open to interviews</span>
                )}
                {expertFields.slice(0, 3).map((f) => (
                  <span key={f} className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {expert.about && (
            <div className="border-b border-border px-6 py-5">
              <p className="ds-label mb-2 text-foreground">About</p>
              <p className="ds-small text-muted-foreground leading-relaxed">{expert.about}</p>
            </div>
          )}
          {expertFields.length > 0 && (
            <div className="border-b border-border px-6 py-5">
              <p className="ds-label mb-2 text-foreground">Research fields</p>
              <div className="flex flex-wrap gap-1.5">
                {expertFields.map((f) => (
                  <span key={f} className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>
          )}
          <div className="border-b border-border px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="ds-label text-foreground">Suggested outreach message</p>
              <button type="button" onClick={() => setShowMessage((o) => !o)} className="ds-caption text-muted-foreground transition-colors hover:text-foreground">
                {showMessage ? 'Hide' : 'Preview'}
              </button>
            </div>
            <AnimatePresence>
              {showMessage && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <pre className="ds-small whitespace-pre-wrap font-sans text-foreground leading-relaxed">{message}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!showMessage && <p className="ds-small text-muted-foreground/60">A personalised message is ready to send based on your research topic.</p>}
          </div>
          {company && (
            <div className="px-6 py-5">
              <p className="ds-label mb-2 text-foreground">Contact</p>
              <a href={`mailto:${expert.firstName.toLowerCase()}.${expert.lastName.toLowerCase()}@example.com`}
                className="ds-small flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <Mail className="size-3.5" />
                {expert.firstName.toLowerCase()}.{expert.lastName.toLowerCase()}@{company.name.toLowerCase().replace(/\s/g, '')}.com
              </a>
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-border px-6 py-4">
          {sent ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3" strokeWidth={2.5} /></span>
              <p className="ds-label text-foreground">Request sent</p>
            </div>
          ) : (
            <button type="button" onClick={() => { onConnect(expert.id); onClose() }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 ds-label text-background transition-colors hover:bg-foreground/80">
              <Send className="size-4" />Send interview request
            </button>
          )}
        </div>
      </motion.aside>
    </>
  )
}

// ── Question step ─────────────────────────────────────────────────────

function QuestionStep({ step, total, title, children }: { step: number; total: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i < step ? 'w-8 bg-foreground' : i === step - 1 ? 'w-8 bg-foreground' : 'w-4 bg-border'}`} />
          ))}
        </div>
        <span className="ds-caption text-muted-foreground">{step} / {total}</span>
      </div>
      <h3 className="ds-title-sm mb-4 text-foreground">{title}</h3>
      {children}
    </motion.div>
  )
}

// ── Expert card ───────────────────────────────────────────────────────

function ExpertCard({ expert, score, onConnect, sent, preMatched, onOpen }: {
  expert: Expert; score: number; onConnect: (id: string) => void; sent: boolean; preMatched?: boolean; onOpen: (e: Expert) => void
}) {
  const company = byId(companies, expert.companyId)
  const expertFields = expert.fieldIds.slice(0, 2).map((fid) => byId(fields, fid)?.name ?? fid)

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3.5" strokeWidth={2.5} /></span>
        <div>
          <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
          <p className="ds-caption text-muted-foreground">Request sent via Direct Messaging</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onClick={() => onOpen(expert)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-background transition-shadow duration-150 hover:border-foreground/20 hover:shadow-md">
      <div className="flex items-start justify-between px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="ds-label text-foreground">{expert.firstName} {expert.lastName}</p>
            {expert.offerInterviews && <span className="rounded-full bg-secondary px-2 py-0.5 ds-badge font-medium text-foreground">Open to interviews</span>}
            {preMatched && (
              <span className="rounded-full bg-ai px-2 py-0.5 ds-badge font-medium text-white flex items-center gap-1">
                <Sparkles className="size-2.5" />Matched
              </span>
            )}
          </div>
          <p className="ds-small mt-0.5 text-muted-foreground">{expert.title}</p>
          <p className="ds-caption mt-1 flex items-center gap-1 text-muted-foreground"><Building2 className="size-3" />{company?.name}</p>
        </div>
        <span className="ds-badge rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">{score}% fit</span>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {expertFields.map((f) => <span key={f} className="ds-caption rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground">{f}</span>)}
      </div>
      {expert.about && <p className="ds-small border-t border-border px-4 py-3 text-muted-foreground line-clamp-2">{expert.about}</p>}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="ds-caption text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">View details →</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onConnect(expert.id) }}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 ds-caption text-background transition-colors hover:bg-foreground/80">
          <Send className="size-3" />Send request
        </button>
      </div>
    </motion.div>
  )
}

// ── Transcription section ─────────────────────────────────────────────

function TranscriptionSection() {
  const [job, setJob] = useState<TranscriptionJob | null>(null)
  const [language, setLanguage] = useState('en')
  const [speakers, setSpeakers] = useState(2)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) return
    setJob({ file, language, speakers, status: 'idle', segments: [] })
  }, [language, speakers])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleTranscribe = async () => {
    if (!job) return
    const currentJob: TranscriptionJob = { ...job, language, speakers, status: 'uploading' }
    setJob(currentJob)
    try {
      setJob((j) => j ? { ...j, status: 'processing' } : j)
      const segments = await runTranscription({ ...currentJob, status: 'processing' })
      setJob((j) => j ? { ...j, status: 'done', segments } : j)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transcription failed. Please try again.'
      setJob((j) => j ? { ...j, status: 'error', errorMsg: msg } : j)
    }
  }

  const speakerColors: Record<string, string> = {}
  const colorList = ['text-foreground', 'text-muted-foreground', 'text-foreground/70', 'text-muted-foreground/70']
  job?.segments.forEach((seg) => {
    if (!speakerColors[seg.speaker]) {
      speakerColors[seg.speaker] = colorList[Object.keys(speakerColors).length % colorList.length]
    }
  })

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="mb-5">
        <h3 className="ds-title-sm text-foreground">Transcribe Interview Recording</h3>
        <p className="ds-body mt-1.5 text-muted-foreground">
          Upload an audio or video file to get a timestamped transcript with speaker labels.
        </p>
      </div>

      {/* Settings row */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {/* Language */}
        <div>
          <label className="ds-caption mb-1.5 flex items-center gap-1.5 text-muted-foreground">
            <Languages className="size-3" />Language
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={job?.status === 'uploading' || job?.status === 'processing'}
              className="ds-caption w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-3 pr-8 text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Speakers */}
        <div>
          <label className="ds-caption mb-1.5 flex items-center gap-1.5 text-muted-foreground">
            <Users2 className="size-3" />Speakers
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <button
              type="button"
              onClick={() => setSpeakers((n) => Math.max(1, n - 1))}
              disabled={speakers <= 1 || job?.status === 'uploading' || job?.status === 'processing'}
              className="flex size-6 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
            >−</button>
            <span className="ds-label flex-1 text-center text-foreground">{speakers}</span>
            <button
              type="button"
              onClick={() => setSpeakers((n) => Math.min(6, n + 1))}
              disabled={speakers >= 6 || job?.status === 'uploading' || job?.status === 'processing'}
              className="flex size-6 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
            >+</button>
          </div>
          <p className="ds-caption mt-1 text-muted-foreground/60">max 6</p>
        </div>
      </div>

      {/* Drop zone */}
      {!job && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
            dragging ? 'border-foreground bg-secondary/40' : 'border-border hover:border-foreground/30 hover:bg-secondary/20'
          }`}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Upload className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="ds-label text-foreground">Drop audio or video file here</p>
            <p className="ds-caption mt-0.5 text-muted-foreground">or click to browse — MP3, M4A, WAV, MP4, MOV</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* File ready to transcribe */}
      {job && job.status === 'idle' && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Mic className="size-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="ds-label truncate text-foreground">{job.file.name}</p>
              <p className="ds-caption text-muted-foreground">{(job.file.size / 1024 / 1024).toFixed(1)} MB · Gladia · {LANGUAGES.find((l) => l.code === language)?.label} · {speakers} speaker{speakers !== 1 ? 's' : ''}</p>
            </div>
            <button type="button" onClick={() => setJob(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <Trash2 className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleTranscribe}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80"
          >
            <Mic className="size-4" />
            Transcribe recording
          </button>
        </div>
      )}

      {/* Processing */}
      {job && (job.status === 'uploading' || job.status === 'processing') && (
        <div className="rounded-xl border border-border bg-background p-6 text-center">
          <Loader2 className="mx-auto mb-3 size-8 animate-spin text-muted-foreground" />
          <p className="ds-label text-foreground">
            {job.status === 'uploading' ? 'Uploading file…' : 'Transcribing with Gladia…'}
          </p>
          <p className="ds-caption mt-1 text-muted-foreground">
            {job.status === 'processing' ? 'Diarizing speakers and generating timestamps' : 'This usually takes 1–3 minutes'}
          </p>
        </div>
      )}

      {/* Error */}
      {job && job.status === 'error' && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="ds-label text-destructive">{job.errorMsg}</p>
          <button type="button" onClick={() => setJob(null)} className="ds-caption mt-2 text-muted-foreground hover:text-foreground">Try again</button>
        </div>
      )}

      {/* Transcript */}
      {job && job.status === 'done' && job.segments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="ds-label text-foreground">{job.segments.length} segments · {job.file.name}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const lines: string[] = []
                  let currentSpeaker = ''
                  let currentLines: string[] = []
                  for (const s of job.segments) {
                    if (s.speaker !== currentSpeaker) {
                      if (currentSpeaker) lines.push(`**${currentSpeaker}** *(${currentLines[0]})*\n${currentLines.slice(1).join(' ')}`.trimEnd())
                      currentSpeaker = s.speaker
                      currentLines = [s.start, s.text]
                    } else {
                      currentLines.push(s.text)
                    }
                  }
                  if (currentSpeaker) lines.push(`**${currentSpeaker}** *(${currentLines[0]})*\n${currentLines.slice(1).join(' ')}`.trimEnd())
                  const md = `# Transcript — ${job.file.name}\n\n` + lines.join('\n\n')
                  const blob = new Blob([md], { type: 'text/markdown' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = job.file.name.replace(/\.[^.]+$/, '') + '_transcript.md'
                  a.click()
                }}
                className="ds-caption flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <FileText className="size-3.5" />Export .md
              </button>
              <button type="button" onClick={() => setJob(null)} className="ds-caption text-muted-foreground hover:text-foreground">
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="divide-y divide-border">
              {job.segments.reduce<{ speaker: string; start: string; texts: string[] }[]>((groups, seg) => {
                const last = groups[groups.length - 1]
                if (last && last.speaker === seg.speaker) {
                  last.texts.push(seg.text)
                } else {
                  groups.push({ speaker: seg.speaker, start: seg.start, texts: [seg.text] })
                }
                return groups
              }, []).map((group, i) => (
                <div key={i} className="flex gap-4 px-5 py-3.5">
                  <div className="shrink-0 pt-0.5" style={{ minWidth: 68 }}>
                    <span className="ds-caption font-mono text-muted-foreground/60">{group.start}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`ds-caption mb-1 font-semibold ${speakerColors[group.speaker] ?? 'text-foreground'}`}>
                      {group.speaker}
                    </p>
                    <p className="ds-body text-foreground leading-relaxed">{group.texts.join(' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function InterviewPartners() {
  const { completeFeature, addAcceptedExpert, acceptedExpertIds } = useThesisStore()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Answers>({ topic: '', expertise: '', format: null })
  const [results, setResults] = useState<{ expert: Expert; score: number }[] | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [openExpert, setOpenExpert] = useState<Expert | null>(null)

  const preMatchedExperts = acceptedExpertIds
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean) as Expert[]

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1)
    } else {
      const scored = experts
        .filter((e) => !acceptedExpertIds.includes(e.id))
        .filter((e) => e.offerInterviews || Math.random() > 0.3)
        .map((e) => ({ expert: e, score: scoreExpert(e, answers) }))
        .filter((r) => r.score > 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      setResults(scored)
      setStep(4)
    }
  }

  const canAdvance =
    step === 1 ? answers.topic.trim().length > 8 :
    step === 2 ? answers.expertise.trim().length > 4 :
    step === 3 ? answers.format !== null : false

  const handleConnect = (id: string) => {
    addAcceptedExpert(id)
    completeFeature('interview-partners')
    setSent((prev) => new Set([...prev, id]))
  }

  const defaultAnswers: Answers = { topic: 'thesis research', expertise: 'industry expertise', format: 'remote' }
  const drawerAnswers = answers.topic.length > 0 ? answers : defaultAnswers

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-8">
        <h2 className="ds-title-md text-foreground">Interviews</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Find and contact interview partners, then transcribe your recordings with speaker labels and timestamps.
          {preMatchedExperts.length > 0 && ' Experts from your Smart Match are ready to contact.'}
        </p>
      </div>

      {/* Pre-matched experts */}
      {preMatchedExperts.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-3.5 text-ai-solid" />
            <p className="ds-label text-foreground">From your Smart Match</p>
          </div>
          <div className="space-y-3">
            {preMatchedExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} score={90}
                onConnect={handleConnect} sent={sent.has(expert.id)} preMatched onOpen={setOpenExpert} />
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <p className="ds-label mb-1 text-foreground">Find additional experts</p>
            <p className="ds-small text-muted-foreground">Describe your research to get matched with more interview partners.</p>
          </div>
        </div>
      )}

      {/* Guided search */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <QuestionStep key="q1" step={1} total={3} title="What are your interviews about?">
            <textarea rows={3} placeholder="e.g. AI-driven demand forecasting for perishable goods in retail supply chains…"
              value={answers.topic} onChange={(e) => setAnswers((a) => ({ ...a, topic: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none" />
            <button type="button" disabled={!canAdvance} onClick={handleNext}
              className="mt-4 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40">
              Next <ArrowRight className="size-4" />
            </button>
          </QuestionStep>
        )}
        {step === 2 && (
          <QuestionStep key="q2" step={2} total={3} title="What type of expertise are you looking for?">
            <textarea rows={2} placeholder="e.g. supply chain operations, machine learning applications in logistics…"
              value={answers.expertise} onChange={(e) => setAnswers((a) => ({ ...a, expertise: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none" />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 rounded-full border border-border px-4 py-2 ds-label text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="size-4" /> Back
              </button>
              <button type="button" disabled={!canAdvance} onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40">
                Next <ArrowRight className="size-4" />
              </button>
            </div>
          </QuestionStep>
        )}
        {step === 3 && (
          <QuestionStep key="q3" step={3} total={3} title="Preferred interview format?">
            <div className="flex flex-col gap-3">
              {([
                { id: 'remote' as InterviewFormat, label: 'Video call (remote)', icon: Video, desc: '30–45 min, Zoom or Teams' },
                { id: 'in-person' as InterviewFormat, label: 'In-person', icon: Mic, desc: 'At their office or a neutral location' },
                { id: 'async' as InterviewFormat, label: 'Async (written Q&A)', icon: FileText, desc: 'Send questions, they respond in writing' },
              ] as const).map(({ id, label, icon: Icon, desc }) => (
                <button key={id} type="button" onClick={() => setAnswers((a) => ({ ...a, format: id }))}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${answers.format === id ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:border-foreground/30'}`}>
                  <Icon className="size-5 shrink-0" />
                  <div>
                    <p className="ds-label">{label}</p>
                    <p className={`ds-caption ${answers.format === id ? 'text-background/70' : 'text-muted-foreground'}`}>{desc}</p>
                  </div>
                  {answers.format === id && <Check className="ml-auto size-4 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 rounded-full border border-border px-4 py-2 ds-label text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="size-4" /> Back
              </button>
              <button type="button" disabled={!canAdvance} onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40">
                Find partners <ArrowRight className="size-4" />
              </button>
            </div>
          </QuestionStep>
        )}
        {step === 4 && results && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 flex items-center justify-between">
              <p className="ds-label text-foreground">{results.length} additional experts matched</p>
              <button type="button" onClick={() => { setStep(1); setResults(null); setAnswers({ topic: '', expertise: '', format: null }) }}
                className="ds-caption text-muted-foreground transition-colors hover:text-foreground">Start over</button>
            </div>
            <div className="space-y-3">
              {results.map(({ expert, score }) => (
                <ExpertCard key={expert.id} expert={expert} score={score}
                  onConnect={handleConnect} sent={sent.has(expert.id)} onOpen={setOpenExpert} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcription section */}
      <TranscriptionSection />

      {/* Expert drawer */}
      <AnimatePresence>
        {openExpert && (
          <ExpertDrawer expert={openExpert} answers={drawerAnswers} onConnect={handleConnect}
            sent={sent.has(openExpert.id)} onClose={() => setOpenExpert(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
