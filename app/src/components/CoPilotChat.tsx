import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThesisStore } from '@/stores/thesis-store'
import { buildSystemPrompt } from '@/data/mockContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const STAGE_LABEL: Record<string, string> = {
  orientation: 'Orientation',
  'topic-discovery': 'Topic & Supervisor',
  'supervisor-search': 'Planning',
  planning: 'Execution',
  'execution-writing': 'Writing',
}

const STARTER_PROMPTS: Record<string, string[]> = {
  orientation: [
    'What should I do first?',
    'How long does a thesis usually take?',
    'Which topics match a CS background?',
  ],
  'topic-discovery': [
    'Help me shortlist 3 good topics',
    'Write a cold email to a professor',
    'What makes a strong thesis topic?',
  ],
  'supervisor-search': [
    'What goes in a thesis proposal?',
    'Qualitative vs quantitative — which fits me?',
    'How do I negotiate milestones?',
  ],
  planning: [
    'Help me structure my literature review',
    'Write interview questions for a logistics expert',
    "I'm stuck on my analysis — help me",
  ],
  'execution-writing': [
    'Is my introduction too broad?',
    'How do I incorporate conflicting feedback?',
    'What are typical formatting requirements?',
  ],
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

/* ── CoPilotChat ────────────────────────────────────────────────── */

interface CoPilotChatProps {
  onClose: () => void
}

export function CoPilotChat({ onClose }: CoPilotChatProps) {
  const { profile } = useThesisStore()
  const stage = profile.stage
  const concern = profile.concern
  const stageLabel = STAGE_LABEL[stage ?? ''] ?? 'Orientation'
  const starters = STARTER_PROMPTS[stage ?? 'orientation'] ?? STARTER_PROMPTS.orientation

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const systemPrompt = buildSystemPrompt(stage, concern)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setStreaming(false)
      }
    },
    [messages, streaming, systemPrompt],
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

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-background"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-foreground">
            <Sparkles className="size-3.5 text-background" />
          </div>
          <div>
            <p className="ds-label text-foreground leading-none">Co-Pilot</p>
            <p className="ds-caption text-muted-foreground mt-0.5">{stageLabel} stage</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close Co-Pilot"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-4">
            {/* Welcome */}
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground">
                <Bot className="size-3 text-background" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5">
                <p className="ds-body text-foreground leading-relaxed">
                  Hi! I'm your thesis Co-Pilot. I'm tuned to your{' '}
                  <span className="font-medium">{stageLabel}</span> stage and I have access to
                  available topics, supervisors, and partner companies.
                </p>
                <p className="ds-body mt-1.5 text-foreground leading-relaxed">
                  What can I help you with today?
                </p>
              </div>
            </div>

            {/* Starter prompts */}
            <div className="flex flex-col gap-2 pl-8">
              <p className="ds-caption text-muted-foreground">Try asking:</p>
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="ds-caption w-fit rounded-xl border border-border px-3 py-2 text-left text-muted-foreground transition-all hover:border-foreground/30 hover:bg-secondary hover:text-foreground"
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
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-foreground text-background'
                  : 'rounded-tl-sm bg-secondary text-foreground'
              }`}
            >
              {msg.content ? (
                <p className="ds-body whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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

      {/* Input */}
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
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
          aria-label="Send"
        >
          {streaming ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
        </button>
      </form>
    </motion.div>
  )
}
