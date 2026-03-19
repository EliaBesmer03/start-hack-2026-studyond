import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, Loader2, Sparkles, StickyNote, Trash2, Plus, Brain, MessageSquarePlus } from 'lucide-react'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import { useThesisStore } from '@/stores/thesis-store'
import type { Message, KnowledgeCategory } from '@/stores/thesis-store'
import type { ThesisStage } from '@/types/thesis'
import { buildSystemPrompt, KNOWLEDGE_EXTRACTION_PROMPT } from '@/data/mockContext'

// ── Co-Pilot modes ────────────────────────────────────────────────────

export type CoPilotMode = 'topic' | 'planning' | 'analysis'

export const COPILOT_MODES: { id: CoPilotMode; label: string; subtitle: string }[] = [
  { id: 'topic',    label: 'Topic',    subtitle: 'Find & refine your research topic' },
  { id: 'planning', label: 'Planning', subtitle: 'Proposals, methodology & registration' },
  { id: 'analysis', label: 'Analysis', subtitle: 'Data collection, analysis & findings' },
]

const MODE_STARTERS: Record<CoPilotMode, string[]> = {
  topic: [
    'Help me shortlist 3 strong thesis topics',
    'What makes a good research question?',
    'Write a cold email to a potential supervisor',
    'Which topics fit a business/CS background?',
  ],
  planning: [
    'What goes in a thesis proposal?',
    'Qualitative vs. quantitative — which fits me?',
    'Help me draft milestones for the next 8 weeks',
    'What do I need to register my thesis?',
    'How do I justify my methodology choice?',
    'Write my registration abstract',
    'What are the pros and cons of interviews vs. surveys?',
    'How often should I schedule check-ins with my supervisor?',
    'Review the structure of my proposal draft',
    'What should I align with my supervisor before starting?',
    'Help me draft a timeline for my proposal',
    'What are typical thesis registration deadlines?',
  ],
  analysis: [
    'Help me plan my data collection timeline',
    'Write interview questions for my research topic',
    'How many survey responses do I need for significance?',
    'How do I structure my findings chapter?',
    'Help me interpret these interview themes',
    "I'm stuck on my analysis — where do I start?",
    'How do I code qualitative interview data?',
    'What statistical tests fit my research design?',
    'Help me turn my data into a clear narrative',
    'What goes in a discussion section vs. findings?',
    'How do I handle conflicting data points?',
    'Review the logic of my analysis structure',
  ],
}

const MODE_ROLE_BASE: Record<CoPilotMode, string> = {
  topic: `You are the **Topic Co-Pilot** — an expert academic advisor helping students find, refine, and commit to a thesis topic. You have deep knowledge of available research topics, supervisors, and partner companies. Help the student explore ideas, evaluate fit, and craft personalised outreach to supervisors. Be concise, practical, and encouraging. Always reference the student's specific bookmarks, shortlists, and stated interests — never give generic advice when you have their real data.`,
  planning: `You are the **Planning Co-Pilot** — a thesis project manager and academic writing coach. You specialise in research methodology (qualitative, quantitative, mixed-methods, design science), thesis proposals, supervisor milestone planning, and university registration processes. Give structured, actionable advice grounded in the student's confirmed topic and supervisor. Help them produce concrete deliverables: proposals, milestone plans, registration abstracts — all tailored to their specific research direction.`,
  analysis: `You are the **Analysis Co-Pilot** — a research methods and data analysis expert. You help students design data collection instruments (surveys, interview guides tailored to their specific domain experts), execute primary research, and analyse and interpret findings. You assist with both qualitative coding and quantitative statistical reasoning. Always ground your advice in the student's confirmed topic, their accepted interview experts, and any literature they have saved. Help them turn their specific raw data into clear, well-structured academic findings.`,
}

/* ── Direct Anthropic streaming ─────────────────────────────────── */

async function* streamAnthropic(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
): AsyncGenerator<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    yield "Please set VITE_ANTHROPIC_API_KEY in your .env file to enable Co-Pilot. For now, I'm here in demo mode — ask me anything and I'll do my best!"
    return
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${err}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          yield parsed.delta.text as string
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}

/* ── Knowledge extraction (background) ─────────────────────────── */

async function extractKnowledge(
  recentMessages: { role: 'user' | 'assistant'; content: string }[],
  stage: ThesisStage,
): Promise<import('@/stores/thesis-store').KnowledgeFact[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || recentMessages.length < 2) return []

  try {
    const conversationText = recentMessages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: KNOWLEDGE_EXTRACTION_PROMPT,
        messages: [{ role: 'user', content: conversationText }],
      }),
    })

    if (!res.ok) return []

    const data = await res.json()
    const text = data.content?.[0]?.text ?? '[]'
    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((f: { content?: string; category?: string }) => f.content && f.category)
      .map((f: { content: string; category: string }) => ({
        id: crypto.randomUUID(),
        content: f.content,
        sourceStage: stage,
        category: f.category as KnowledgeCategory,
        createdAt: Date.now(),
      }))
  } catch {
    return []
  }
}

/* ── CoPilotChat ────────────────────────────────────────────────── */

interface CoPilotChatProps {
  onClose: () => void
  starterPrompt?: string | null
  initialMode?: CoPilotMode
}

const MIN_WIDTH = 300
const MAX_WIDTH = 700

export function CoPilotChat({ onClose, starterPrompt, initialMode }: CoPilotChatProps) {
  const {
    profile, chatHistories, knowledgeFacts, thesisNotes, universityGuidelines,
    saveStageChatMessages, addKnowledgeFacts, addThesisNote, removeThesisNote,
    favouriteTopicIds, shortlistedSupervisorIds, acceptedExpertIds,
    finalDecision, timeline, tasks, savedLiterature, surveyAnswers,
  } = useThesisStore()

  const [mode, setMode] = useState<CoPilotMode>(initialMode ?? 'topic')
  const [panelWidth, setPanelWidth] = useState(400)
  const resizeDragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizeDragRef.current = { startX: e.clientX, startWidth: panelWidth }
    const onMove = (ev: MouseEvent) => {
      if (!resizeDragRef.current) return
      const dx = resizeDragRef.current.startX - ev.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeDragRef.current.startWidth + dx))
      setPanelWidth(newWidth)
    }
    const onUp = () => {
      resizeDragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panelWidth])

  const stage = profile.stage
  const currentStage: ThesisStage = (stage ?? 'orientation') as ThesisStage
  const concern = profile.concern

  const [tab, setTab] = useState<'chat' | 'memory'>('chat')

  // Per-mode messages — use stage chat histories keyed by mode
  const [messages, setMessages] = useState<Message[]>(
    () => chatHistories[currentStage] ?? [],
  )
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const extractionCountRef = useRef(0)

  const { acceptedTwinId, savedMatchIds, timelineHandIn, timelineColumns } = useThesisStore()

  const progress = {
    favouriteTopicIds,
    shortlistedSupervisorIds,
    acceptedExpertIds,
    acceptedTwinId,
    savedMatchIds,
    finalDecision,
    timeline,
    timelineHandIn,
    timelineColumns,
    tasks: tasks.map((t) => ({ title: t.title, stageId: t.stageId, status: t.status })),
    onboardingAnswers: profile.answers,
    studentName: profile.name,
    studentEmail: profile.email,
    surveyAnswers,
  }

  // Build system prompt: mode-specific role + full personalised base context
  const systemPrompt = `${MODE_ROLE_BASE[mode]}\n\n${buildSystemPrompt(stage, concern, thesisNotes, universityGuidelines, knowledgeFacts, progress, savedLiterature, mode)}`

  // Reset messages when mode changes
  useEffect(() => {
    setMessages([])
    setError(null)
    extractionCountRef.current = 0
  }, [mode])

  // Update initial mode when prop changes (e.g. opened from Planning feature)
  useEffect(() => {
    if (initialMode) setMode(initialMode)
  }, [initialMode])

  // Persist messages to store whenever they change
  useEffect(() => {
    saveStageChatMessages(currentStage, messages)
  }, [messages, saveStageChatMessages, currentStage])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when switching to chat tab
  useEffect(() => {
    if (tab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [tab])

  // Auto-send starterPrompt on mount
  const starterSentRef = useRef(false)
  useEffect(() => {
    if (starterPrompt && !starterSentRef.current) {
      starterSentRef.current = true
      setTimeout(() => sendMessage(starterPrompt), 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterPrompt])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      setError(null)
      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const assistantId = crypto.randomUUID()

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setInput('')
      setStreaming(true)

      try {
        const history = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: trimmed },
        ]

        let accumulated = ''
        for await (const chunk of streamAnthropic(history, systemPrompt)) {
          accumulated += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          )
        }

        extractionCountRef.current += 1
        if (extractionCountRef.current % 3 === 0) {
          const recentForExtraction = [
            ...history,
            { role: 'assistant' as const, content: accumulated },
          ]
          extractKnowledge(recentForExtraction, currentStage).then((facts) => {
            if (facts.length > 0) addKnowledgeFacts(facts)
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setStreaming(false)
      }
    },
    [messages, streaming, systemPrompt, currentStage, addKnowledgeFacts],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleAddNote = () => {
    const trimmed = noteInput.trim()
    if (!trimmed) return
    addThesisNote(trimmed)
    setNoteInput('')
  }

  const handleNewChat = useCallback(() => {
    if (streaming) return
    if (messages.length >= 2) {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      extractKnowledge(history, currentStage).then((facts) => {
        if (facts.length > 0) addKnowledgeFacts(facts)
      })
    }
    setMessages([])
    setError(null)
    extractionCountRef.current = 0
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [messages, streaming, currentStage, addKnowledgeFacts])

  const currentModeStarters = MODE_STARTERS[mode]
  const currentModeMeta = COPILOT_MODES.find((m) => m.id === mode)!

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex h-full shrink-0 flex-col border-l border-border bg-background"
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-foreground/10 transition-colors"
        title="Drag to resize"
      />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-ai">
            <Sparkles className="size-3.5 text-background" />
          </div>
          <div>
            <p className="ds-label text-foreground leading-none">Co-Pilot</p>
            <p className="ds-caption text-muted-foreground mt-0.5">{currentModeMeta.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={streaming || messages.length === 0}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="New chat"
            title="Start a new conversation (memory is kept)"
          >
            <MessageSquarePlus className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close Co-Pilot"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex shrink-0 gap-1.5 border-b border-border px-3 py-2.5">
        {COPILOT_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 ds-caption font-medium transition-colors ${
              mode === m.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('chat')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 ds-caption font-medium transition-colors ${
            tab === 'chat' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="size-3.5" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setTab('memory')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 ds-caption font-medium transition-colors ${
            tab === 'memory' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="size-3.5" />
          Memory
          {(thesisNotes.length + knowledgeFacts.length) > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-foreground ds-badge text-background">
              {thesisNotes.length + knowledgeFacts.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Chat tab ── */}
      {tab === 'chat' && (
        <>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-4">
                {/* Welcome */}
                <div className="flex gap-2.5">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground">
                    <Bot className="size-3 text-background" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-secondary px-3.5 py-2.5">
                    <p className="ds-body text-foreground leading-relaxed">
                      Hi! I'm your <span className="font-medium">{currentModeMeta.label} Co-Pilot</span>. {currentModeMeta.subtitle}.
                    </p>
                    {(knowledgeFacts.length > 0 || thesisNotes.length > 0) && (
                      <p className="ds-body mt-1.5 text-foreground leading-relaxed">
                        I have your <span className="font-medium">{thesisNotes.length + knowledgeFacts.length} memory item{(thesisNotes.length + knowledgeFacts.length) > 1 ? 's' : ''}</span> loaded.
                      </p>
                    )}
                    <p className="ds-body mt-1.5 text-foreground leading-relaxed">
                      What can I help you with today?
                    </p>
                  </div>
                </div>

                {/* Starter prompts */}
                <div className="flex flex-col gap-2 pl-8">
                  <p className="ds-caption text-muted-foreground">Try asking:</p>
                  {currentModeStarters.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="ds-caption w-fit rounded-full border border-border px-3 py-2 text-left text-muted-foreground transition-all hover:border-foreground/30 hover:bg-secondary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground">
                    <Bot className="size-3 text-background" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-foreground text-background'
                      : 'rounded-tl-sm bg-secondary text-foreground'
                  }`}
                >
                  {msg.content ? (
                    msg.role === 'assistant' ? (
                      <div className="ds-body leading-relaxed prose-chat">
                        <Markdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            h1: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
                            h2: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
                            h3: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
                            code: ({ children }) => <code className="rounded bg-background/50 px-1 py-0.5 ds-caption">{children}</code>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a>,
                          }}
                        >
                          {msg.content}
                        </Markdown>
                      </div>
                    ) : (
                      <p className="ds-body whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                      <span className="ds-caption text-muted-foreground">Thinking…</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5">
                <p className="ds-caption text-destructive">{error}</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-end gap-2 border-t border-border px-3 py-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Co-Pilot…"
              rows={1}
              disabled={streaming}
              className="ds-body flex-1 resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none disabled:opacity-50"
              style={{ maxHeight: 120, overflowY: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
              aria-label="Send"
            >
              {streaming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          </form>
        </>
      )}

      {/* ── Memory tab ── */}
      {tab === 'memory' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">

            {/* Profile Notes */}
            <div>
              <p className="ds-label mb-1 text-foreground">Profile Notes</p>
              <p className="ds-caption mb-3 text-muted-foreground">
                Injected into every conversation — record your preferences, decisions, and constraints.
              </p>
              {thesisNotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-6 text-center">
                  <StickyNote className="mx-auto mb-2 size-5 text-muted-foreground/30" />
                  <p className="ds-caption text-muted-foreground/50">No notes yet — add one below</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {thesisNotes.map((note, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5"
                    >
                      <p className="ds-body flex-1 leading-relaxed text-foreground">{note}</p>
                      <button
                        type="button"
                        onClick={() => removeThesisNote(i)}
                        className="shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                        aria-label="Remove note"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learned Facts */}
            <div>
              <p className="ds-label mb-1 text-foreground">Learned Facts</p>
              <p className="ds-caption mb-3 text-muted-foreground">
                Automatically extracted from your conversations. Shared across all Co-Pilots.
              </p>
              {knowledgeFacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-6 text-center">
                  <Brain className="mx-auto mb-2 size-5 text-muted-foreground/30" />
                  <p className="ds-caption text-muted-foreground/50">No memories yet — chat to build your knowledge base</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {knowledgeFacts.map((fact) => (
                    <div
                      key={fact.id}
                      className="group flex items-start gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5"
                    >
                      <div className="flex-1">
                        <p className="ds-body leading-relaxed text-foreground">{fact.content}</p>
                        <p className="ds-caption mt-1 text-muted-foreground">
                          {fact.sourceStage} · {fact.category}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => useThesisStore.getState().removeKnowledgeFact(fact.id)}
                        className="shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                        aria-label="Remove fact"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note input */}
          <div className="flex shrink-0 items-end gap-2 border-t border-border px-3 py-3">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddNote()
                }
              }}
              placeholder="Add a profile note…"
              rows={2}
              className="ds-body flex-1 resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteInput.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
              aria-label="Add note"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
